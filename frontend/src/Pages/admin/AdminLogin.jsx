import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldAlert, AlertCircle } from 'lucide-react'
import { loginSchema } from '@/utils/validators'
import { authService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { Button, Input } from '@/components/ui'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [serverError, setServerError] = useState('')

  // Se já está autenticado como admin, redireciona
  if (profile?.role === 'admin') {
    navigate('/admin/painel', { replace: true })
    return null
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    try {
      const { user } = await authService.login(email, password)

      // Verificar role admin após login
      const { data: profileData } = await import('@/lib/supabase')
        .then(({ supabase }) =>
          supabase.from('users').select('role').eq('id', user.id).single()
        )

      if (profileData?.role !== 'admin') {
        await authService.logout()
        setServerError('Acesso negado. Esta área é exclusiva para administradores.')
        return
      }

      navigate('/admin/painel', { replace: true })
    } catch (err) {
      setServerError('Credenciais inválidas ou acesso não autorizado.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg)]">
      {/* Orb vermelho para distinguir visualmente da área pública */}
      <div
        className="orb w-[500px] h-[500px] top-[-150px] left-[-150px]"
        style={{ background: '#ef4444', opacity: 0.08 }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[var(--surface)] border border-red-500/20 rounded-[28px] p-11">

          {/* Logo */}
          <Link to="/" className="font-syne font-black text-xl gradient-text mb-6 block">
            CONNECT HUB
          </Link>

          {/* Badge admin */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold
            mb-6">
            <ShieldAlert size={13} />
            ADMIN OFFICE — ACESSO RESTRITO
          </div>

          <h2 className="font-syne font-black text-[1.7rem] mb-2">Escritório do Dono</h2>
          <p className="text-[var(--muted)] text-sm mb-7">
            Esta área não é acessível pelo site público. Apenas administradores autorizados.
          </p>

          {serverError && (
            <div className="flex items-start gap-2 p-3 mb-5 rounded-xl
              bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email de administrador"
              type="email"
              placeholder="admin@connecthub.ao"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password de administrador"
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
              className="w-full mt-2"
            >
              Entrar no Admin Office
            </Button>
          </form>

          <p className="text-center mt-6">
            <Link to="/" className="text-[var(--muted)] text-xs hover:text-[var(--text)]">
              ← Voltar ao site público
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
