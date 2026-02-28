import { supabase } from '@/lib/supabase'

export const chatService = {

  // ── Buscar mensagens de um contrato ──────────────────────
  async getMessages(contractId) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id (id, nome, apelido, avatar_url)
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  // ── Enviar mensagem ───────────────────────────────────────
  async sendMessage(contractId, conteudo) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        contract_id: contractId,
        sender_id:   user.id,
        conteudo:    conteudo.trim(),
      })
      .select(`*, sender:users!sender_id (id, nome, apelido, avatar_url)`)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  // ── Marcar mensagens como lidas ───────────────────────────
  async markAsRead(contractId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('messages')
      .update({ lida: true })
      .eq('contract_id', contractId)
      .neq('sender_id', user.id)
      .eq('lida', false)
  },

  // ── Subscrever a mensagens em tempo real ──────────────────
  subscribeToMessages(contractId, onMessage) {
    const channel = supabase
      .channel(`chat:${contractId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `contract_id=eq.${contractId}`,
        },
        async (payload) => {
          // Busca os dados completos do remetente
          const { data } = await supabase
            .from('messages')
            .select(`*, sender:users!sender_id (id, nome, apelido, avatar_url)`)
            .eq('id', payload.new.id)
            .single()

          if (data) onMessage(data)
        }
      )
      .subscribe()

    // Retorna função de cleanup
    return () => supabase.removeChannel(channel)
  },

  // ── Listar conversas (contratos com mensagens) ────────────
  async getConversations() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id, status, created_at,
        project:projects (titulo, categoria),
        client:users!client_id (id, nome, apelido, avatar_url),
        professional:users!professional_id (id, nome, apelido, avatar_url),
        messages (id, conteudo, lida, sender_id, created_at)
      `)
      .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    // Processar: última mensagem + contagem de não lidas
    return (data ?? []).map((c) => {
      const msgs = c.messages ?? []
      const sorted = [...msgs].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      )
      const unread = msgs.filter(m => !m.lida && m.sender_id !== user.id).length
      const other  = c.client_id === user.id ? c.professional : c.client

      return {
        ...c,
        lastMessage:  sorted[0] ?? null,
        unreadCount:  unread,
        otherParty:   other,
      }
    }).filter(c => true) // podemos filtrar só os que têm mensagens
  },
}
