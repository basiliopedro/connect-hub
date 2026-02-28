import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

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

export function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate        = useNavigate()
  const ref             = useRef()

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (notif) => {
    if (!notif.lida) await markRead(notif.id)
    if (notif.link)  navigate(notif.link)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Botão */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'relative p-2 rounded-xl transition-colors',
          open
            ? 'bg-accent/10 text-accent'
            : 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
        )}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full
            bg-accent text-white text-[10px] font-bold
            flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] max-h-[480px]
          bg-[var(--surface)] border border-[var(--border)] rounded-[20px]
          shadow-2xl overflow-hidden z-50 flex flex-col
          animate-[slideIn_0.2s_cubic-bezier(0.22,1,0.36,1)]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4
            border-b border-[var(--border)]">
            <div className="font-syne font-bold text-base">
              Notificações
              {unread > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                  {unread} novas
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => { markAllRead(); }}
                className="flex items-center gap-1 text-xs text-[var(--muted)]
                  hover:text-accent transition-colors"
              >
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="overflow-y-auto flex-1">
            {!items.length ? (
              <div className="flex flex-col items-center gap-2 py-10 text-[var(--muted)]">
                <Bell size={28} className="opacity-30" />
                <p className="text-sm">Sem notificações</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    'w-full flex items-start gap-3 px-5 py-4 text-left transition-colors',
                    'border-b border-[var(--border)] last:border-0',
                    !n.lida
                      ? 'bg-accent/4 hover:bg-accent/8'
                      : 'hover:bg-[var(--surface2)]'
                  )}
                >
                  {/* Ícone */}
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {TIPO_ICONS[n.tipo] ?? '🔔'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx(
                        'text-sm leading-snug',
                        !n.lida ? 'font-semibold text-[var(--text)]' : 'text-[var(--text)]'
                      )}>
                        {n.titulo}
                      </p>
                      {!n.lida && (
                        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed line-clamp-2">
                      {n.mensagem}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] mt-1.5 opacity-70">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
