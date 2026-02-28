import { useEffect, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { useToast } from '@/components/ui/Toast'
import { AdminPageHeader, Badge, DateCell } from '@/components/admin/AdminUI'
import { Avatar, Button } from '@/components/ui'
import {
  CheckCircle, XCircle, ExternalLink, Clock,
  MapPin, DollarSign, User, FileText,
} from 'lucide-react'
import { clsx } from 'clsx'

// ── Modal de rejeição com motivo ─────────────────────────────
function RejectModal({ user, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-7 shadow-2xl">
        <h3 className="font-syne font-black text-xl mb-1">Rejeitar perfil</h3>
        <p className="text-[var(--muted)] text-sm mb-5">
          Perfil de <strong>{user.nome} {user.apelido}</strong> não será aprovado.
        </p>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo da rejeição (opcional — será enviado ao utilizador)..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border2)]
            text-[var(--text)] text-sm outline-none focus:border-red-400 resize-none mb-5
            placeholder:text-[var(--muted)] transition-colors"
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={() => onConfirm(motivo)} className="flex-1">
            <XCircle size={15} /> Confirmar rejeição
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Card de profissional pendente ────────────────────────────
function PendingCard({ user, onApprove, onReject, onViewCV }) {
  const prof      = user.professional_profiles
  const [exp, setExp] = useState(false)

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[22px] overflow-hidden
      hover:border-[var(--border2)] transition-colors">

      {/* Header do card */}
      <div className="flex items-start gap-4 p-6">
        <Avatar src={user.avatar_url} name={`${user.nome} ${user.apelido}`} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-syne font-bold text-lg leading-tight">
                {user.nome} {user.apelido}
              </h3>
              <p className="text-[var(--muted)] text-sm">{user.email}</p>
            </div>
            <Badge status="pending_approval" />
          </div>

          {/* Dados rápidos */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            {prof?.area && (
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <User size={13} className="text-accent" />
                {prof.area}
              </span>
            )}
            {prof?.localizacao && (
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <MapPin size={13} className="text-blue-400" />
                {prof.localizacao}
              </span>
            )}
            {prof?.tarifa_hora && (
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <DollarSign size={13} className="text-emerald-400" />
                ${prof.tarifa_hora}/hora
              </span>
            )}
            {prof?.idade && (
              <span className="text-[var(--muted)]">{prof.idade} anos</span>
            )}
          </div>
        </div>
      </div>

      {/* Data de submissão */}
      <div className="px-6 pb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Clock size={11} />
        Submetido em <DateCell date={user.created_at} />
      </div>

      {/* Descrição expandível */}
      {prof?.descricao && (
        <div className="px-6 pb-4">
          <div className={clsx(
            'text-[var(--muted)] text-sm leading-relaxed bg-[var(--surface2)] rounded-xl p-4',
            !exp && 'line-clamp-3'
          )}>
            {prof.descricao}
          </div>
          {prof.descricao.length > 200 && (
            <button
              onClick={() => setExp(!exp)}
              className="text-accent text-xs mt-1.5 hover:underline"
            >
              {exp ? 'Mostrar menos' : 'Ler mais'}
            </button>
          )}
        </div>
      )}

      {/* Portfólio + CV */}
      {(prof?.portfolio_urls?.length > 0 || prof?.cv_url) && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {prof?.portfolio_urls?.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                bg-accent/8 border border-accent/20 text-accent
                hover:bg-accent/14 transition-colors">
              <ExternalLink size={11} /> Portfólio {prof.portfolio_urls.length > 1 ? i + 1 : ''}
            </a>
          ))}
          {prof?.cv_url && (
            <button
              onClick={() => onViewCV(prof.cv_url)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                bg-[var(--surface2)] border border-[var(--border2)] text-[var(--muted)]
                hover:border-accent hover:text-accent transition-colors"
            >
              <FileText size={11} /> Ver Curriculum Vitae
            </button>
          )}
        </div>
      )}

      {/* Acções */}
      <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3 bg-[var(--surface2)]/50">
        <Button
          variant="success"
          onClick={() => onApprove(user.id)}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <CheckCircle size={15} /> Aprovar profissional
        </Button>
        <Button
          variant="danger"
          onClick={() => onReject(user)}
          className="flex items-center justify-center gap-2 px-5"
        >
          <XCircle size={15} /> Rejeitar
        </Button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════
export default function AdminApprovals() {
  const { reloadPending }  = useOutletContext() ?? {}
  const { show }           = useToast()
  const [pending, setPend] = useState([])
  const [loading, setLoad] = useState(true)
  const [rejectTarget, setRejectTarget] = useState(null)

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const data = await adminService.getPendingProfessionals()
      setPend(data)
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoad(false)
    }
  }, [show])

  useEffect(() => { load() }, [load])

  const handleApprove = async (userId) => {
    try {
      await adminService.approveProfessional(userId)
      show('✅ Profissional aprovado com sucesso!', 'success')
      load()
      reloadPending?.()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  const handleRejectConfirm = async (motivo) => {
    try {
      await adminService.rejectProfessional(rejectTarget.id, motivo)
      show('Perfil rejeitado.', 'info')
      setRejectTarget(null)
      load()
      reloadPending?.()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  const handleViewCV = async (cvPath) => {
    try {
      const url = await adminService.getCvSignedUrl(cvPath)
      window.open(url, '_blank')
    } catch (err) {
      show(err.message, 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Aprovações de Profissionais"
        subtitle={
          loading ? 'A carregar...'
          : pending.length > 0
            ? `${pending.length} perfil${pending.length > 1 ? 'is' : ''} aguarda${pending.length > 1 ? 'm' : ''} análise — ordenados por data de submissão`
            : 'Sem perfis pendentes de aprovação'
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !pending.length ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20
            flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="font-syne font-bold text-xl mb-1">Tudo em dia!</h3>
            <p className="text-[var(--muted)] text-sm max-w-sm">
              Não há perfis de profissionais pendentes de aprovação neste momento.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {pending.map(user => (
            <PendingCard
              key={user.id}
              user={user}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              onViewCV={handleViewCV}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          user={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
