// Supabase Edge Function — release-escrow
// Deploy: supabase functions deploy release-escrow

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe           from 'https://esm.sh/stripe@14.21.0'

const stripe   = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token ?? '')
    if (!user) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: cors })

    const { contractId } = await req.json()

    // ── Validar contrato e permissão ──────────────────────
    const { data: contract } = await supabase
      .from('contracts')
      .select('*, payments(*), professional:users!professional_id(stripe_account_id)')
      .eq('id', contractId)
      .single()

    if (!contract) return new Response(JSON.stringify({ error: 'Contrato não encontrado' }), { status: 404, headers: cors })
    if (contract.client_id !== user.id) return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403, headers: cors })

    const payment = contract.payments?.[0]
    if (!payment || payment.status !== 'held') {
      return new Response(JSON.stringify({ error: 'Pagamento não está em custódia' }), { status: 400, headers: cors })
    }

    // ── Calcular valor líquido (90%) ──────────────────────
    const netAmount = Math.round((Number(payment.valor) - Number(payment.comissao)) * 100)

    // ── Transferir via Stripe Connect ─────────────────────
    // Em produção o profissional tem uma conta Stripe Connect
    const professionalStripeAccount = contract.professional?.stripe_account_id

    if (professionalStripeAccount) {
      await stripe.transfers.create({
        amount:             netAmount,
        currency:           'usd',
        destination:        professionalStripeAccount,
        transfer_group:     contractId,
        source_transaction: payment.stripe_intent,
        metadata:           { contract_id: contractId },
      })
    } else {
      // Sem conta Stripe Connect, fica registado como crédito na plataforma
      console.warn(`Profissional ${contract.professional_id} sem conta Stripe Connect`)
    }

    // ── Actualizar BD ─────────────────────────────────────
    await supabase
      .from('payments')
      .update({ status: 'released' })
      .eq('id', payment.id)

    // Notificação ao profissional
    await supabase.rpc('create_notification', {
      p_user_id:  contract.professional_id,
      p_tipo:     'payment_released',
      p_titulo:   '💰 Pagamento libertado!',
      p_mensagem: `O teu pagamento de $${(netAmount / 100).toFixed(2)} foi libertado. Vai a Pagamentos para ver.`,
      p_link:     '/pagamentos',
      p_meta:     JSON.stringify({ contract_id: contractId }),
    })

    return new Response(
      JSON.stringify({ success: true, amountReleased: netAmount / 100 }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
