import { supabase } from '@/lib/supabase'

export const proposalService = {

  // ── Profissional submete proposta ────────────────────────
  async submit({ projectId, valor, mensagem }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        project_id:      projectId,
        professional_id: user.id,
        valor:           Number(valor),
        mensagem,
        status:          'pending',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Já enviaste uma proposta para este projecto.')
      throw new Error(error.message)
    }
    return data
  },

  // ── Propostas do profissional autenticado ────────────────
  async getMyProposals() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        project:projects (
          id, titulo, descricao, orcamento, categoria, status,
          client:users!client_id (nome, apelido, avatar_url)
        )
      `)
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  // ── Cliente aceita proposta → cria contrato ──────────────
  async accept(proposalId) {
    const { data: { user } } = await supabase.auth.getUser()

    // Buscar proposta e projecto
    const { data: proposal, error: pErr } = await supabase
      .from('proposals')
      .select('*, project:projects(*)')
      .eq('id', proposalId)
      .single()

    if (pErr) throw new Error(pErr.message)

    // Verificar que o cliente é dono do projecto
    if (proposal.project.client_id !== user.id) {
      throw new Error('Não tens permissão para aceitar esta proposta.')
    }

    const comissao = Number((proposal.valor * 0.10).toFixed(2))

    // Transacção: aceitar proposta + rejeitar outras + criar contrato + actualizar projecto
    const { data: contract, error: cErr } = await supabase.rpc('accept_proposal', {
      p_proposal_id:    proposalId,
      p_project_id:     proposal.project_id,
      p_professional_id: proposal.professional_id,
      p_client_id:      user.id,
      p_valor:          proposal.valor,
      p_comissao:       comissao,
    })

    if (cErr) throw new Error(cErr.message)
    return contract
  },

  // ── Cliente rejeita proposta ─────────────────────────────
  async reject(proposalId) {
    const { error } = await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('id', proposalId)

    if (error) throw new Error(error.message)
  },
}
