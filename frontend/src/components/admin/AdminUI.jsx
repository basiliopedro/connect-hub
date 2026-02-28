import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

// ── Cartão de estatística ────────────────────────────────────
export function StatCard({ label, value, Icon, color, sub, trend }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5
      flex items-start justify-between hover:border-[var(--border2)] transition-colors">
      <div className="min-w-0">
        <div className="font-syne font-black text-3xl leading-none mb-1 truncate">{value}</div>
        <div className="text-[var(--muted)] text-sm">{label}</div>
        {sub && <div className="text-[var(--muted)] text-xs mt-0.5 opacity-70">{sub}</div>}
        {trend !== undefined && (
          <div className={clsx('text-xs mt-1 font-medium', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% este mês
          </div>
        )}
      </div>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', color)}>
        <Icon size={20} />
      </div>
    </div>
  )
}

// ── Badge de status ──────────────────────────────────────────
const STATUS_CONFIG = {
  // utilizadores
  active:           { label: 'Activo',     bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400' },
  pending_approval: { label: 'Pendente',   bg: 'bg-amber-500/10 border-amber-500/25',     text: 'text-amber-400' },
  blocked:          { label: 'Bloqueado',  bg: 'bg-red-500/10 border-red-500/25',         text: 'text-red-400' },
  // projectos
  open:             { label: 'Aberto',     bg: 'bg-blue-500/10 border-blue-500/25',       text: 'text-blue-400' },
  in_progress:      { label: 'Em curso',   bg: 'bg-purple-500/10 border-purple-500/25',   text: 'text-purple-400' },
  completed:        { label: 'Concluído',  bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400' },
  cancelled:        { label: 'Cancelado',  bg: 'bg-[var(--surface3)] border-[var(--border)]', text: 'text-[var(--muted)]' },
  // pagamentos
  pending:          { label: 'Pendente',   bg: 'bg-amber-500/10 border-amber-500/25',     text: 'text-amber-400' },
  held:             { label: 'Custódia',   bg: 'bg-blue-500/10 border-blue-500/25',       text: 'text-blue-400' },
  released:         { label: 'Libertado',  bg: 'bg-emerald-500/10 border-emerald-500/25', text: 'text-emerald-400' },
  refunded:         { label: 'Reembolsado',bg: 'bg-purple-500/10 border-purple-500/25',   text: 'text-purple-400' },
  // roles
  admin:            { label: 'Admin',      bg: 'bg-red-500/10 border-red-500/25',         text: 'text-red-400' },
  cliente:          { label: 'Cliente',    bg: 'bg-[var(--surface2)] border-[var(--border)]', text: 'text-[var(--muted)]' },
  profissional:     { label: 'Profissional', bg: 'bg-accent/10 border-accent/25',         text: 'text-accent' },
}

export function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-[var(--surface2)] border-[var(--border)]', text: 'text-[var(--muted)]' }
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap',
      cfg.bg, cfg.text
    )}>
      {cfg.label}
    </span>
  )
}

// ── Tabela admin ─────────────────────────────────────────────
export function AdminTable({ columns, rows, loading, emptyText = 'Sem resultados' }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)] text-sm">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        A carregar...
      </div>
    )
  }
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-[var(--muted)]">
        <div className="text-3xl opacity-20">—</div>
        <p className="text-sm">{emptyText}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map(col => (
              <th key={col.key} className={clsx(
                'text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]',
                col.className
              )}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
              {columns.map(col => (
                <td key={col.key} className={clsx('px-4 py-3.5 text-sm', col.cellClass)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Paginação ────────────────────────────────────────────────
export function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i)
  }
  return (
    <div className="flex items-center gap-2 justify-end pt-4">
      <span className="text-xs text-[var(--muted)] mr-2">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
      </span>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-1.5 rounded-lg hover:bg-[var(--surface2)] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={clsx(
            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
            p === page
              ? 'bg-accent text-white'
              : 'hover:bg-[var(--surface2)] text-[var(--muted)]'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg hover:bg-[var(--surface2)] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ── Cabeçalho de secção ──────────────────────────────────────
export function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
      <div>
        <h1 className="font-syne font-black text-2xl leading-tight">{title}</h1>
        {subtitle && <p className="text-[var(--muted)] text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ── Célula de utilizador (avatar + nome + email) ─────────────
export function UserCell({ user, sub }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={user?.avatar_url} name={`${user?.nome} ${user?.apelido}`} size="sm" />
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate">{user?.nome} {user?.apelido}</div>
        <div className="text-[var(--muted)] text-xs truncate">{sub ?? user?.email ?? ''}</div>
      </div>
    </div>
  )
}

// ── Data formatada ───────────────────────────────────────────
export function DateCell({ date }) {
  if (!date) return <span className="text-[var(--muted)]">—</span>
  return (
    <div>
      <div className="text-sm">{format(new Date(date), 'dd MMM yyyy', { locale: pt })}</div>
      <div className="text-[var(--muted)] text-xs">{format(new Date(date), 'HH:mm')}</div>
    </div>
  )
}

// ── Filtros de tabela ────────────────────────────────────────
export function TableFilters({ search, onSearch, filters, className }) {
  return (
    <div className={clsx('flex gap-3 flex-wrap mb-5', className)}>
      {onSearch !== undefined && (
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface)]
              border border-[var(--border2)] text-[var(--text)] text-sm outline-none
              focus:border-accent transition-colors placeholder:text-[var(--muted)]"
          />
        </div>
      )}
      {(filters ?? []).map(f => (
        <select
          key={f.key}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border2)]
            text-[var(--text)] text-sm outline-none focus:border-accent cursor-pointer"
        >
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
    </div>
  )
}

// ── Card de container de tabela ──────────────────────────────
export function TableCard({ children }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden">
      {children}
    </div>
  )
}
