import { supabase } from '@/lib/supabase'

export const paymentService = {

  // ── Criar intenção de pagamento (Stripe) ──────────────────
  // Chamado quando o cliente aceita uma proposta e quer pagar
  async createPaymentIntent(contractId) {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { contractId },
    })

    if (error) throw new Error(error.message ?? 'Erro ao criar pagamento')
    if (data?.error) throw new Error(data.error)

    return data // { clientSecret, paymentIntentId, amount }
  },

  // ── Confirmar pagamento (após Stripe.js confirmar) ────────
  async confirmPayment(contractId, stripeIntentId) {
    // Regista o pagamento como 'held' (em custódia)
    const { error } = await supabase
      .from('payments')
      .update({ status: 'held' })
      .eq('stripe_intent', stripeIntentId)

    if (error) throw new Error(error.message)
  },

  // ── Libertar pagamento para o profissional ────────────────
  // Chamado quando o cliente marca o contrato como concluído
  async releaseEscrow(contractId) {
    const { data, error } = await supabase.functions.invoke('release-escrow', {
      body: { contractId },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    return data
  },

  // ── Histórico de pagamentos do utilizador ─────────────────
  async getMyPayments() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        contracts (
          valor_total, comissao, status,
          project:projects (titulo),
          client:users!client_id (nome, apelido),
          professional:users!professional_id (nome, apelido)
        )
      `)
      .or(
        `contracts.client_id.eq.${user.id},contracts.professional_id.eq.${user.id}`
      )
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Buscar status do pagamento de um contrato ─────────────
  async getContractPayment(contractId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('contract_id', contractId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data
  },
}
