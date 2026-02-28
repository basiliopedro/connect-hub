import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { contractService } from '@/services/contractService'
import { useToast } from '@/components/ui/Toast'
import { Card, EmptyState, Avatar, Button } from '@/components/ui'
import {
  FileText, CheckCircle, Clock, AlertTriangle,
  DollarSign, MessageSquare, ChevronRight, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { clsx } from 'clsx'

// ── Indicator de status do contrato ─────────────────────────
const STATUS_MAP = {
  active:    { label: 'Em progresso', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/25',    Icon: Clock },
  completed: { label: 'Concluído',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', Icon: CheckCircle },
  disputed:  { label: 'Em disputa',   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/25',      Icon: AlertTriangle },
  cancelled: { label: 'Cancelado',    color: 'text-[var(--muted)]', bg: 'bg-[var(--surface2)]',              Icon: FileText },
}

// ── Card de contrato ─────────────────────────────────────────
function ContractCard({ contract, userId, onMarkDone }) {
  const { label, color, bg, Icon } = STATUS_MAP[contract.status] ?? STATUS_MAP.active
  const isClient = contract.client_id === userId
  const otherParty = isClient ? contract.professional : contract.client
  const netValue = isClient
    ? contract.valor_total
    : (Number(contract.valor_total) - Number(contract.comissao))

  return (
    <Card className="flex flex-col gap-4 hover:border-[var(--border2)] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-base leading-tight truncate mb-1">
            {contract.project?.titulo}
          </h3>
          <div className="text-[var(--muted)] text-xs">
            {contract.project?.categoria}
            · {format(new Date(contract.created_at), 'dd MMM yyyy', { locale: pt })}
          </div>
        </div>

        {/* Status badge */}
        <div className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0',
          color, bg
        )}>
          <Icon size={12} />
          {label}
        </div>
      </div>

      {/* Outra parte */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface2)]">
        <Avatar
          src={otherParty?.avatar_url}
          name={`${otherParty?.nome} ${otherParty?.apelido}`}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--muted)]">
            {isClient ? 'Profissional' : 'Cliente'}
          </div>
          <div className="font-semibold text-sm">
            {otherParty?.nome} {otherParty?.apelido}
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-[var(--muted)] mb-0.5">Valor total</div>
          <div className="font-syne font-bold">${contract.valor_total}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)] mb-0.5">Comissão (10%)</div>
          <div className="font-syne font-bold text-[var(--muted)]">${contract.comissao}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted)] mb-0.5">
            {isClient ? 'A pagar' : 'A receber'}
          </div>
          <div className={clsx('font-syne font-bold', isClient ? 'text-accent' : 'text-emerald-400')}>
            ${netValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Pagamento status */}
      {contract.payments?.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface2)] text-sm">
          <DollarSign size={14} className="text-amber-400" />
          <span className="text-[var(--muted)]">Pagamento:</span>
          <span className="font-medium capitalize">{
            { pending: 'Pendente', held: 'Em custódia', released: 'Liberado', refunded: 'Reembolsado' }
            [contract.payments[0]?.status] ?? contract.payments[0]?.status
          }</span>
        </div>
      )}

      {/* Acções */}
      <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
        <Link to={`/chat?contract=${contract.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare size={14} /> Mensagens
          </Button>
        </Link>

        {/* Cliente pode marcar como concluído */}
        {isClient && contract.status === 'active' && (
          <Button
            variant="success"
            size="sm"
            className="flex-1"
            onClick={() => onMarkDone(contract.id)}
          >
            <CheckCircle size={14} /> Marcar concluído
          </Button>
        )}
      </div>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════
export default function ContractsPage() {
  const { profile }        = useAuth()
  const { show }           = useToast()
  const [contracts, set]   = useState([])
  const [loading, setLoad] = useState(true)
  const [tab, setTab]      = useState('active') // 'active' | 'completed'

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const data = await contractService.getMyContracts()
      set(data)
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoad(false)
    }
  }, [show])

  useEffect(() => { load() }, [load])

  const handleMarkDone = async (contractId) => {
    if (!window.confirm(
      'Confirmas que o trabalho foi concluído satisfatoriamente? ' +
      'Ao confirmar, o pagamento será libertado para o profissional.'
    )) return

    try {
      await contractService.markCompleted(contractId)
      show('✅ Contrato concluído! Pagamento libertado.', 'success')
      load()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  const active    = contracts.filter(c => c.status === 'active')
  const completed = contracts.filter(c => c.status === 'completed')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-black text-2xl">Contratos</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          Acompanha o trabalho em curso e o histórico de projectos concluídos
        </p>
      </div>

      {/* Tabs */}
      {contracts.length > 0 && (
        <div className="flex gap-1 p-1 bg-[var(--surface2)] rounded-xl w-fit">
          {[
            { id: 'active',    label: 'Em progresso', count: active.length },
            { id: 'completed', label: 'Concluídos',   count: completed.length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                tab === id
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              )}
            >
              {label}
              {count > 0 && (
                <span className={clsx(
                  'ml-2 px-2 py-0.5 rounded-full text-xs',
                  tab === id ? 'bg-accent/10 text-accent' : 'bg-[var(--surface)] text-[var(--muted)]'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)]">
          <Loader2 size={18} className="animate-spin" /> A carregar...
        </div>
      ) : !contracts.length ? (
        <EmptyState
          icon={<FileText size={24} className="text-[var(--muted)]" />}
          title="Nenhum contrato ainda"
          description={
            profile?.role === 'cliente'
              ? 'Quando aceitares uma proposta, o contrato aparecerá aqui.'
              : 'Quando um cliente aceitar a tua proposta, o contrato aparecerá aqui.'
          }
          action={
            <Link to="/projectos">
              <Button variant="primary" size="sm">
                <ChevronRight size={14} />
                {profile?.role === 'cliente' ? 'Publicar projecto' : 'Ver projectos'}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tab === 'active' ? active : completed).map(c => (
            <ContractCard
              key={c.id}
              contract={c}
              userId={profile?.id}
              onMarkDone={handleMarkDone}
            />
          ))}

          {/* Empty state da tab activa */}
          {tab === 'active' && !active.length && (
            <div className="col-span-full">
              <EmptyState
                icon={<Clock size={22} className="text-[var(--muted)]" />}
                title="Nenhum contrato em progresso"
                description="Os contratos activos aparecerão aqui."
              />
            </div>
          )}
          {tab === 'completed' && !completed.length && (
            <div className="col-span-full">
              <EmptyState
                icon={<CheckCircle size={22} className="text-[var(--muted)]" />}
                title="Nenhum contrato concluído"
                description="Os contratos concluídos ficarão arquivados aqui."
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
