import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { adminService } from '@/services/adminService'
import {
  LayoutDashboard, Users, Clock, FolderOpen,
  FileText, CreditCard, LogOut, Sun, Moon,
  Menu, X, ShieldAlert, Bell,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV = [
  { to: '/admin/painel',           label: 'Dashboard',     Icon: LayoutDashboard },
  { to: '/admin/aprovacoes',       label: 'Aprovações',    Icon: Clock,       badge: 'pending' },
  { to: '/admin/utilizadores',     label: 'Utilizadores',  Icon: Users },
  { to: '/admin/projectos',        label: 'Projectos',     Icon: FolderOpen },
  { to: '/admin/contratos',        label: 'Contratos',     Icon: FileText },
  { to: '/admin/pagamentos',       label: 'Pagamentos',    Icon: CreditCard },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const navigate             = useNavigate()
  const [open, setOpen]      = useState(false)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    adminService.getStats()
      .then(s => setPending(s.pendingCount))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]">
      {/* Cabeçalho */}
      <div className="px-5 pt-6 pb-5 border-b border-[var(--border)]">
        <div className="font-syne font-black text-xl gradient-text mb-2">
          CONNECT HUB
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-widest">
          <ShieldAlert size={11} />
          ADMIN OFFICE
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-0.5">
        {NAV.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin/painel'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150',
              isActive
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
            )}
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {badge === 'pending' && pending > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black
                text-[10px] font-bold flex items-center justify-center">
                {pending > 9 ? '9+' : pending}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Rodapé do admin */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/25
            flex items-center justify-center text-xs font-bold text-red-400 flex-shrink-0">
            {profile?.nome?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{profile?.nome} {profile?.apelido}</div>
            <div className="text-[10px] text-red-400 font-semibold">Administrador</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggle}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs
              text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-colors"
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            {isDark ? 'Claro' : 'Escuro'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs
              text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">

      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-shrink-0 w-[230px]">
        <div className="w-full">
          <Sidebar />
        </div>
      </div>

      {/* Sidebar mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-[230px] z-50 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3
          bg-[var(--surface)] border-b border-[var(--border)]">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-[var(--surface2)]">
            <Menu size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-syne font-black gradient-text text-base leading-none">CONNECT HUB</span>
            <span className="text-[9px] text-red-400 font-bold tracking-widest">ADMIN OFFICE</span>
          </div>
          <button onClick={toggle} className="p-2 rounded-xl hover:bg-[var(--surface2)]">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            <Outlet context={{ reloadPending: () =>
              adminService.getStats().then(s => setPending(s.pendingCount)).catch(() => {})
            }} />
          </div>
        </main>
      </div>
    </div>
  )
}
