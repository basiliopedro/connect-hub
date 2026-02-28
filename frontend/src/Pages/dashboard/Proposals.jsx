import { useEffect, useState } from 'react'
import { proposalService } from '@/services/proposalService'
import { useToast } from '@/components/ui/Toast'
import { Card, EmptyState, Avatar, StatusBadge } from '@/components/ui'
import { FileText, DollarSign, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { clsx } from 'clsx'

const STATUS_INFO = {
  pending:  { label: 'Em análise',  Icon: Clock,       color: 'text-amber-400' },
  accepted: { label: 'Aceite',      Icon: CheckCircle, color: 'text-emerald-400' },
  rejected: { label: 'Rejeitada',   Icon: XCircle,     color: 'text-red-400' },
}

function ProposalCard({ proposal }) {
  const project  = proposal.project
  const { label, Icon, color } = STATUS_INFO[proposal.status] ?? STATUS_INFO.pending

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-base truncate mb-0.5">
            {project?.titulo ?? 'Projecto'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
            {project?.client && (
              <>
                <Avatar src={project.client.avatar_url} name={project.client.nome} size="sm" />
                <span>{project.client.nome} {project.client.apelido}</span>
                <span>·</span>
              </>
            )}
            <span>{project?.categoria}</span>
            <span>·</span>
            <span>{format(new Date(proposal.created_at), 'dd MMM yyyy', { locale: pt })}</span>
          </div>
        </div>

        {/* Status */}
        <div className={clsx('flex items-center gap-1.5 text-xs font-semibold', color)}>
          <Icon size={14} />
          {label}
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--surface2)] rounded-xl p-3 text-center">
          <div className="text-xs text-[var(--muted)] mb-1">Orçamento do cliente</div>
          <div className="font-syne font-bold text-lg">${project?.orcamento}</div>
        </div>
        <div className="bg-accent/6 border border-accent/15 rounded-xl p-3 text-center">
          <div className="text-xs text-[var(--muted)] mb-1">A tua proposta</div>
          <div className="font-syne font-bold text-lg text-accent">${proposal.valor}</div>
        </div>
      </div>

      {/* Mensagem */}
      <div className="bg-[var(--surface2)] rounded-xl p-4">
        <p className="text-[var(--muted)] text-sm leading-relaxed line-clamp-4">
          {proposal.mensagem}
        </p>
      </div>

      {/* Aceite: mostrar info do contrato */}
      {proposal.status === 'accepted' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20
          text-emerald-400 text-sm">
          <CheckCircle size={15} />
          Proposta aceite — vai a <strong>Contratos</strong> para acompanhar o trabalho
        </div>
      )}
    </Card>
  )
}

export default function ProposalsPage() {
  const { show }         = useToast()
  const [proposals, set] = useState([])
  const [loading, setL]  = useState(true)

  useEffect(() => {
    const load = async () => {
      setL(true)
      try {
        const data = await proposalService.getMyProposals()
        set(data)
      } catch (err) {
        show(err.message, 'error')
      } finally {
        setL(false)
      }
    }
    load()
  }, [show])

  const pending  = proposals.filter(p => p.status === 'pending')
  const accepted = proposals.filter(p => p.status === 'accepted')
  const rejected = proposals.filter(p => p.status === 'rejected')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)]">
        <Loader2 size={18} className="animate-spin" /> A carregar...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-black text-2xl">Minhas Propostas</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          Acompanha o estado de todas as propostas que enviaste
        </p>
      </div>

      {/* Resumo */}
      {proposals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Em análise', count: pending.length,  color: 'text-amber-400' },
            { label: 'Aceites',    count: accepted.length, color: 'text-emerald-400' },
            { label: 'Rejeitadas', count: rejected.length, color: 'text-red-400' },
          ].map(({ label, count, color }) => (
            <Card key={label} className="text-center py-4">
              <div className={clsx('font-syne font-black text-2xl', color)}>{count}</div>
              <div className="text-[var(--muted)] text-xs mt-0.5">{label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Lista */}
      {!proposals.length ? (
        <EmptyState
          icon={<FileText size={24} className="text-[var(--muted)]" />}
          title="Nenhuma proposta enviada"
          description="Vai ao feed de projectos e envia a tua primeira proposta a clientes."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {proposals.map(p => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  )
}
