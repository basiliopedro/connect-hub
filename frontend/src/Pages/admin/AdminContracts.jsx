import { useEffect, useState, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import {
  AdminPageHeader, Badge, AdminTable,
  Pagination, TableFilters, TableCard, UserCell, DateCell,
} from '@/components/admin/AdminUI'
import { Avatar } from '@/components/ui'

const STATUS_OPTS = [
  { value: '', label: 'Todos os estados' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'disputed', label: 'Em disputa' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function AdminContracts() {
  const { show }                    = useToast()
  const [contracts, setContracts]   = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [status, setStatus]         = useState('')
  const [loading, setLoad]          = useState(true)

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const { contracts: data, total: t } = await adminService.getAllContracts({ page, perPage: 15, status })
      setContracts(data)
      setTotal(t)
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
            {row.project?.titulo ?? '—'}
          </div>
          <div className="text-[var(--muted)] text-xs">{row.project?.categoria}</div>
        </div>
      ),
    },
    {
      key: 'client', label: 'Cliente',
      render: row => <UserCell user={row.client} />,
    },
    {
      key: 'professional', label: 'Profissional',
      render: row => <UserCell user={row.professional} />,
    },
    {
      key: 'valor_total', label: 'Valor',
      render: row => (
        <div>
          <div className="font-syne font-bold text-sm">${row.valor_total}</div>
          <div className="text-[var(--muted)] text-xs">comissão: ${row.comissao}</div>
        </div>
      ),
    },
    {
      key: 'payment', label: 'Pagamento',
      render: row => {
        const pay = row.payments?.[0]
        return pay ? <Badge status={pay.status} /> : <span className="text-[var(--muted)] text-xs">Sem pagamento</span>
      },
    },
    { key: 'status', label: 'Contrato', render: row => <Badge status={row.status} /> },
    { key: 'created_at', label: 'Data', render: row => <DateCell date={row.created_at} /> },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Contratos"
        subtitle={`${total} contrato${total !== 1 ? 's' : ''} na plataforma`}
      />

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
          rows={contracts}
          loading={loading}
          emptyText="Nenhum contrato encontrado."
        />
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Pagination page={page} total={total} perPage={15} onChange={setPage} />
        </div>
      </TableCard>
    </div>
  )
}
