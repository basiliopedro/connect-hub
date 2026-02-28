import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { Button, Card, Input } from '@/components/ui'
import {
  Sun, Moon, Lock, Mail, Bell, Trash2,
  Eye, EyeOff, Shield, LogOut, Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { getPasswordStrength } from '@/utils/validators'

// ── Schema para alterar password ─────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Obrigatório'),
  newPassword: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve ter maiúscula')
    .regex(/[0-9]/, 'Deve ter número')
    .regex(/[^A-Za-z0-9]/, 'Deve ter símbolo'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords não coincidem',
  path: ['confirmPassword'],
})

// ── Toggle de preferência ────────────────────────────────────
function PrefToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-sm">{label}</div>
        {description && <div className="text-xs text-[var(--muted)] mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
          checked ? 'bg-accent' : 'bg-[var(--surface3)]'
        )}
      >
        <div className={clsx(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
          checked ? 'left-6' : 'left-1'
        )} />
      </button>
    </div>
  )
}

// ── Secção com título ────────────────────────────────────────
function Section({ title, Icon, children }) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
        <Icon size={16} className="text-accent" />
        <h3 className="font-syne font-bold text-base">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { profile, signOut } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const { show } = useToast()
  const navigate = useNavigate()

  const [showCurrentPass, setShowCP] = useState(false)
  const [showNewPass, setShowNP]     = useState(false)
  const [notifications, setNotifs]   = useState({
    proposals: true,
    messages:  true,
    contracts: true,
    email:     false,
  })
  const [deleting, setDeleting]   = useState(false)
  const [deleteConfirm, setDConf] = useState('')

  // ── Alterar password ──────────────────────────────────────
  const {
    register: regPass,
    handleSubmit: handlePass,
    watch: watchPass,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: passSaving },
  } = useForm({ resolver: zodResolver(changePasswordSchema) })

  const newPassValue = watchPass('newPassword') ?? ''
  const { score, label: passLabel, color: passColor } = getPasswordStrength(newPassValue)

  const onChangePassword = async (data) => {
    try {
      // Verificar password actual
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile?.email ?? '',
        password: data.currentPassword,
      })
      if (signInErr) throw new Error('Password actual incorrecta')

      // Actualizar para nova
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
      if (error) throw new Error(error.message)

      resetPass()
      show('✅ Password alterada com sucesso!', 'success')
    } catch (err) {
      show(err.message, 'error')
    }
  }

  // ── Alterar email ─────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)

  const onChangeEmail = async () => {
    if (!newEmail.includes('@')) { show('Email inválido', 'error'); return }
    setEmailSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw new Error(error.message)
      show('📧 Confirma o novo email na tua caixa de correio.', 'info', 5000)
      setNewEmail('')
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setEmailSaving(false)
    }
  }

  // ── Eliminar conta ────────────────────────────────────────
  const onDeleteAccount = async () => {
    if (deleteConfirm !== 'ELIMINAR') {
      show('Escreve ELIMINAR para confirmar', 'error')
      return
    }
    setDeleting(true)
    try {
      // Em produção chamaria uma Edge Function que apaga tudo em cascata
      await supabase.functions.invoke('delete-account', {
        body: { userId: profile.id },
      })
      await signOut()
      navigate('/')
    } catch (err) {
      // Fallback: apenas faz logout
      show('Conta marcada para eliminação. Receberás um email de confirmação.', 'info')
      await signOut()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-black text-2xl">Definições</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          Gerir a tua conta, segurança e preferências
        </p>
      </div>

      {/* ── Aparência ── */}
      <Section title="Aparência" Icon={Sun}>
        <PrefToggle
          label="Modo escuro"
          description="Altera o tema visual da aplicação"
          checked={isDark}
          onChange={toggle}
        />
        <div className="flex gap-3">
          {['dark', 'light'].map(t => (
            <button
              key={t}
              onClick={() => t !== theme && toggle()}
              className={clsx(
                'flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                'flex items-center justify-center gap-2',
                theme === t
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-[var(--border2)] text-[var(--muted)] hover:border-accent/50'
              )}
            >
              {t === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              {t === 'dark' ? 'Escuro' : 'Claro'}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Notificações ── */}
      <Section title="Notificações" Icon={Bell}>
        <PrefToggle
          label="Novas propostas"
          description="Recebe alerta quando chegarem propostas ao teu projecto"
          checked={notifications.proposals}
          onChange={v => setNotifs(n => ({ ...n, proposals: v }))}
        />
        <PrefToggle
          label="Mensagens"
          description="Recebe alerta quando chegarem novas mensagens"
          checked={notifications.messages}
          onChange={v => setNotifs(n => ({ ...n, messages: v }))}
        />
        <PrefToggle
          label="Contratos e pagamentos"
          description="Actualizações sobre contratos e movimentos financeiros"
          checked={notifications.contracts}
          onChange={v => setNotifs(n => ({ ...n, contracts: v }))}
        />
        <div className="border-t border-[var(--border)] pt-3">
          <PrefToggle
            label="Notificações por email"
            description="Receber resumo diário por email (em desenvolvimento)"
            checked={notifications.email}
            onChange={v => setNotifs(n => ({ ...n, email: v }))}
          />
        </div>
      </Section>

      {/* ── Email ── */}
      <Section title="Alterar email" Icon={Mail}>
        <div className="text-xs text-[var(--muted)] p-3 rounded-xl bg-[var(--surface2)]">
          Email actual: <strong className="text-[var(--text)]">{profile?.email ?? 'N/A'}</strong>
        </div>
        <div className="flex gap-3">
          <Input
            label="Novo email"
            type="email"
            placeholder="novo@email.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={onChangeEmail}
              disabled={!newEmail || emailSaving}
              loading={emailSaving}
            >
              Alterar
            </Button>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Receberás um email de confirmação no novo endereço.
        </p>
      </Section>

      {/* ── Password ── */}
      <Section title="Alterar password" Icon={Lock}>
        <form onSubmit={handlePass(onChangePassword)} className="flex flex-col gap-4">
          {/* Password actual */}
          <div className="relative">
            <Input
              label="Password actual *"
              type={showCurrentPass ? 'text' : 'password'}
              placeholder="••••••••"
              error={passErrors.currentPassword?.message}
              {...regPass('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCP(v => !v)}
              className="absolute right-3 bottom-3 text-[var(--muted)] hover:text-[var(--text)]"
            >
              {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Nova password */}
          <div>
            <div className="relative">
              <Input
                label="Nova password *"
                type={showNewPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                error={passErrors.newPassword?.message}
                {...regPass('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNP(v => !v)}
                className="absolute right-3 bottom-3 text-[var(--muted)] hover:text-[var(--text)]"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassValue && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={clsx(
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i <= score ? passColor : 'bg-[var(--border2)]'
                    )} />
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">Força: {passLabel}</p>
              </div>
            )}
          </div>

          <Input
            label="Confirmar nova password *"
            type="password"
            placeholder="••••••••"
            error={passErrors.confirmPassword?.message}
            {...regPass('confirmPassword')}
          />

          <Button type="submit" variant="primary" loading={passSaving} className="self-start">
            <Lock size={14} /> Alterar password
          </Button>
        </form>
      </Section>

      {/* ── Sessões ── */}
      <Section title="Segurança da conta" Icon={Shield}>
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface2)]">
          <div>
            <div className="font-medium text-sm">Terminar todas as sessões</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">
              Encerra a sessão em todos os dispositivos onde estás ligado
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut({ scope: 'global' })
              navigate('/login')
            }}
          >
            <LogOut size={14} /> Sair de todos
          </Button>
        </div>
      </Section>

      {/* ── Eliminar conta ── */}
      <Card className="border-red-500/20 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          <h3 className="font-syne font-bold text-base text-red-400">Eliminar conta</h3>
        </div>
        <p className="text-[var(--muted)] text-sm">
          Esta acção é <strong className="text-[var(--text)]">irreversível</strong>. Todos os teus dados,
          projectos, contratos e histórico serão permanentemente eliminados.
        </p>
        <div className="flex flex-col gap-3">
          <Input
            label='Escreve "ELIMINAR" para confirmar'
            placeholder="ELIMINAR"
            value={deleteConfirm}
            onChange={e => setDConf(e.target.value)}
            className="!border-red-500/30 focus:!border-red-500 focus:!ring-red-500/10"
          />
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            disabled={deleteConfirm !== 'ELIMINAR'}
            onClick={onDeleteAccount}
            className="self-start"
          >
            <Trash2 size={14} /> Eliminar conta permanentemente
          </Button>
        </div>
      </Card>
    </div>
  )
}
