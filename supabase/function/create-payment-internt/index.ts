// Supabase Edge Function — create-payment-intent
// Deploy: supabase functions deploy create-payment-intent

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe           from 'https://esm.sh/stripe@14.21.0'

const stripe    = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' })
const supabase  = createClient(
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
    // ── Autenticação ──────────────────────────────────────
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: cors })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: cors })

    const { contractId } = await req.json()
    if (!contractId) return new Response(JSON.stringify({ error: 'contractId obrigatório' }), { status: 400, headers: cors })

    // ── Validar contrato ──────────────────────────────────
    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select('*, client:users!client_id(email, nome), professional:users!professional_id(id)')
      .eq('id', contractId)
      .single()

    if (cErr || !contract) return new Response(JSON.stringify({ error: 'Contrato não encontrado' }), { status: 404, headers: cors })
    if (contract.client_id !== user.id) return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403, headers: cors })
    if (contract.status !== 'active') return new Response(JSON.stringify({ error: 'Contrato não está activo' }), { status: 400, headers: cors })

    // Verificar se já existe pagamento
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status')
      .eq('contract_id', contractId)
      .maybeSingle()

    if (existing && existing.status !== 'refunded') {
      return new Response(JSON.stringify({ error: 'Pagamento já existe para este contrato' }), { status: 400, headers: cors })
    }

    // ── Criar Stripe Customer se necessário ───────────────
    let customerId = contract.client?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: contract.client.email,
        name:  contract.client.nome,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Guardar customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId } as any)
        .eq('id', user.id)
    }

    // ── Criar PaymentIntent ───────────────────────────────
    const amountCents = Math.round(Number(contract.valor_total) * 100)

    const intent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        contract_id:     contractId,
        professional_id: contract.professional_id,
        client_id:       contract.client_id,
      },
      description: `ConnectHub — Contrato ${contractId.slice(0, 8)}`,
    })

    // ── Registar pagamento na BD (status=pending) ─────────
    const comissao = Math.round(amountCents * 0.10) / 100

    await supabase
      .from('payments')
      .upsert({
        contract_id:   contractId,
        stripe_intent: intent.id,
        valor:         Number(contract.valor_total),
        comissao,
        status:        'pending',
      })

    return new Response(
      JSON.stringify({
        clientSecret:    intent.client_secret,
        paymentIntentId: intent.id,
        amount:          amountCents,
      }),
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
