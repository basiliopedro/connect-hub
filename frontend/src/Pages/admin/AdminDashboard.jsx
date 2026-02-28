import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import { StatCard, Badge, AdminPageHeader, UserCell, DateCell } from '@/components/admin/AdminUI'
import {
  Users, Clock, FolderOpen, FileText,
  CreditCard, DollarSign, TrendingUp,
  ShieldOff, CheckCircle, ChevronRight,
  Activity,
} from 'lucide-react'

// ── Mini gráfico de barras ────────────────────────────────────
function MiniBar({ data, valueKey, color, label }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div>
      <div className="text-xs text-[var(--muted)] mb-3 font-medium">{label}</div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-sm transition-all duration-500 ${color}`}
              style={{ height: `${Math.max((d[valueKey] / max) * 56, d[valueKey] > 0 ? 4 : 0)}px` }}
            />
            <span className="text-[9px] text-[var(--muted)]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card de alerta pendente ───────────────────────────────────
function AlertBanner({ count }) {
  if (!count) return null
  return (
    <Link to="/admin/aprovacoes">
      <div className="flex items-center gap-4 p-4 rounded-[18px]
        bg-amber-500/8 border border-amber-500/20
        hover:bg-amber-500/12 transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25
          flex items-center justify-center flex-shrink-0">
          <Clock size={18} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-amber-400">
            {count} profissional{count > 1 ? 'is' : ''} aguarda{count > 1 ? 'm' : ''} aprovação
          </div>
          <div className="text-[var(--muted)] text-xs mt-0.5">
            Clica para rever os perfis e aprovar ou rejeitar
          </div>
        </div>
        <ChevronRight size={16} className="text-amber-400 flex-shrink-0" />
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const { show }        = useToast()
  const [stats, setStats]  = useState(null)
  const [growth, setGrowth] = useState([])
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoad(true)
      try {
        const [s, g] = await Promise.all([
          adminService.getStats(),
          adminService.getGrowthData(),
        ])
        setStats(s)
        setGrowth(g)
      } catch (err) {
        show(err.message, 'error')
      } finally {
        setLoad(false)
      }
    }
    load()
  }, [show])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-[var(--muted)]">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        A carregar dashboard...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Visão geral em tempo real da plataforma ConnectHub"
      />

      {/* Banner de pendentes */}
      <AlertBanner count={stats.pendingCount} />

      {/* ── Grid de stats: utilizadores ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
          Utilizadores
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total"        value={stats.totalUsers}         Icon={Users}     color="bg-accent/10 text-accent" />
          <StatCard label="Clientes"     value={stats.totalClientes}      Icon={Users}     color="bg-blue-500/10 text-blue-400" />
          <StatCard label="Profissionais" value={stats.totalProfissionais} Icon={Users}     color="bg-purple-500/10 text-purple-400" />
          <StatCard
            label="Pendentes"
            value={stats.pendingCount}
            Icon={Clock}
            color={stats.pendingCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-[var(--surface2)] text-[var(--muted)]'}
            sub={stats.pendingCount > 0 ? 'aguardam aprovação' : undefined}
          />
        </div>
      </div>

      {/* ── Grid de stats: negócio ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
          Actividade
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projectos abertos" value={stats.openProjects}        Icon={FolderOpen} color="bg-blue-500/10 text-blue-400" />
          <StatCard label="Em progresso"       value={stats.inProgressProjects}  Icon={Activity}   color="bg-purple-500/10 text-purple-400" />
          <StatCard label="Contratos activos"  value={stats.activeContracts}     Icon={FileText}   color="bg-orange-500/10 text-orange-400" />
          <StatCard label="Concluídos"         value={stats.completedContracts}  Icon={CheckCircle} color="bg-emerald-500/10 text-emerald-400" />
        </div>
      </div>

      {/* ── Grid de stats: financeiro ── */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
          Financeiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Volume processado"
            value={`$${stats.processedTotal.toFixed(0)}`}
            Icon={CreditCard}
            color="bg-emerald-500/10 text-emerald-400"
            sub="contratos concluídos"
          />
          <StatCard
            label="Em custódia (escrow)"
            value={`$${stats.escrowTotal.toFixed(0)}`}
            Icon={DollarSign}
            color="bg-blue-500/10 text-blue-400"
            sub="aguarda conclusão"
          />
          <StatCard
            label="Receita da plataforma"
            value={`$${stats.revenueTotal.toFixed(0)}`}
            Icon={TrendingUp}
            color="bg-accent/10 text-accent"
            sub="comissões (10%)"
          />
        </div>
      </div>

      {/* ── Gráficos de crescimento ── */}
      {growth.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
            <MiniBar data={growth} valueKey="users"    color="bg-accent"          label="Novos utilizadores" />
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
            <MiniBar data={growth} valueKey="projects" color="bg-blue-500"        label="Projectos publicados" />
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-5">
            <MiniBar data={growth} valueKey="revenue"  color="bg-emerald-500"     label="Receita ($)" />
          </div>
        </div>
      )}

      {/* ── Utilizadores recentes ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="font-syne font-bold text-base">Últimas inscrições</h3>
          <Link to="/admin/utilizadores"
            className="text-accent text-xs flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight size={13} />
          </Link>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {stats.recentUsers.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
              <UserCell user={u} sub={u.role} />
              <div className="ml-auto flex items-center gap-3">
                <Badge status={u.status} />
                <Badge status={u.role} />
                <DateCell date={u.created_at} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Acções rápidas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/aprovacoes',   label: 'Aprovações',   Icon: Clock,      color: 'text-amber-400',   count: stats.pendingCount },
          { to: '/admin/utilizadores', label: 'Utilizadores', Icon: Users,      color: 'text-accent' },
          { to: '/admin/projectos',    label: 'Projectos',    Icon: FolderOpen, color: 'text-blue-400' },
          { to: '/admin/pagamentos',   label: 'Pagamentos',   Icon: CreditCard, color: 'text-emerald-400' },
        ].map(({ to, label, Icon, color, count }) => (
          <Link key={to} to={to}>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[18px] p-4
              hover:border-[var(--border2)] hover:bg-[var(--surface2)] transition-all duration-200
              flex flex-col gap-3 cursor-pointer">
              <Icon size={20} className={color} />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black
                    text-[10px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
