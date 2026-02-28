import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { notificationService } from '@/services/notificationService'
import { useToast } from '@/components/ui/Toast'

const NotificationContext = createContext(null)

const TIPO_ICONS = {
  new_proposal:       '📩',
  proposal_accepted:  '🎉',
  proposal_rejected:  '❌',
  new_message:        '💬',
  contract_completed: '✅',
  payment_released:   '💰',
  account_approved:   '🟢',
  account_blocked:    '🚫',
}

export function NotificationProvider({ children }) {
  const { user }       = useAuth()
  const { show }       = useToast()
  const [items, set]   = useState([])
  const [unread, setU] = useState(0)
  const [loading, setL] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setL(true)
    try {
      const [data, count] = await Promise.all([
        notificationService.getAll({ limit: 30 }),
        notificationService.countUnread(),
      ])
      set(data)
      setU(count)
    } catch {}
    finally { setL(false) }
  }, [user])

  // Carrega ao iniciar sessão
  useEffect(() => { load() }, [load])

  // Subscrição em tempo real
  useEffect(() => {
    if (!user) return

    const unsub = notificationService.subscribe(user.id, (notif) => {
      // Adiciona à lista local imediatamente
      set(prev => [notif, ...prev])
      setU(prev => prev + 1)

      // Toast de sistema para notificações em tempo real
      const icon = TIPO_ICONS[notif.tipo] ?? '🔔'
      show(`${icon} ${notif.titulo}`, 'info', 4500)
    })

    return unsub
  }, [user, show])

  const markRead = async (id) => {
    await notificationService.markRead(id)
    set(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    setU(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await notificationService.markAllRead()
    set(prev => prev.map(n => ({ ...n, lida: true })))
    setU(0)
  }

  return (
    <NotificationContext.Provider value={{ items, unread, loading, markRead, markAllRead, reload: load }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications fora do provider')
  return ctx
}
