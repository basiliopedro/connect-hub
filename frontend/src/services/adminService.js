import { supabase } from '@/lib/supabase'

/**
 * adminService — todas as operações do painel administrativo.
 * O RLS do Supabase bloqueia qualquer utilizador sem role='admin'.
 */
export const adminService = {

  // ════════════════════════════════════════════════════════
  // ESTATÍSTICAS GLOBAIS
  // ════════════════════════════════════════════════════════

  async getStats() {
    const [
      { count: totalUsers },
      { count: totalClientes },
      { count: totalProfissionais },
      { count: pendingCount },
      { count: blockedCount },
      { count: openProjects },
      { count: inProgressProjects },
      { count: completedProjects },
      { count: activeContracts },
      { count: completedContracts },
      { data: paymentsData },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'cliente'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'profissional'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('payments').select('valor, comissao, status'),
      supabase.from('users')
        .select('id, nome, apelido, role, status, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    const payments = paymentsData ?? []
    const escrowTotal    = payments.filter(p => p.status === 'held').reduce((s, p) => s + Number(p.valor), 0)
    const revenueTotal   = payments.filter(p => p.status === 'released').reduce((s, p) => s + Number(p.comissao), 0)
    const processedTotal = payments.filter(p => p.status === 'released').reduce((s, p) => s + Number(p.valor), 0)

    return {
      totalUsers:        totalUsers ?? 0,
      totalClientes:     totalClientes ?? 0,
      totalProfissionais: totalProfissionais ?? 0,
      pendingCount:      pendingCount ?? 0,
      blockedCount:      blockedCount ?? 0,
      openProjects:      openProjects ?? 0,
      inProgressProjects: inProgressProjects ?? 0,
      completedProjects: completedProjects ?? 0,
      activeContracts:   activeContracts ?? 0,
      completedContracts: completedContracts ?? 0,
      escrowTotal,
      revenueTotal,
      processedTotal,
      recentUsers: recentUsers ?? [],
    }
  },

  // ── Crescimento mensal (últimos 6 meses) ──────────────────
  async getGrowthData() {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const [{ data: users }, { data: projects }, { data: payments }] = await Promise.all([
      supabase.from('users').select('created_at, role').gte('created_at', sixMonthsAgo.toISOString()),
      supabase.from('projects').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
      supabase.from('payments').select('created_at, comissao').eq('status', 'released').gte('created_at', sixMonthsAgo.toISOString()),
    ])

    const months = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = {
        label:    d.toLocaleString('pt', { month: 'short' }),
        users:    0,
        projects: 0,
        revenue:  0,
      }
    }

    ;(users ?? []).forEach(u => {
      const key = u.created_at.slice(0, 7)
      if (months[key]) months[key].users++
    })
    ;(projects ?? []).forEach(p => {
      const key = p.created_at.slice(0, 7)
      if (months[key]) months[key].projects++
    })
    ;(payments ?? []).forEach(p => {
      const key = p.created_at.slice(0, 7)
      if (months[key]) months[key].revenue += Number(p.comissao)
    })

    return Object.values(months)
  },

  // ════════════════════════════════════════════════════════
  // UTILIZADORES
  // ════════════════════════════════════════════════════════

  async getAllUsers({ page = 1, perPage = 15, search = '', role = '', status = '' } = {}) {
    let query = supabase
      .from('users')
      .select(`
        *,
        professional_profiles (area, tarifa_hora, aprovado_em, localizacao)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (search) query = query.or(`nome.ilike.%${search}%,apelido.ilike.%${search}%`)
    if (role)   query = query.eq('role', role)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { users: data ?? [], total: count ?? 0 }
  },

  async getUserDetail(userId) {
    const [
      { data: user },
      { data: projects },
      { data: contracts },
      { data: proposals },
    ] = await Promise.all([
      supabase.from('users').select('*, professional_profiles(*)').eq('id', userId).single(),
      supabase.from('projects').select('id, titulo, status, created_at, orcamento').eq('client_id', userId).limit(5),
      supabase.from('contracts').select('id, status, valor_total, created_at')
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`).limit(5),
      supabase.from('proposals').select('id, status, valor, created_at').eq('professional_id', userId).limit(5),
    ])
    return { user, projects: projects ?? [], contracts: contracts ?? [], proposals: proposals ?? [] }
  },

  async blockUser(userId) {
    const { error } = await supabase.from('users').update({ status: 'blocked' }).eq('id', userId)
    if (error) throw new Error(error.message)
    await supabase.rpc('create_notification', {
      p_user_id: userId, p_tipo: 'account_blocked',
      p_titulo: '🚫 Conta suspensa',
      p_mensagem: 'A tua conta foi suspensa pelo administrador. Contacta o suporte em suporte@connecthub.ao.',
    }).catch(() => {})
  },

  async unblockUser(userId) {
    const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId)
    if (error) throw new Error(error.message)
    await supabase.rpc('create_notification', {
      p_user_id: userId, p_tipo: 'account_approved',
      p_titulo: '✅ Conta reactivada',
      p_mensagem: 'A tua conta foi reactivada. Bem-vindo de volta ao ConnectHub!',
      p_link: '/dashboard',
    }).catch(() => {})
  },

  // ════════════════════════════════════════════════════════
  // APROVAÇÕES
  // ════════════════════════════════════════════════════════

  async getPendingProfessionals() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        professional_profiles (
          id, area, descricao, tarifa_hora, localizacao,
          idade, cv_url, portfolio_urls, created_at
        )
      `)
      .eq('role', 'profissional')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async approveProfessional(userId) {
    const { data: { user: admin } } = await supabase.auth.getUser()
    const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId)
    if (error) throw new Error(error.message)
    await supabase.from('professional_profiles').update({
      aprovado_em:  new Date().toISOString(),
      aprovado_por: admin.id,
    }).eq('user_id', userId)
    await supabase.rpc('create_notification', {
      p_user_id: userId, p_tipo: 'account_approved',
      p_titulo: '🎉 Perfil aprovado!',
      p_mensagem: 'O teu perfil foi aprovado. Já podes candidatar-te a projectos e receber propostas.',
      p_link: '/dashboard',
    }).catch(() => {})
    await supabase.functions.invoke('send-approval-notification', { body: { userId, approved: true } }).catch(() => {})
  },

  async rejectProfessional(userId, motivo = '') {
    const { error } = await supabase.from('users').update({ status: 'blocked' }).eq('id', userId)
    if (error) throw new Error(error.message)
    await supabase.rpc('create_notification', {
      p_user_id: userId, p_tipo: 'account_blocked',
      p_titulo: 'Perfil não aprovado',
      p_mensagem: motivo
        ? `O teu perfil não foi aprovado. Motivo: ${motivo}`
        : 'O teu perfil não cumpriu os requisitos da plataforma neste momento.',
    }).catch(() => {})
    await supabase.functions.invoke('send-approval-notification', { body: { userId, approved: false, motivo } }).catch(() => {})
  },

  // ════════════════════════════════════════════════════════
  // PROJECTOS
  // ════════════════════════════════════════════════════════

  async getAllProjects({ page = 1, perPage = 15, status = '', search = '' } = {}) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        client:users!client_id (id, nome, apelido, avatar_url),
        proposals (id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('titulo', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return {
      projects: (data ?? []).map(p => ({ ...p, proposalsCount: p.proposals?.length ?? 0 })),
      total: count ?? 0,
    }
  },

  async cancelProject(projectId) {
    const { error } = await supabase.from('projects').update({ status: 'cancelled' }).eq('id', projectId)
    if (error) throw new Error(error.message)
  },

  // ════════════════════════════════════════════════════════
  // CONTRATOS
  // ════════════════════════════════════════════════════════

  async getAllContracts({ page = 1, perPage = 15, status = '' } = {}) {
    let query = supabase
      .from('contracts')
      .select(`
        *,
        project:projects (titulo, categoria),
        client:users!client_id (id, nome, apelido, avatar_url),
        professional:users!professional_id (id, nome, apelido, avatar_url),
        payments (id, status, valor)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { contracts: data ?? [], total: count ?? 0 }
  },

  // ════════════════════════════════════════════════════════
  // PAGAMENTOS
  // ════════════════════════════════════════════════════════

  async getAllPayments({ page = 1, perPage = 15, status = '' } = {}) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        contract:contracts (
          id, valor_total, comissao,
          project:projects (titulo),
          client:users!client_id (nome, apelido),
          professional:users!professional_id (nome, apelido)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return { payments: data ?? [], total: count ?? 0 }
  },

  async getFinancialSummary() {
    const { data } = await supabase.from('payments').select('valor, comissao, status')
    const all = data ?? []
    return {
      totalProcessed: all.filter(p => p.status === 'released').reduce((s, p) => s + Number(p.valor), 0),
      totalRevenue:   all.filter(p => p.status === 'released').reduce((s, p) => s + Number(p.comissao), 0),
      totalEscrow:    all.filter(p => p.status === 'held').reduce((s, p) => s + Number(p.valor), 0),
      totalRefunded:  all.filter(p => p.status === 'refunded').reduce((s, p) => s + Number(p.valor), 0),
      count: {
        pending:  all.filter(p => p.status === 'pending').length,
        held:     all.filter(p => p.status === 'held').length,
        released: all.filter(p => p.status === 'released').length,
        refunded: all.filter(p => p.status === 'refunded').length,
      },
    }
  },

  async getCvSignedUrl(cvPath) {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(cvPath, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },
}
