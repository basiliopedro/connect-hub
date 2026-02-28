import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

/* ─── BUTTON ─────────────────────────────────────────────── */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-gradient-to-r from-accent to-accent-2 text-white shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_32px_rgba(124,92,252,0.5)] hover:-translate-y-px',
    outline: 'border border-[var(--border2)] bg-transparent text-[var(--text)] hover:bg-[var(--surface2)] hover:border-accent',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]',
    success: 'bg-emerald-400 text-black font-semibold hover:bg-emerald-500',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

/* ─── INPUT ──────────────────────────────────────────────── */
export function Input({ label, error, hint, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[var(--muted)]">{label}</label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-3 rounded-xl text-sm',
          'bg-[var(--surface2)] border border-[var(--border2)]',
          'text-[var(--text)] placeholder:text-[var(--muted)]',
          'outline-none transition-all duration-200',
          'focus:border-accent focus:ring-2 focus:ring-accent/10',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  )
}

/* ─── SELECT ─────────────────────────────────────────────── */
export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[var(--muted)]">{label}</label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-3 rounded-xl text-sm',
          'bg-[var(--surface2)] border border-[var(--border2)]',
          'text-[var(--text)]',
          'outline-none transition-all duration-200',
          'focus:border-accent focus:ring-2 focus:ring-accent/10',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

/* ─── TEXTAREA ───────────────────────────────────────────── */
export function Textarea({ label, error, hint, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-[var(--muted)]">{label}</label>
      )}
      <textarea
        className={clsx(
          'w-full px-4 py-3 rounded-xl text-sm resize-y min-h-[90px]',
          'bg-[var(--surface2)] border border-[var(--border2)]',
          'text-[var(--text)] placeholder:text-[var(--muted)]',
          'outline-none transition-all duration-200',
          'focus:border-accent focus:ring-2 focus:ring-accent/10',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  )
}

/* ─── CARD ───────────────────────────────────────────────── */
export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── STATUS BADGE ───────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    active: { label: 'Activo', cls: 'badge-active' },
    pending_approval: { label: 'Pendente', cls: 'badge-pending' },
    blocked: { label: 'Bloqueado', cls: 'badge-blocked' },
    admin: { label: 'Admin', cls: 'badge-admin' },
    open: { label: 'Aberto', cls: 'badge-active' },
    in_progress: { label: 'Em progresso', cls: 'badge-pending' },
    completed: { label: 'Concluído', cls: 'badge-active' },
    cancelled: { label: 'Cancelado', cls: 'badge-blocked' },
  }
  const { label, cls } = map[status] || { label: status, cls: '' }
  return (
    <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', cls)}>
      {label}
    </span>
  )
}

/* ─── EMPTY STATE ────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--surface2)] flex items-center justify-center text-2xl mb-2">
        {icon}
      </div>
      <h4 className="font-syne font-bold text-base">{title}</h4>
      {description && (
        <p className="text-[var(--muted)] text-sm max-w-xs leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}

/* ─── PASSWORD STRENGTH ──────────────────────────────────── */
export function PasswordStrength({ password }) {
  const { getPasswordStrength } = require('@/utils/validators')
  const { score, label, color } = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={clsx('h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? color : 'bg-[var(--border2)]'
            )}
          />
        ))}
      </div>
      {label && (
        <p className="text-xs mt-1 text-[var(--muted)]">Password: {label}</p>
      )}
    </div>
  )
}

/* ─── AVATAR ─────────────────────────────────────────────── */
export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' }
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className={clsx(
      sizes[size],
      'rounded-full overflow-hidden flex-shrink-0',
      'bg-gradient-to-br from-accent to-accent-2',
      'flex items-center justify-center text-white font-semibold'
    )}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : initials
      }
    </div>
  )
}
