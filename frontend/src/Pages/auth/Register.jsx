import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/Toast'
import { authService } from '@/services/authService'
import { uploadService } from '@/services/uploadService'
import {
  registerClienteSchema,
  registerProfissionalStep1Schema,
  registerProfissionalStep2Schema,
  getPasswordStrength,
} from '@/utils/validators'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { User, Briefcase, ChevronRight, ChevronLeft, Upload, X } from 'lucide-react'
import { clsx } from 'clsx'

// ── Constantes ──────────────────────────────────────────────
const AREAS = [
  'Tecnologia & Desenvolvimento',
  'Design & Criatividade',
  'Marketing Digital',
  'Escrita & Conteúdo',
  'Vídeo & Fotografia',
  'Finanças & Contabilidade',
  'Direito & Jurídico',
  'Ensino & Formação',
  'Engenharia & Construção',
  'Saúde & Bem-estar',
  'Outro',
]

// ── Indicador de passos ──────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div className="flex gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'h-1 flex-1 rounded-full transition-all duration-300',
            i < current  ? 'bg-accent-3' :
            i === current ? 'bg-accent' :
            'bg-[var(--border2)]'
          )}
        />
      ))}
    </div>
  )
}

// ── Selector de tipo de conta ────────────────────────────────
function AccountTypeSelector({ onSelect }) {
  return (
    <div>
      <div className="font-syne font-black text-2xl mb-2">Criar conta</div>
      <p className="text-[var(--muted)] text-sm mb-8">
        Que tipo de conta queres criar?
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* Cliente */}
        <button
          onClick={() => onSelect('cliente')}
          className="group p-6 rounded-2xl border border-[var(--border2)] bg-[var(--surface2)]
            hover:border-accent hover:bg-accent/5 transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4
            group-hover:bg-accent/20 transition-colors">
            <Briefcase size={22} className="text-accent" />
          </div>
          <div className="font-syne font-bold text-base mb-1">Cliente</div>
          <div className="text-[var(--muted)] text-xs leading-relaxed">
            Publicar projectos e contratar profissionais
          </div>
        </button>

        {/* Profissional */}
        <button
          onClick={() => onSelect('profissional')}
          className="group p-6 rounded-2xl border border-[var(--border2)] bg-[var(--surface2)]
            hover:border-accent hover:bg-accent/5 transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4
            group-hover:bg-accent/20 transition-colors">
            <User size={22} className="text-accent" />
          </div>
          <div className="font-syne font-bold text-base mb-1">Profissional</div>
          <div className="text-[var(--muted)] text-xs leading-relaxed">
            Oferecer serviços e receber projectos
          </div>
        </button>
      </div>

      <p className="text-center text-sm text-[var(--muted)] mt-6">
        Já tens conta?{' '}
        <Link to="/login" className="text-accent font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

// ── Upload de avatar ─────────────────────────────────────────
function AvatarUpload({ value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem demasiado grande. Máximo 5MB.')
      return
    }
    onChange(file)
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <div
        className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--border2)]
          bg-[var(--surface2)] flex items-center justify-center cursor-pointer
          hover:border-accent transition-all duration-200 overflow-hidden relative group"
        onClick={() => document.getElementById('avatar-input').click()}
      >
        {value ? (
          <>
            <img
              src={URL.createObjectURL(value)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
              transition-opacity flex items-center justify-center">
              <Upload size={18} className="text-white" />
            </div>
          </>
        ) : (
          <Upload size={22} className="text-[var(--muted)]" />
        )}
      </div>
      <input
        id="avatar-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <p className="text-xs text-[var(--muted)]">
        Foto de perfil · JPG, PNG ou WebP · Máx 5MB
      </p>
    </div>
  )
}

// ── Upload de CV ─────────────────────────────────────────────
function FileUpload({ label, accept, value, onChange, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--muted)]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div
        className={clsx(
          'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
          value
            ? 'border-accent-3/40 bg-accent-3/5'
            : 'border-[var(--border2)] bg-[var(--surface2)] hover:border-accent hover:bg-accent/5'
        )}
        onClick={() => document.getElementById(`file-${label}`).click()}
      >
        {value ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-accent-3">✓</span>
            <span className="text-[var(--text)] truncate max-w-[200px]">{value.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="text-[var(--muted)] hover:text-red-400 ml-1"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="text-[var(--muted)] text-sm">
            <Upload size={20} className="mx-auto mb-2 opacity-50" />
            Clica para carregar
          </div>
        )}
      </div>
      <input
        id={`file-${label}`}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files[0] || null)}
      />
    </div>
  )
}

// ── Indicador de força da password ──────────────────────────
function PasswordStrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password || '')
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? color : 'bg-[var(--border2)]'
            )}
          />
        ))}
      </div>
      <p className="text-xs mt-1 text-[var(--muted)]">Password: {label}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const navigate = useNavigate()
  const { show } = useToast()

  const [accountType, setAccountType] = useState(null) // 'cliente' | 'profissional'
  const [step, setStep]               = useState(0)    // 0=tipo, 1=dados, 2=perfil-pro, 3=concluído
  const [avatarFile, setAvatarFile]   = useState(null)
  const [cvFile, setCvFile]           = useState(null)
  const [savedStep1, setSavedStep1]   = useState(null)  // dados do step 1
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  // ── Form step 1 (dados básicos) ──────────────────────────
  const step1Schema = accountType === 'profissional'
    ? registerProfissionalStep1Schema
    : registerClienteSchema

  const formStep1 = useForm({ resolver: zodResolver(step1Schema) })
  const watchPass = formStep1.watch('password')

  // ── Form step 2 (perfil profissional) ───────────────────
  const formStep2 = useForm({ resolver: zodResolver(registerProfissionalStep2Schema) })

  // ── Seleccionar tipo de conta ────────────────────────────
  const handleSelectType = (type) => {
    setAccountType(type)
    setStep(1)
  }

  // ── Submeter step 1 ──────────────────────────────────────
  const submitStep1 = formStep1.handleSubmit(async (data) => {
    setSavedStep1(data)
    setServerError('')

    if (accountType === 'profissional') {
      setStep(2)
      return
    }

    // Cliente: regista directamente
    await handleFinalSubmit(data, null)
  })

  // ── Submeter step 2 (profissional) ──────────────────────
  const submitStep2 = formStep2.handleSubmit(async (data) => {
    if (!cvFile) {
      show('O Curriculum Vitae em PDF é obrigatório.', 'error')
      return
    }
    await handleFinalSubmit(savedStep1, data)
  })

  // ── Registo final ─────────────────────────────────────────
  const handleFinalSubmit = async (step1Data, step2Data) => {
    setSubmitting(true)
    setServerError('')

    try {
      let avatarUrl = null
      let cvUrl     = null

      // 1. Upload da foto de perfil
      if (avatarFile) {
        avatarUrl = await uploadService.uploadAvatar(avatarFile)
      }

      // 2. Upload do CV (apenas profissional)
      if (cvFile) {
        cvUrl = await uploadService.uploadDocument(cvFile, 'cv')
      }

      // 3. Registar utilizador
      if (accountType === 'cliente') {
        await authService.registerCliente({
          nome:     step1Data.nome,
          apelido:  step1Data.apelido,
          email:    step1Data.email,
          password: step1Data.password,
          avatarUrl,
        })
      } else {
        const portfolioUrls = (step2Data.portfolioUrls || '')
          .split('\n')
          .map((u) => u.trim())
          .filter(Boolean)

        await authService.registerProfissional({
          nome:     step1Data.nome,
          apelido:  step1Data.apelido,
          email:    step1Data.email,
          password: step1Data.password,
          avatarUrl,
          profData: {
            area:          step1Data.area,
            localizacao:   step1Data.localizacao,
            idade:         Number(step1Data.idade),
            descricao:     step2Data.descricao,
            tarifaHora:    Number(step2Data.tarifaHora),
            portfolioUrls,
            cvUrl,
          },
        })
      }

      setStep(99) // ecrã de sucesso
    } catch (err) {
      setServerError(err.message)
      show(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg)]">
      <div className="orb w-[600px] h-[600px] bg-accent top-[-200px] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-accent-2 bottom-[-100px] right-[-100px]" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-[520px] relative z-10">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[28px] p-10">

          {/* Logo */}
          <Link to="/" className="font-syne font-black text-xl gradient-text mb-8 block">
            CONNECT HUB
          </Link>

          {/* ── STEP 0: Escolher tipo ── */}
          {step === 0 && (
            <AccountTypeSelector onSelect={handleSelectType} />
          )}

          {/* ── STEP 1: Dados básicos ── */}
          {step === 1 && (
            <form onSubmit={submitStep1} className="flex flex-col gap-4">
              <StepIndicator
                current={0}
                total={accountType === 'profissional' ? 2 : 1}
              />

              <div>
                <h2 className="font-syne font-black text-2xl mb-1">
                  {accountType === 'profissional' ? 'Dados do profissional' : 'Criar conta'}
                </h2>
                <p className="text-[var(--muted)] text-sm mb-6">
                  {accountType === 'profissional'
                    ? 'O teu perfil será avaliado antes da activação.'
                    : 'Preenche os teus dados para começar.'}
                </p>
              </div>

              {/* Avatar */}
              <AvatarUpload value={avatarFile} onChange={setAvatarFile} />

              {/* Nome e apelido */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nome *"
                  placeholder="João"
                  error={formStep1.formState.errors.nome?.message}
                  {...formStep1.register('nome')}
                />
                <Input
                  label="Apelido *"
                  placeholder="Silva"
                  error={formStep1.formState.errors.apelido?.message}
                  {...formStep1.register('apelido')}
                />
              </div>

              <Input
                label="Email *"
                type="email"
                placeholder="o.teu@email.com"
                autoComplete="email"
                error={formStep1.formState.errors.email?.message}
                {...formStep1.register('email')}
              />

              {/* Campos extra para profissional */}
              {accountType === 'profissional' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Idade *"
                      type="number"
                      placeholder="25"
                      error={formStep1.formState.errors.idade?.message}
                      {...formStep1.register('idade', { valueAsNumber: true })}
                    />
                    <Input
                      label="Localização *"
                      placeholder="Luanda, Angola"
                      error={formStep1.formState.errors.localizacao?.message}
                      {...formStep1.register('localizacao')}
                    />
                  </div>
                  <Select
                    label="Área profissional *"
                    error={formStep1.formState.errors.area?.message}
                    {...formStep1.register('area')}
                  >
                    <option value="">Seleccionar área...</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </Select>
                </>
              )}

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  error={formStep1.formState.errors.password?.message}
                  {...formStep1.register('password')}
                />
                <PasswordStrengthBar password={watchPass} />
              </div>

              <Input
                label="Confirmar password *"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={formStep1.formState.errors.confirmPassword?.message}
                {...formStep1.register('confirmPassword')}
              />

              {serverError && (
                <p className="text-red-400 text-sm">{serverError}</p>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep(0); setAccountType(null) }}
                >
                  <ChevronLeft size={16} /> Voltar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="flex-1"
                >
                  {accountType === 'profissional' ? 'Continuar' : 'Criar conta'}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Perfil profissional ── */}
          {step === 2 && accountType === 'profissional' && (
            <form onSubmit={submitStep2} className="flex flex-col gap-4">
              <StepIndicator current={1} total={2} />

              <div>
                <h2 className="font-syne font-black text-2xl mb-1">Perfil profissional</h2>
                <p className="text-[var(--muted)] text-sm mb-6">
                  Informações obrigatórias para aprovação. Quanto mais completo, mais rápida a aprovação.
                </p>
              </div>

              <Textarea
                label="Descrição profissional *"
                placeholder="Descreve a tua experiência, especializações e o que podes oferecer aos clientes..."
                hint={`Mínimo 100 caracteres`}
                error={formStep2.formState.errors.descricao?.message}
                className="min-h-[120px]"
                {...formStep2.register('descricao')}
              />

              <Input
                label="Tarifa por hora (USD) *"
                type="number"
                placeholder="25"
                hint="Valor mínimo: $5/hora"
                error={formStep2.formState.errors.tarifaHora?.message}
                {...formStep2.register('tarifaHora', { valueAsNumber: true })}
              />

              <Textarea
                label="Links do portfólio (um por linha)"
                placeholder={'https://github.com/usuario\nhttps://meusite.com'}
                hint="Opcional — links para trabalhos anteriores"
                className="min-h-[80px]"
                {...formStep2.register('portfolioUrls')}
              />

              <FileUpload
                label="Curriculum Vitae (PDF)"
                accept=".pdf"
                value={cvFile}
                onChange={setCvFile}
                required
              />

              {serverError && (
                <p className="text-red-400 text-sm">{serverError}</p>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft size={16} /> Voltar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="flex-1"
                >
                  Submeter perfil <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 99: Sucesso ── */}
          {step === 99 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-accent-3/10 border-2 border-accent-3/30
                flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✓</span>
              </div>

              {accountType === 'profissional' ? (
                <>
                  <h2 className="font-syne font-black text-2xl mb-3">Perfil submetido!</h2>
                  <p className="text-[var(--muted)] text-sm leading-relaxed mb-8">
                    O teu perfil foi enviado para aprovação. A nossa equipa irá analisá-lo
                    nas próximas 24–48 horas. Receberás um email quando for aprovado.
                    <br /><br />
                    Antes disso, verifica o teu email.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-syne font-black text-2xl mb-3">Conta criada!</h2>
                  <p className="text-[var(--muted)] text-sm leading-relaxed mb-8">
                    Verifica o teu email para activar a conta.
                    Enviámos um código de 6 dígitos.
                  </p>
                </>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/verificar-email')}
              >
                Verificar email →
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
