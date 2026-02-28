import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { contractService } from '@/services/contractService'
import { projectService } from '@/services/projectService'
import {
  FolderOpen, FileText, CreditCard,
  ChevronRight, Plus, TrendingUp,
  Clock, CheckCircle, AlertCircle,
} from 'lucide-react'
import { Button, Card, EmptyState, Avatar, StatusBadge } from '@/components/ui'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

// ── Cartão de estatística ────────────────────────────────────
function StatCard({ label, value, Icon, color, sub }) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <div className="font-syne font-black text-3xl mb-0.5">{value}</div>
        <div className="text-[var(--muted)] text-sm">{label}</div>
        {sub && <div className="text-xs text-[var(--muted)] mt-1 opacity-70">{sub}</div>}
      </div>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={20} />
      </div>
    </Card>
  )
}

// ── Dashboard do cliente ─────────────────────────────────────
function ClientDashboard({ stats, recentProjects }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Boas-vindas + acção rápida */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-black text-2xl">Visão Geral</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">Acompanha os teus projectos e contratos</p>
        </div>
        <Link to="/projectos">
          <Button variant="primary" size="sm">
            <Plus size={15} /> Publicar Projecto
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Projectos"        value={stats.totalProjects}   Icon={FolderOpen}   color="bg-accent/10 text-accent" />
        <StatCard label="Em aberto"        value={stats.openProjects}    Icon={Clock}        color="bg-amber-500/10 text-amber-400" />
        <StatCard label="Contratos activos" value={stats.activeContracts} Icon={FileText}     color="bg-blue-500/10 text-blue-400" />
        <StatCard
          label="Gasto total"
          value={`$${stats.totalSpent?.toFixed(0)}`}
          Icon={CreditCard}
          color="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {/* Projectos recentes */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-base">Projectos recentes</h2>
          <Link to="/projectos" className="text-accent text-xs flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight size={13} />
          </Link>
        </div>

        {!recentProjects.length ? (
          <EmptyState
            icon={<FolderOpen size={22} className="text-[var(--muted)]" />}
            title="Nenhum projecto ainda"
            description="Publica o teu primeiro projecto e recebe propostas de profissionais."
            action={
              <Link to="/projectos">
                <Button variant="primary" size="sm"><Plus size={14} /> Publicar Projecto</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {recentProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.titulo}</div>
                  <div className="text-[var(--muted)] text-xs mt-0.5">
                    {p.proposals?.length ?? 0} proposta{(p.proposals?.length ?? 0) !== 1 ? 's' : ''}
                    {' · '}{format(new Date(p.created_at), 'dd MMM', { locale: pt })}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Dashboard do profissional ────────────────────────────────
function ProfessionalDashboard({ stats, profile }) {
  const isPending = profile?.status === 'pending_approval'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-black text-2xl">
          Olá, {profile?.nome} 👋
        </h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          {isPending
            ? 'O teu perfil está a aguardar aprovação.'
            : 'Encontra projectos e gere as tuas propostas.'
          }
        </p>
      </div>

      {/* Aviso pendente */}
      {isPending && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
          <AlertCircle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm text-amber-400 mb-0.5">Conta pendente de aprovação</div>
            <div className="text-[var(--muted)] text-sm">
              A nossa equipa está a analisar o teu perfil. Normalmente demora 24–48 horas.
              Receberás um email quando for aprovado.
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {!isPending && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Propostas enviadas" value={stats.totalProposals}   Icon={FileText}   color="bg-accent/10 text-accent" />
          <StatCard label="Em análise"          value={stats.pendingProposals} Icon={Clock}      color="bg-amber-500/10 text-amber-400" />
          <StatCard label="Contratos activos"   value={stats.activeContracts}  Icon={FolderOpen} color="bg-blue-500/10 text-blue-400" />
          <StatCard
            label="Total ganho"
            value={`$${stats.totalEarned?.toFixed(0)}`}
            Icon={TrendingUp}
            color="bg-emerald-500/10 text-emerald-400"
            sub="após comissão 10%"
          />
        </div>
      )}

      {/* CTA para ir ao feed */}
      {!isPending && (
        <Card className="flex items-center justify-between gap-4 p-5">
          <div>
            <div className="font-syne font-bold text-base mb-1">Encontra o teu próximo projecto</div>
            <div className="text-[var(--muted)] text-sm">
              Vê todos os projectos abertos e envia a tua proposta.
            </div>
          </div>
          <Link to="/projectos">
            <Button variant="primary" size="sm">
              Ver feed <ChevronRight size={15} />
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats]   = useState({})
  const [projects, setProj] = useState([])
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    if (!profile) return
    const load = async () => {
      setLoad(true)
      try {
        const [s, p] = await Promise.all([
          contractService.getDashboardStats(profile.role),
          profile.role === 'cliente' ? projectService.getMyProjects() : Promise.resolve([]),
        ])
        setStats(s)
        setProj(p)
      } catch (e) {
        console.error(e)
      } finally {
        setLoad(false)
      }
    }
    load()
  }, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--muted)] text-sm">
        A carregar...
      </div>
    )
  }

  if (profile?.role === 'profissional') {
    return <ProfessionalDashboard stats={stats} profile={profile} />
  }

  return <ClientDashboard stats={stats} recentProjects={projects} />
}
