import { supabase } from '@/lib/supabase'

export const notificationService = {

  // ── Buscar notificações do utilizador ─────────────────────
  async getAll({ limit = 20, onlyUnread = false } = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (onlyUnread) query = query.eq('lida', false)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Contar não lidas ──────────────────────────────────────
  async countUnread() {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('lida', false)

    if (error) return 0
    return count ?? 0
  },

  // ── Marcar uma como lida ──────────────────────────────────
  async markRead(notificationId) {
    await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('id', notificationId)
  },

  // ── Marcar todas como lidas ───────────────────────────────
  async markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('notifications')
      .update({ lida: true })
      .eq('user_id', user.id)
      .eq('lida', false)
  },

  // ── Subscrever a notificações em tempo real ───────────────
  subscribe(userId, onNotification) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => onNotification(payload.new)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  },
}
