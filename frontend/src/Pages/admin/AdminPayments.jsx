import { useEffect, useState, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import {
  AdminPageHeader, Badge, AdminTable, StatCard,
  Pagination, TableFilters, TableCard, DateCell,
} from '@/components/admin/AdminUI'
import { DollarSign, TrendingUp, Lock, RotateCcw } from 'lucide-react'

const STATUS_OPTS = [
  { value: '', label: 'Todos os estados' },
  { value: 'pending',  label: 'Pendentes' },
  { value: 'held',     label: 'Em custódia' },
  { value: 'released', label: 'Libertados' },
  { value: 'refunded', label: 'Reembolsados' },
]

export default function AdminPayments() {
  const { show }                    = useToast()
  const [payments, setPayments]     = useState([])
  const [total, setTotal]           = useState(0)
  const [summary, setSummary]       = useState(null)
  const [page, setPage]             = useState(1)
  const [status, setStatus]         = useState('')
  const [loading, setLoad]          = useState(true)

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const [{ payments: data, total: t }, fin] = await Promise.all([
        adminService.getAllPayments({ page, perPage: 15, status }),
        adminService.getFinancialSummary(),
      ])
      setPayments(data)
      setTotal(t)
      setSummary(fin)
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoad(false)
    }
  }, [page, status, show])

  useEffect(() => { load() }, [load])

  const columns = [
    {
      key: 'project', label: 'Projecto',
      render: row => (
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate max-w-[160px]">
            {row.contract?.project?.titulo ?? '—'}
          </div>
          <div className="font-mono text-[10px] text-[var(--muted)]">
            {row.stripe_intent?.slice(0, 16)}...
          </div>
        </div>
      ),
    },
    {
      key: 'client', label: 'Cliente → Profissional',
      render: row => (
        <div className="text-xs text-[var(--muted)]">
          <div>{row.contract?.client?.nome} {row.contract?.client?.apelido}</div>
          <div className="text-accent">→ {row.contract?.professional?.nome} {row.contract?.professional?.apelido}</div>
        </div>
      ),
    },
    {
      key: 'valor', label: 'Valor',
      render: row => (
        <div>
          <div className="font-syne font-bold text-sm text-emerald-400">${row.valor}</div>
          <div className="text-[var(--muted)] text-xs">comissão: ${row.comissao}</div>
        </div>
      ),
    },
    { key: 'status', label: 'Estado', render: row => <Badge status={row.status} /> },
    { key: 'created_at', label: 'Data', render: row => <DateCell date={row.created_at} /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Pagamentos"
        subtitle="Histórico financeiro completo da plataforma"
      />

      {/* Resumo financeiro */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Volume total"
            value={`$${summary.totalProcessed.toFixed(0)}`}
            Icon={DollarSign}
            color="bg-emerald-500/10 text-emerald-400"
            sub={`${summary.count.released} transacções`}
          />
          <StatCard
            label="Receita (comissões)"
            value={`$${summary.totalRevenue.toFixed(0)}`}
            Icon={TrendingUp}
            color="bg-accent/10 text-accent"
          />
          <StatCard
            label="Em custódia"
            value={`$${summary.totalEscrow.toFixed(0)}`}
            Icon={Lock}
            color="bg-blue-500/10 text-blue-400"
            sub={`${summary.count.held} pagamentos`}
          />
          <StatCard
            label="Reembolsados"
            value={`$${summary.totalRefunded.toFixed(0)}`}
            Icon={RotateCcw}
            color="bg-purple-500/10 text-purple-400"
          />
        </div>
      )}

      <TableFilters
        filters={[
          {
            key: 'status', value: status, onChange: v => { setStatus(v); setPage(1) },
            options: STATUS_OPTS,
          },
        ]}
      />

      <TableCard>
        <AdminTable
          columns={columns}
          rows={payments}
          loading={loading}
          emptyText="Nenhum pagamento registado."
        />
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Pagination page={page} total={total} perPage={15} onChange={setPage} />
        </div>
      </TableCard>
    </div>
  )
}
