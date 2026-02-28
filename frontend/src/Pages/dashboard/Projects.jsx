import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { projectService } from '@/services/projectService'
import { proposalService } from '@/services/proposalService'
import { useToast } from '@/components/ui/Toast'
import { Button, Card, Input, Select, Textarea, EmptyState, Avatar, StatusBadge } from '@/components/ui'
import {
  Plus, X, Search, SlidersHorizontal,
  DollarSign, Clock, ChevronRight, Send,
  FolderOpen, Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema } from '@/utils/validators'
import { z } from 'zod'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { clsx } from 'clsx'

const CATEGORIAS = [
  'Tecnologia & Desenvolvimento',
  'Design & Criatividade',
  'Marketing Digital',
  'Escrita & Conteúdo',
  'Vídeo & Fotografia',
  'Finanças & Contabilidade',
  'Direito & Jurídico',
  'Ensino & Formação',
  'Engenharia & Construção',
  'Outro',
]

const PRAZOS = ['Menos de 1 semana', '1–2 semanas', '1 mês', '1–3 meses', 'Mais de 3 meses', 'A definir']

const proposalSchema = z.object({
  valor:    z.number({ invalid_type_error: 'Valor obrigatório' }).min(5, 'Mínimo $5'),
  mensagem: z.string().min(30, 'Escreve pelo menos 30 caracteres').max(2000, 'Muito longa'),
})

// ── Modal criar projecto ─────────────────────────────────────
function CreateProjectModal({ onClose, onCreated }) {
  const { show } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(projectSchema),
  })

  const onSubmit = async (data) => {
    try {
      await projectService.create(data)
      show('✅ Projecto publicado com sucesso!', 'success')
      onCreated()
      onClose()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[24px]
        shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="font-syne font-black text-xl">Publicar Projecto</h2>
            <p className="text-[var(--muted)] text-xs mt-0.5">
              Descreve o que precisas e recebe propostas de profissionais
            </p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)]">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          <Input
            label="Título do projecto *"
            placeholder="Ex: Desenvolvimento de app mobile para delivery"
            error={errors.titulo?.message}
            {...register('titulo')}
          />
          <Textarea
            label="Descrição detalhada *"
            placeholder="Descreve o que precisas, requisitos, tecnologias preferidas..."
            hint="Quanto mais detalhado, melhores propostas vais receber"
            error={errors.descricao?.message}
            className="min-h-[120px]"
            {...register('descricao')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Orçamento (USD) *"
              type="number"
              placeholder="500"
              error={errors.orcamento?.message}
              {...register('orcamento', { valueAsNumber: true })}
            />
            <Select
              label="Prazo *"
              error={errors.prazo?.message}
              {...register('prazo')}
            >
              <option value="">Seleccionar...</option>
              {PRAZOS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <Select
            label="Categoria *"
            error={errors.categoria?.message}
            {...register('categoria')}
          >
            <option value="">Seleccionar categoria...</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1">
              Publicar projecto
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal enviar proposta ────────────────────────────────────
function SendProposalModal({ project, onClose, onSent }) {
  const { show } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(proposalSchema),
  })

  const onSubmit = async (data) => {
    try {
      await proposalService.submit({
        projectId: project.id,
        valor:     data.valor,
        mensagem:  data.mensagem,
      })
      show('✅ Proposta enviada com sucesso!', 'success')
      onSent()
      onClose()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="font-syne font-black text-lg">Enviar Proposta</h2>
            <p className="text-[var(--muted)] text-xs mt-0.5 truncate max-w-[260px]">{project.titulo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          {/* Orçamento do cliente */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface2)] text-sm">
            <DollarSign size={15} className="text-emerald-400" />
            <span className="text-[var(--muted)]">Orçamento do cliente:</span>
            <span className="font-semibold">${project.orcamento}</span>
          </div>

          <Input
            label="O teu valor (USD) *"
            type="number"
            placeholder="Ex: 450"
            hint="Podes propor um valor diferente do orçamento"
            error={errors.valor?.message}
            {...register('valor', { valueAsNumber: true })}
          />
          <Textarea
            label="Mensagem de apresentação *"
            placeholder="Apresenta-te, explica como vais resolver o projecto e porquê és a melhor escolha..."
            className="min-h-[120px]"
            error={errors.mensagem?.message}
            {...register('mensagem')}
          />

          <div className="p-3 rounded-xl bg-accent/6 border border-accent/15 text-xs text-[var(--muted)]">
            A plataforma retém 10% de comissão sobre o valor acordado, cobrado apenas quando o projecto for concluído.
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1">
              <Send size={14} /> Enviar Proposta
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Card de projecto (feed) ──────────────────────────────────
function ProjectCard({ project, onPropose, isProfessional }) {
  return (
    <Card className="flex flex-col gap-4 hover:border-[var(--border2)] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-base leading-tight mb-1 truncate">
            {project.titulo}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            {project.client && (
              <>
                <Avatar src={project.client.avatar_url} name={`${project.client.nome}`} size="sm" />
                <span>{project.client.nome} {project.client.apelido}</span>
                <span>·</span>
              </>
            )}
            <span>{format(new Date(project.created_at), 'dd MMM', { locale: pt })}</span>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Descrição */}
      <p className="text-[var(--muted)] text-sm leading-relaxed line-clamp-3">
        {project.descricao}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1 rounded-full bg-[var(--surface2)] text-xs text-[var(--text)]">
          {project.categoria}
        </span>
        {project.prazo && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
            bg-[var(--surface2)] text-xs text-[var(--muted)]">
            <Clock size={11} /> {project.prazo}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <DollarSign size={14} className="text-emerald-400" />
          <span className="font-syne font-bold text-lg">${project.orcamento}</span>
          <span className="text-[var(--muted)] text-xs">
            · {project.proposalsCount} proposta{project.proposalsCount !== 1 ? 's' : ''}
          </span>
        </div>

        {isProfessional && project.status === 'open' && (
          <Button variant="primary" size="sm" onClick={() => onPropose(project)}>
            Propor <ChevronRight size={14} />
          </Button>
        )}
      </div>
    </Card>
  )
}

// ── Card de projecto do cliente (com propostas) ──────────────
function ClientProjectCard({ project, onRefresh }) {
  const { show } = useToast()
  const [expanded, setExpanded] = useState(false)
  const pendingProposals = project.proposals?.filter(p => p.status === 'pending') ?? []
  const acceptedProposal = project.proposals?.find(p => p.status === 'accepted')

  const handleAccept = async (proposalId) => {
    try {
      await proposalService.accept(proposalId)
      show('✅ Proposta aceite! Contrato criado.', 'success')
      onRefresh()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  const handleReject = async (proposalId) => {
    try {
      await proposalService.reject(proposalId)
      show('Proposta rejeitada.', 'info')
      onRefresh()
    } catch (err) {
      show(err.message, 'error')
    }
  }

  return (
    <Card className="flex flex-col gap-0">
      {/* Header */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="font-syne font-bold text-base truncate">{project.titulo}</h3>
            <StatusBadge status={project.status} />
          </div>
          <div className="text-[var(--muted)] text-xs">
            ${project.orcamento} · {project.categoria}
            · {format(new Date(project.created_at), 'dd MMM yyyy', { locale: pt })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingProposals.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              {pendingProposals.length} proposta{pendingProposals.length > 1 ? 's' : ''}
            </span>
          )}
          <ChevronRight size={16} className={clsx(
            'text-[var(--muted)] transition-transform duration-200',
            expanded && 'rotate-90'
          )} />
        </div>
      </div>

      {/* Propostas expandidas */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-3">
          {acceptedProposal && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle size={15} />
              Proposta de {acceptedProposal.professional?.nome} aceite — contrato criado
            </div>
          )}

          {!project.proposals?.length && (
            <p className="text-[var(--muted)] text-sm text-center py-3">
              Ainda sem propostas. Partilha o link para receber mais visibilidade.
            </p>
          )}

          {pendingProposals.map((proposal) => (
            <div key={proposal.id}
              className="bg-[var(--surface2)] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={proposal.professional?.avatar_url}
                  name={proposal.professional?.nome}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    {proposal.professional?.nome} {proposal.professional?.apelido}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {format(new Date(proposal.created_at), 'dd MMM', { locale: pt })}
                  </div>
                </div>
                <div className="font-syne font-bold text-lg text-accent">${proposal.valor}</div>
              </div>

              <p className="text-[var(--muted)] text-sm leading-relaxed line-clamp-4">
                {proposal.mensagem}
              </p>

              <div className="flex gap-2">
                <Button variant="success" size="sm" onClick={() => handleAccept(proposal.id)}>
                  ✓ Aceitar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReject(proposal.id)}>
                  Rejeitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function ProjectsPage() {
  const { profile } = useAuth()
  const { show }    = useToast()
  const isClient    = profile?.role === 'cliente'
  const isPro       = profile?.role === 'profissional'

  const [projects, setProjects]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [showCreate, setCreate]   = useState(false)
  const [proposing, setProposing] = useState(null)
  const [search, setSearch]       = useState('')
  const [categoria, setCategoria] = useState('')
  const [page, setPage]           = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isClient) {
        const data = await projectService.getMyProjects()
        setProjects(data)
        setTotal(data.length)
      } else {
        const { projects: data, total: t } = await projectService.getFeed({
          page, search, categoria,
        })
        setProjects(data)
        setTotal(t)
      }
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [isClient, page, search, categoria, show])

  useEffect(() => { load() }, [load])

  // Debounce para pesquisa
  useEffect(() => {
    if (!isPro) return
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search, categoria]) // eslint-disable-line

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-black text-2xl">
            {isClient ? 'Meus Projectos' : 'Feed de Projectos'}
          </h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            {isClient
              ? 'Gere os teus projectos e analisa as propostas recebidas'
              : 'Encontra projectos que correspondem às tuas competências'}
          </p>
        </div>
        {isClient && (
          <Button variant="primary" size="sm" onClick={() => setCreate(true)}>
            <Plus size={15} /> Publicar Projecto
          </Button>
        )}
      </div>

      {/* Filtros (apenas profissional) */}
      {isPro && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar projectos..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border2)]
                text-[var(--text)] text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <select
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border2)]
              text-[var(--text)] text-sm outline-none focus:border-accent"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)]">
          <Loader2 size={18} className="animate-spin" /> A carregar...
        </div>
      ) : !projects.length ? (
        <EmptyState
          icon={<FolderOpen size={24} className="text-[var(--muted)]" />}
          title={isClient ? 'Nenhum projecto publicado' : 'Nenhum projecto disponível'}
          description={
            isClient
              ? 'Publica o teu primeiro projecto e começa a receber propostas de profissionais verificados.'
              : 'Não há projectos abertos neste momento. Volta mais tarde ou ajusta os filtros.'
          }
          action={isClient && (
            <Button variant="primary" size="sm" onClick={() => setCreate(true)}>
              <Plus size={14} /> Publicar Projecto
            </Button>
          )}
        />
      ) : (
        <>
          {/* Grid ou lista */}
          {isClient ? (
            <div className="flex flex-col gap-4">
              {projects.map(p => (
                <ClientProjectCard key={p.id} project={p} onRefresh={load} />
              ))}
            </div>
          ) : (
            <>
              <div className="text-[var(--muted)] text-sm">{total} projecto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isProfessional={isPro}
                    onPropose={setProposing}
                  />
                ))}
              </div>

              {/* Paginação */}
              {total > 12 && (
                <div className="flex justify-center gap-3 pt-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    ← Anterior
                  </Button>
                  <span className="flex items-center text-sm text-[var(--muted)]">
                    Página {page} de {Math.ceil(total / 12)}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>
                    Próxima →
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modais */}
      {showCreate && (
        <CreateProjectModal onClose={() => setCreate(false)} onCreated={load} />
      )}
      {proposing && (
        <SendProposalModal
          project={proposing}
          onClose={() => setProposing(null)}
          onSent={load}
        />
      )}
    </div>
  )
}
