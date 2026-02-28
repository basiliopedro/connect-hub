import { useEffect, useState, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import {
  AdminPageHeader, Badge, AdminTable,
  Pagination, TableFilters, TableCard, UserCell, DateCell,
} from '@/components/admin/AdminUI'
import { Ban, DollarSign, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_OPTS = [
  { value: '', label: 'Todos os estados' },
  { value: 'open', label: 'Abertos' },
  { value: 'in_progress', label: 'Em progresso' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function AdminProjects() {
  const { show }                  = useToast()
  const [projects, setProjects]   = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('')
  const [loading, setLoad]        = useState(true)

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const { projects: data, total: t } = await adminService.getAllProjects({
        page, perPage: 15, status, search,
      })
      setProjects(data)
      setTotal(t)
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoad(false)
    }
  }, [page, status, search, show])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleCancel = async (projectId) => {
    if (!confirm('Cancelar este projecto? O cliente será notificado.')) return
    try {
      await adminService.cancelProject(projectId)
      show('Projecto cancelado.', 'info')
      load()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'titulo', label: 'Projecto',
      render: row => (
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate max-w-[200px]">{row.titulo}</div>
          <div className="text-[var(--muted)] text-xs truncate max-w-[200px]">{row.categoria}</div>
        </div>
      ),
    },
    {
      key: 'client', label: 'Cliente',
      render: row => <UserCell user={row.client} />,
    },
    {
      key: 'orcamento', label: 'Orçamento',
      render: row => (
        <span className="font-syne font-bold text-emerald-400">
          ${row.orcamento}
        </span>
      ),
    },
    {
      key: 'proposals', label: 'Propostas',
      render: row => (
        <span className={clsx(
          'inline-flex items-center gap-1 text-sm',
          row.proposalsCount > 0 ? 'text-accent' : 'text-[var(--muted)]'
        )}>
          <MessageSquare size={13} />
          {row.proposalsCount}
        </span>
      ),
    },
    { key: 'status', label: 'Estado', render: row => <Badge status={row.status} /> },
    { key: 'created_at', label: 'Publicado', render: row => <DateCell date={row.created_at} /> },
    {
      key: 'actions', label: '',
      render: row => row.status !== 'cancelled' && row.status !== 'completed' ? (
        <button
          onClick={() => handleCancel(row.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            bg-red-500/8 border border-red-500/20 text-red-400
            hover:bg-red-500/14 transition-colors"
        >
          <Ban size={11} /> Cancelar
        </button>
      ) : <span className="text-[var(--muted)] text-xs">—</span>,
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Projectos"
        subtitle={`${total} projecto${total !== 1 ? 's' : ''} na plataforma`}
      />

      <TableFilters
        search={search}
        onSearch={v => { setSearch(v); setPage(1) }}
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
          rows={projects}
          loading={loading}
          emptyText="Nenhum projecto encontrado com estes filtros."
        />
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Pagination page={page} total={total} perPage={15} onChange={setPage} />
        </div>
      </TableCard>
    </div>
  )
}
