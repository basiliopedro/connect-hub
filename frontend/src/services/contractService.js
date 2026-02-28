import { supabase } from '@/lib/supabase'

export const contractService = {

  // ── Contratos do utilizador autenticado ──────────────────
  async getMyContracts() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        project:projects (titulo, categoria, descricao),
        client:users!client_id (id, nome, apelido, avatar_url),
        professional:users!professional_id (id, nome, apelido, avatar_url),
        payments (id, status, valor)
      `)
      .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  // ── Detalhe do contrato ───────────────────────────────────
  async getById(id) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        project:projects (*),
        client:users!client_id (id, nome, apelido, avatar_url),
        professional:users!professional_id (
          id, nome, apelido, avatar_url,
          professional_profiles (area, tarifa_hora)
        ),
        payments (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // ── Cliente marca contrato como concluído ─────────────────
  async markCompleted(contractId) {
    const { data: { user } } = await supabase.auth.getUser()

    // Verificar permissão
    const { data: contract } = await supabase
      .from('contracts')
      .select('client_id')
      .eq('id', contractId)
      .single()

    if (contract.client_id !== user.id) {
      throw new Error('Apenas o cliente pode marcar como concluído.')
    }

    const { error } = await supabase
      .from('contracts')
      .update({ status: 'completed' })
      .eq('id', contractId)

    if (error) throw new Error(error.message)

    // Actualiza projecto
    const { data: full } = await supabase
      .from('contracts')
      .select('project_id')
      .eq('id', contractId)
      .single()

    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', full.project_id)
  },

  // ── Estatísticas do dashboard ────────────────────────────
  async getDashboardStats(role) {
    const { data: { user } } = await supabase.auth.getUser()

    if (role === 'cliente') {
      const [projects, contracts] = await Promise.all([
        supabase.from('projects').select('id, status').eq('client_id', user.id),
        supabase.from('contracts').select('id, status, valor_total').eq('client_id', user.id),
      ])

      const myProjects  = projects.data ?? []
      const myContracts = contracts.data ?? []

      return {
        totalProjects:   myProjects.length,
        openProjects:    myProjects.filter(p => p.status === 'open').length,
        activeContracts: myContracts.filter(c => c.status === 'active').length,
        totalSpent:      myContracts
          .filter(c => c.status === 'completed')
          .reduce((sum, c) => sum + Number(c.valor_total), 0),
      }
    }

    if (role === 'profissional') {
      const [proposals, contracts] = await Promise.all([
        supabase.from('proposals').select('id, status').eq('professional_id', user.id),
        supabase.from('contracts').select('id, status, valor_total, comissao').eq('professional_id', user.id),
      ])

      const myProposals = proposals.data ?? []
      const myContracts = contracts.data ?? []

      const earned = myContracts
        .filter(c => c.status === 'completed')
        .reduce((sum, c) => sum + (Number(c.valor_total) - Number(c.comissao)), 0)

      return {
        totalProposals:   myProposals.length,
        pendingProposals: myProposals.filter(p => p.status === 'pending').length,
        activeContracts:  myContracts.filter(c => c.status === 'active').length,
        totalEarned:      earned,
      }
    }

    return {}
  },
}
