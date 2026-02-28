import { useEffect, useState, useCallback, useRef } from 'react'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import {
  AdminPageHeader, Badge, AdminTable,
  Pagination, TableFilters, TableCard, UserCell, DateCell,
} from '@/components/admin/AdminUI'
import { Avatar, Button } from '@/components/ui'
import {
  ShieldOff, ShieldCheck, X, User,
  FolderOpen, FileText, DollarSign,
  MapPin, Clock,
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

// ── Drawer de detalhe do utilizador ─────────────────────────
function UserDrawer({ userId, onClose, onAction }) {
  const { show }        = useToast()
  const [data, setData] = useState(null)
  const [loading, setL] = useState(true)
  const drawerRef       = useRef()

  useEffect(() => {
    if (!userId) return
    setL(true)
    adminService.getUserDetail(userId)
      .then(setData)
      .catch(err => show(err.message, 'error'))
      .finally(() => setL(false))
  }, [userId, show])

  // Fechar com Escape
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const handleBlock = async () => {
    try {
      await adminService.blockUser(userId)
      show('Conta suspensa.', 'info')
      onAction()
      onClose()
    } catch (err) { show(err.message, 'error') }
  }

  const handleUnblock = async () => {
    try {
      await adminService.unblockUser(userId)
      show('✅ Conta reactivada.', 'success')
      onAction()
      onClose()
    } catch (err) { show(err.message, 'error') }
  }

  const user = data?.user
  const prof = user?.professional_profiles

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Painel lateral */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md
          bg-[var(--surface)] border-l border-[var(--border)]
          flex flex-col shadow-2xl
          animate-[slideRight_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <h3 className="font-syne font-bold text-lg">Detalhe do utilizador</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)]">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !user ? (
            <p className="text-center py-12 text-[var(--muted)]">Utilizador não encontrado.</p>
          ) : (
            <div className="p-6 flex flex-col gap-6">

              {/* Perfil */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent to-accent-2
                      flex items-center justify-center text-white font-syne font-black text-xl">
                      {user.nome?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-syne font-bold text-xl">{user.nome} {user.apelido}</h4>
                  <p className="text-[var(--muted)] text-sm mb-2">{user.email}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge status={user.role} />
                    <Badge status={user.status} />
                  </div>
                </div>
              </div>

              {/* Info da conta */}
              <div className="bg-[var(--surface2)] rounded-2xl p-4 flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">ID</span>
                  <span className="font-mono text-xs opacity-70">{user.id.slice(0, 12)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Email verificado</span>
                  <span className={user.verified_email ? 'text-emerald-400' : 'text-amber-400'}>
                    {user.verified_email ? '✓ Verificado' : '✗ Não verificado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Registado em</span>
                  <span>{format(new Date(user.created_at), 'dd MMM yyyy', { locale: pt })}</span>
                </div>
              </div>

              {/* Perfil profissional */}
              {prof && (
                <div className="flex flex-col gap-3">
                  <h5 className="font-semibold text-sm text-[var(--muted)] uppercase tracking-wider text-[11px]">
                    Perfil Profissional
                  </h5>
                  <div className="bg-[var(--surface2)] rounded-2xl p-4 flex flex-col gap-2.5 text-sm">
                    {[
                      { label: 'Área',        val: prof.area },
                      { label: 'Localização', val: prof.localizacao },
                      { label: 'Tarifa/hora', val: prof.tarifa_hora ? `$${prof.tarifa_hora}` : null },
                      { label: 'Aprovado em', val: prof.aprovado_em ? format(new Date(prof.aprovado_em), 'dd MMM yyyy', { locale: pt }) : 'Não aprovado' },
                    ].filter(r => r.val).map(({ label, val }) => (
                      <div key={label} className="flex items-start justify-between gap-2">
                        <span className="text-[var(--muted)] flex-shrink-0">{label}</span>
                        <span className="text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actividade resumida */}
              {data.projects?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-[11px] text-[var(--muted)] uppercase tracking-wider mb-2">
                    Projectos ({data.projects.length})
                  </h5>
                  <div className="flex flex-col gap-1.5">
                    {data.projects.slice(0, 3).map(p => (
                      <div key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface2)] text-sm">
                        <span className="truncate flex-1">{p.titulo}</span>
                        <Badge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.contracts?.length > 0 && (
                <div>
                  <h5 className="font-semibold text-[11px] text-[var(--muted)] uppercase tracking-wider mb-2">
                    Contratos ({data.contracts.length})
                  </h5>
                  <div className="flex flex-col gap-1.5">
                    {data.contracts.slice(0, 3).map(c => (
                      <div key={c.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface2)] text-sm">
                        <span className="font-mono text-xs opacity-60">{c.id.slice(0, 8)}...</span>
                        <span className="font-semibold">${c.valor_total}</span>
                        <Badge status={c.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acções no rodapé */}
        {user && user.role !== 'admin' && (
          <div className="p-5 border-t border-[var(--border)] flex gap-3">
            {user.status === 'blocked' ? (
              <Button variant="success" onClick={handleUnblock} className="flex-1">
                <ShieldCheck size={15} /> Reactivar conta
              </Button>
            ) : (
              <Button variant="danger" onClick={handleBlock} className="flex-1">
                <ShieldOff size={15} /> Suspender conta
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════
export default function AdminUsers() {
  const { show }          = useToast()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [search, setSrch] = useState('')
  const [role, setRole]   = useState('')
  const [status, setStat] = useState('')
  const [loading, setLoad] = useState(true)
  const [selected, setSel] = useState(null) // ID do utilizador no drawer

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const { users: data, total: t } = await adminService.getAllUsers({
        page, perPage: 15, search, role, status,
      })
      setUsers(data)
      setTotal(t)
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoad(false)
    }
  }, [page, search, role, status, show])

  useEffect(() => { load() }, [load])

  // Debounce pesquisa
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleBlockToggle = async (user) => {
    try {
      if (user.status === 'blocked') {
        await adminService.unblockUser(user.id)
        show('✅ Conta reactivada.', 'success')
      } else {
        await adminService.blockUser(user.id)
        show('Conta suspensa.', 'info')
      }
      load()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  const columns = [
    {
      key: 'user', label: 'Utilizador',
      render: row => (
        <button onClick={() => setSel(row.id)} className="text-left hover:underline">
          <UserCell user={row} />
        </button>
      ),
    },
    { key: 'role',   label: 'Role',   render: row => <Badge status={row.role} /> },
    { key: 'status', label: 'Estado', render: row => <Badge status={row.status} /> },
    {
      key: 'area', label: 'Área',
      render: row => (
        <span className="text-[var(--muted)] text-xs truncate max-w-[120px] block">
          {row.professional_profiles?.area ?? '—'}
        </span>
      ),
    },
    { key: 'created_at', label: 'Registado', render: row => <DateCell date={row.created_at} /> },
    {
      key: 'actions', label: '',
      render: row => row.role !== 'admin' ? (
        <button
          onClick={() => handleBlockToggle(row)}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
            row.status === 'blocked'
              ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/14'
              : 'bg-red-500/8 border-red-500/20 text-red-400 hover:bg-red-500/14'
          )}
        >
          {row.status === 'blocked'
            ? <><ShieldCheck size={12} /> Reactivar</>
            : <><ShieldOff size={12} /> Suspender</>
          }
        </button>
      ) : <span className="text-[var(--muted)] text-xs">—</span>,
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Utilizadores"
        subtitle={`${total} utilizador${total !== 1 ? 'es' : ''} registado${total !== 1 ? 's' : ''} na plataforma`}
      />

      <TableFilters
        search={search}
        onSearch={v => { setSrch(v); setPage(1) }}
        filters={[
          {
            key: 'role', value: role, onChange: v => { setRole(v); setPage(1) },
            options: [
              { value: '', label: 'Todos os roles' },
              { value: 'cliente', label: 'Clientes' },
              { value: 'profissional', label: 'Profissionais' },
              { value: 'admin', label: 'Admins' },
            ],
          },
          {
            key: 'status', value: status, onChange: v => { setStat(v); setPage(1) },
            options: [
              { value: '', label: 'Todos os estados' },
              { value: 'active', label: 'Activos' },
              { value: 'pending_approval', label: 'Pendentes' },
              { value: 'blocked', label: 'Bloqueados' },
            ],
          },
        ]}
      />

      <TableCard>
        <AdminTable
          columns={columns}
          rows={users}
          loading={loading}
          emptyText="Nenhum utilizador encontrado com estes filtros."
        />
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Pagination page={page} total={total} perPage={15} onChange={setPage} />
        </div>
      </TableCard>

      {selected && (
        <UserDrawer
          userId={selected}
          onClose={() => setSel(null)}
          onAction={load}
        />
      )}
    </div>
  )
}
