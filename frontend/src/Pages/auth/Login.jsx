import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { loginSchema } from '@/utils/validators'
import { authService } from '@/services/authService'
import { useToast } from '@/components/ui/Toast'
import { Button, Input } from '@/components/ui'

// Rate limit no cliente (o servidor tem o seu próprio)
const loginAttempts = { count: 0, firstAt: null }
const MAX_CLIENT_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

function checkClientRateLimit() {
  const now = Date.now()
  if (!loginAttempts.firstAt || now - loginAttempts.firstAt > LOCKOUT_MS) {
    loginAttempts.count = 0
    loginAttempts.firstAt = now
  }
  return loginAttempts.count < MAX_CLIENT_ATTEMPTS
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { show } = useToast()
  const [serverError, setServerError] = useState('')
  const [locked, setLocked] = useState(false)
  const [lockSeconds, setLockSeconds] = useState(0)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const startLockout = () => {
    setLocked(true)
    let secs = 30
    setLockSeconds(secs)
    const iv = setInterval(() => {
      secs--
      setLockSeconds(secs)
      if (secs <= 0) { clearInterval(iv); setLocked(false) }
    }, 1000)
  }

  const onSubmit = async ({ email, password }) => {
    setServerError('')

    // Verificar rate limit no cliente
    if (!checkClientRateLimit()) {
      startLockout()
      return
    }

    try {
      await authService.login(email, password)
      // AuthContext detecta a sessão via onAuthStateChange
      navigate(from, { replace: true })
    } catch (err) {
      loginAttempts.count++
      setServerError(err.message)
      if (loginAttempts.count >= MAX_CLIENT_ATTEMPTS) startLockout()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg)]">
      {/* Orbs de fundo */}
      <div className="orb w-[600px] h-[600px] bg-accent top-[-200px] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-accent-2 bottom-[-100px] right-[-100px]" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[28px] p-11">

          {/* Logo */}
          <Link to="/" className="font-syne font-black text-xl gradient-text mb-8 block">
            CONNECT HUB
          </Link>

          <h2 className="font-syne font-black text-[1.7rem] mb-1">Bem-vindo de volta</h2>
          <p className="text-[var(--muted)] text-sm mb-7">Entra na tua conta para continuar</p>

          {/* Erro de servidor */}
          {serverError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} />
              {serverError}
            </div>
          )}

          {/* Rate limit */}
          {locked && (
            <div className="p-3 mb-4 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-sm">
              ⚠️ Demasiadas tentativas. Aguarda {lockSeconds}s.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="o.teu@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={locked}
              className="w-full mt-2"
            >
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--muted)] mt-5">
            Não tens conta?{' '}
            <Link to="/register" className="text-accent font-medium hover:underline">
              Regista-te grátis
            </Link>
          </p>

          <p className="text-center text-sm mt-2">
            <Link to="/admin" className="text-[var(--muted)] hover:text-[var(--text)] text-xs">
              Acesso Admin Office →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
