import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Clock, FolderOpen, DollarSign,
  CheckCircle, XCircle, ShieldOff, ShieldCheck,
  ExternalLink, Search, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import { Button, StatusBadge, Avatar, EmptyState } from '@/components/ui'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

// ── Sidebar items ────────────────────────────────────────────
const NAV = [
  { id: 'overview',       label: 'Dashboard',     Icon: FolderOpen },
  { id: 'approvals',      label: 'Aprovações',     Icon: Clock },
  { id: 'users',          label: 'Utilizadores',   Icon: Users },
  { id: 'projects',       label: 'Projectos',      Icon: FolderOpen },
  { id: 'payments',       label: 'Pagamentos',     Icon: DollarSign },
]

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, Icon, color }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6
      flex justify-between items-start">
      <div>
        <div className="font-syne font-black text-3xl mb-1">{value}</div>
        <div className="text-[var(--muted)] text-sm">{label}</div>
      </div>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
        <Icon size={20} />
      </div>
    </div>
  )
}

// ── Overview tab ─────────────────────────────────────────────
function OverviewTab({ stats, pending, onTabChange }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total utilizadores"       value={stats.totalUsers}     Icon={Users}      color="bg-accent/10 text-accent" />
        <StatCard label="Aprovações pendentes"     value={stats.pendingCount}   Icon={Clock}      color="bg-amber-500/10 text-amber-400" />
        <StatCard label="Projectos activos"        value={stats.activeProjects} Icon={FolderOpen} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Volume (USD)"             value={`$${stats.totalRevenue.toFixed(0)}`} Icon={DollarSign} color="bg-pink-500/10 text-pink-400" />
      </div>

      {/* Pendentes em destaque */}
      {pending.length > 0 && (
        <div className="bg-amber-500/6 border border-amber-500/18 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne font-bold text-base">
              ⏳ {pending.length} profissional{pending.length > 1 ? 'ais' : ''} aguarda{pending.length > 1 ? 'm' : ''} aprovação
            </h3>
            <Button variant="outline" size="sm" onClick={() => onTabChange('approvals')}>
              Ver todos →
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {pending.slice(0, 3).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar src={u.avatar_url} name={`${u.nome} ${u.apelido}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{u.nome} {u.apelido}</div>
                  <div className="text-[var(--muted)] text-xs truncate">
                    {u.professional_profiles?.area} · {u.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Approvals tab ────────────────────────────────────────────
function ApprovalsTab({ pending, onApprove, onReject, getCvUrl }) {
  if (!pending.length) {
    return (
      <EmptyState
        icon={<CheckCircle size={28} className="text-emerald-400" />}
        title="Nenhuma aprovação pendente"
        description="Quando profissionais se registarem, aparecerão aqui para análise."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {pending.map((user) => {
        const prof = user.professional_profiles
        return (
          <div key={user.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6">

            <div className="flex items-start gap-4 mb-4 flex-wrap">
              <Avatar src={user.avatar_url} name={`${user.nome} ${user.apelido}`} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-syne font-bold text-lg">
                    {user.nome} {user.apelido}
                  </h3>
                  <StatusBadge status="pending_approval" />
                </div>
                <div className="text-[var(--muted)] text-sm mb-1">{user.email}</div>
                <div className="text-sm">
                  <span className="font-medium">{prof?.area}</span>
                  {prof?.localizacao && <span className="text-[var(--muted)]"> · {prof.localizacao}</span>}
                  {prof?.idade && <span className="text-[var(--muted)]"> · {prof.idade} anos</span>}
                  {prof?.tarifa_hora && <span className="text-[var(--muted)]"> · ${prof.tarifa_hora}/h</span>}
                </div>
              </div>
              <div className="text-xs text-[var(--muted)]">
                Submetido em {format(new Date(user.created_at), 'dd MMM yyyy', { locale: pt })}
              </div>
            </div>

            {/* Descrição */}
            {prof?.descricao && (
              <div className="bg-[var(--surface2)] rounded-xl p-4 mb-4 text-sm text-[var(--muted)] leading-relaxed">
                {prof.descricao}
              </div>
            )}

            {/* Portfólio */}
            {prof?.portfolio_urls?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {prof.portfolio_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                      bg-accent/8 border border-accent/20 text-accent text-xs hover:bg-accent/12">
                    <ExternalLink size={11} /> Portfólio {i + 1}
                  </a>
                ))}
              </div>
            )}

            {/* CV */}
            {prof?.cv_url && (
              <button
                onClick={() => getCvUrl(prof.cv_url)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                  bg-[var(--surface2)] border border-[var(--border2)] text-xs
                  hover:border-accent hover:text-accent transition-colors mb-4"
              >
                <ExternalLink size={11} /> Ver Curriculum Vitae
              </button>
            )}

            {/* Acções */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <Button
                variant="success"
                size="sm"
                onClick={() => onApprove(user.id)}
                className="flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> Aprovar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onReject(user.id)}
                className="flex items-center gap-1.5"
              >
                <XCircle size={15} /> Rejeitar
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Users tab ────────────────────────────────────────────────
function UsersTab({ users, total, onBlock, onUnblock, search, setSearch }) {
  return (
    <div>
      {/* Pesquisa */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou email..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border2)]
            text-[var(--text)] text-sm outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden">
        {!users.length ? (
          <EmptyState
            icon={<Users size={24} className="text-[var(--muted)]" />}
            title="Nenhum utilizador encontrado"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Utilizador', 'Role', 'Estado', 'Registado em', 'Acções'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase
                      tracking-wider text-[var(--muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url} name={`${u.nome} ${u.apelido}`} size="sm" />
                        <div>
                          <div className="font-semibold text-sm">{u.nome} {u.apelido}</div>
                          <div className="text-[var(--muted)] text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx(
                        'px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
                        u.role === 'admin'        ? 'bg-red-500/10 text-red-400' :
                        u.role === 'profissional' ? 'bg-accent/10 text-accent' :
                        'bg-[var(--surface2)] text-[var(--muted)]'
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)] text-xs">
                      {format(new Date(u.created_at), 'dd/MM/yyyy', { locale: pt })}
                    </td>
                    <td className="px-5 py-4">
                      {u.role !== 'admin' && (
                        u.status === 'blocked' ? (
                          <button
                            onClick={() => onUnblock(u.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs
                              bg-emerald-500/10 border border-emerald-500/25 text-emerald-400
                              hover:bg-emerald-500/15 transition-colors"
                          >
                            <ShieldCheck size={12} /> Desbloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => onBlock(u.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs
                              bg-red-500/10 border border-red-500/25 text-red-400
                              hover:bg-red-500/15 transition-colors"
                          >
                            <ShieldOff size={12} /> Bloquear
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[var(--muted)] text-xs mt-3">{total} utilizador{total !== 1 ? 'es' : ''} total</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PAINEL PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { profile, signOut } = useAuth()
  const navigate             = useNavigate()
  const { show }             = useToast()

  const [activeTab, setActiveTab]   = useState('overview')
  const [sidebarOpen, setSidebar]   = useState(false)
  const [stats, setStats]           = useState({ totalUsers: 0, pendingCount: 0, activeProjects: 0, totalRevenue: 0 })
  const [pending, setPending]       = useState([])
  const [users, setUsers]           = useState([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, pendingData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingProfessionals(),
        adminService.getAllUsers({ search: userSearch }),
      ])
      setStats(statsData)
      setPending(pendingData)
      setUsers(usersData.users)
      setUsersTotal(usersData.total)
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [userSearch, show])

  useEffect(() => { load() }, [load])

  // Pesquisa com debounce
  useEffect(() => {
    const t = setTimeout(() => load(), 400)
    return () => clearTimeout(t)
  }, [userSearch]) // eslint-disable-line

  const handleApprove = async (userId) => {
    try {
      await adminService.approveProfessional(userId)
      show('✅ Profissional aprovado com sucesso!', 'success')
      load()
    } catch (err) { show(err.message, 'error') }
  }

  const handleReject = async (userId) => {
    if (!window.confirm('Tens a certeza que queres rejeitar este perfil?')) return
    try {
      await adminService.rejectProfessional(userId)
      show('Perfil rejeitado.', 'info')
      load()
    } catch (err) { show(err.message, 'error') }
  }

  const handleBlock = async (userId) => {
    if (!window.confirm('Bloquear esta conta?')) return
    try {
      await adminService.blockUser(userId)
      show('Conta bloqueada.', 'info')
      load()
    } catch (err) { show(err.message, 'error') }
  }

  const handleUnblock = async (userId) => {
    try {
      await adminService.unblockUser(userId)
      show('✅ Conta desbloqueada.', 'success')
      load()
    } catch (err) { show(err.message, 'error') }
  }

  const handleGetCvUrl = async (cvPath) => {
    try {
      const url = await adminService.getCvSignedUrl(cvPath)
      window.open(url, '_blank')
    } catch (err) { show(err.message, 'error') }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const tabProps = {
    overview:  { stats, pending, onTabChange: setActiveTab },
    approvals: { pending, onApprove: handleApprove, onReject: handleReject, getCvUrl: handleGetCvUrl },
    users:     { users, total: usersTotal, onBlock: handleBlock, onUnblock: handleUnblock, search: userSearch, setSearch: setUserSearch },
  }

  const titles = {
    overview: { title: 'Dashboard', sub: 'Visão geral da plataforma ConnectHub' },
    approvals: { title: 'Aprovações', sub: `${pending.length} profissional${pending.length !== 1 ? 'ais' : ''} aguarda${pending.length !== 1 ? 'm' : ''} análise` },
    users: { title: 'Utilizadores', sub: 'Gerir todas as contas da plataforma' },
    projects: { title: 'Projectos', sub: 'Todos os projectos publicados' },
    payments: { title: 'Pagamentos', sub: 'Histórico financeiro da plataforma' },
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={clsx(
        'fixed top-0 left-0 bottom-0 w-[250px] bg-[var(--surface)] border-r border-[var(--border)]',
        'flex flex-col px-4 py-6 z-50 transition-transform duration-300',
        'lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo + badge */}
        <div className="font-syne font-black text-xl gradient-text mb-3 px-2">
          CONNECT HUB
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
          bg-red-500/10 border border-red-500/22 text-red-400 text-[10px] font-bold
          tracking-wider mb-6 self-start">
          ADMIN OFFICE
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebar(false) }}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left w-full',
                activeTab === id
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
              )}
            >
              <Icon size={17} />
              {label}
              {id === 'approvals' && pending.length > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-black
                  text-[10px] font-bold flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/25
              flex items-center justify-center text-xs font-bold text-red-400">
              A
            </div>
            <div>
              <div className="text-sm font-semibold">{profile?.nome}</div>
              <div className="text-xs text-red-400">Administrador</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm
              text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-colors"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="lg:ml-[250px] flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-syne font-black text-2xl">
              {titles[activeTab]?.title}
            </h1>
            <p className="text-[var(--muted)] text-sm mt-1">
              {titles[activeTab]?.sub}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full
              bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Admin Online
            </span>
            <button
              onClick={() => setSidebar(true)}
              className="lg:hidden p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            A carregar...
          </div>
        ) : (
          <>
            {activeTab === 'overview'  && <OverviewTab   {...tabProps.overview} />}
            {activeTab === 'approvals' && <ApprovalsTab  {...tabProps.approvals} />}
            {activeTab === 'users'     && <UsersTab      {...tabProps.users} />}
            {activeTab === 'projects'  && (
              <EmptyState
                icon={<FolderOpen size={24} className="text-[var(--muted)]" />}
                title="Nenhum projecto publicado ainda"
                description="Os projectos aparecerão aqui assim que os clientes os publicarem."
              />
            )}
            {activeTab === 'payments'  && (
              <EmptyState
                icon={<DollarSign size={24} className="text-[var(--muted)]" />}
                title="Sem transacções ainda"
                description="O histórico financeiro aparecerá aqui assim que houver pagamentos."
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
