import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { NotificationBell } from '@/components/ui/NotificationBell'
import {
  LayoutDashboard, FolderOpen, FileText,
  MessageSquare, CreditCard, User, Settings,
  LogOut, Sun, Moon, Menu, X, Bell,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui'

// ── Itens de navegação por role ──────────────────────────────
const NAV_ITEMS = {
  cliente: [
    { to: '/dashboard',    label: 'Visão Geral',  Icon: LayoutDashboard },
    { to: '/projectos',    label: 'Meus Projectos', Icon: FolderOpen },
    { to: '/contratos',    label: 'Contratos',    Icon: FileText },
    { to: '/chat',         label: 'Mensagens',    Icon: MessageSquare, badge: true },
    { to: '/pagamentos',   label: 'Pagamentos',   Icon: CreditCard },
    { to: '/perfil',       label: 'Perfil',       Icon: User },
    { to: '/definicoes',   label: 'Definições',   Icon: Settings },
  ],
  profissional: [
    { to: '/dashboard',    label: 'Visão Geral',  Icon: LayoutDashboard },
    { to: '/projectos',    label: 'Feed de Projectos', Icon: FolderOpen },
    { to: '/propostas',    label: 'Minhas Propostas', Icon: FileText },
    { to: '/contratos',    label: 'Contratos',    Icon: FileText },
    { to: '/chat',         label: 'Mensagens',    Icon: MessageSquare, badge: true },
    { to: '/pagamentos',   label: 'Pagamentos',   Icon: CreditCard },
    { to: '/perfil',       label: 'Perfil',       Icon: User },
    { to: '/definicoes',   label: 'Definições',   Icon: Settings },
  ],
}

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const navigate             = useNavigate()
  const [open, setOpen]      = useState(false)

  const role    = profile?.role ?? 'cliente'
  const navList = NAV_ITEMS[role] ?? NAV_ITEMS.cliente

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={clsx(
      'flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]',
      mobile ? 'w-[260px]' : 'w-[230px]'
    )}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="font-syne font-black text-xl gradient-text">CONNECT HUB</div>
        {profile?.role === 'profissional' && profile?.status === 'pending_approval' && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25
            text-amber-400 text-xs">
            ⏳ Conta pendente de aprovação
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {navList.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => setOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-150',
              isActive
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
            )}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Utilizador + acções */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar
            src={profile?.avatar_url}
            name={`${profile?.nome} ${profile?.apelido}`}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">
              {profile?.nome} {profile?.apelido}
            </div>
            <div className="text-xs text-[var(--muted)] capitalize">{profile?.role}</div>
          </div>
          <NotificationBell />
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggle}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs
              text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-colors"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? 'Claro' : 'Escuro'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs
              text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">

      {/* Sidebar desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar mobile — overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 z-50 lg:hidden flex">
            <Sidebar mobile />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-[-44px] w-9 h-9 rounded-full
                bg-[var(--surface)] border border-[var(--border)]
                flex items-center justify-center text-[var(--muted)]"
            >
              <X size={18} />
            </button>
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3
          bg-[var(--surface)] border-b border-[var(--border)] flex-shrink-0">
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-[var(--surface2)]">
            <Menu size={20} />
          </button>
          <span className="font-syne font-black gradient-text text-lg">CONNECT HUB</span>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={toggle} className="p-2 rounded-xl hover:bg-[var(--surface2)]">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
