import { supabase } from '@/lib/supabase'

export const projectService = {

  // ── Criar projecto (cliente) ─────────────────────────────
  async create({ titulo, descricao, orcamento, categoria, prazo }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        client_id: user.id,
        titulo,
        descricao,
        orcamento: Number(orcamento),
        categoria,
        prazo,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // ── Feed público — projectos abertos ─────────────────────
  async getFeed({ page = 1, perPage = 12, categoria = '', search = '' } = {}) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        client:users!client_id (
          id, nome, apelido, avatar_url
        ),
        proposals (id)
      `, { count: 'exact' })
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    if (categoria) query = query.eq('categoria', categoria)
    if (search)    query = query.ilike('titulo', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      projects: data.map(p => ({ ...p, proposalsCount: p.proposals?.length ?? 0 })),
      total: count,
    }
  },

  // ── Projectos do cliente autenticado ─────────────────────
  async getMyProjects() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        proposals (
          id, status, valor, professional_id,
          professional:users!professional_id (nome, apelido, avatar_url)
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  },

  // ── Detalhe de um projecto ────────────────────────────────
  async getById(id) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:users!client_id (id, nome, apelido, avatar_url),
        proposals (
          *,
          professional:users!professional_id (
            id, nome, apelido, avatar_url,
            professional_profiles (area, tarifa_hora, localizacao)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // ── Cancelar projecto ────────────────────────────────────
  async cancel(projectId) {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'cancelled' })
      .eq('id', projectId)

    if (error) throw new Error(error.message)
  },
}
