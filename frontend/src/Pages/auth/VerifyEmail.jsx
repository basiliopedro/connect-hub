import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui'
import { ShieldCheck } from 'lucide-react'

export default function VerifyEmailPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { show } = useToast()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputs = useRef([])

  // Foco no primeiro input ao montar
  useEffect(() => { inputs.current[0]?.focus() }, [])

  if (!user) {
    navigate('/login')
    return null
  }

  const handleChange = (i, val) => {
    // Só aceita dígitos
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    setError('')
    // Avançar para o próximo input
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
    // Suporte a colar código completo
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...code]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setCode(next)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length < 6) {
      setError('Introduz os 6 dígitos do código')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authService.verifyEmail(user.id, fullCode)
      await refreshProfile()
      show('✅ Email verificado com sucesso!', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      // Limpar código após erro
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await authService.generateVerificationCode(user.id, user.email)
      show('📧 Novo código enviado!', 'info')
      setResendCooldown(60)
      const iv = setInterval(() => {
        setResendCooldown(s => {
          if (s <= 1) { clearInterval(iv); return 0 }
          return s - 1
        })
      }, 1000)
    } catch {
      show('Erro ao reenviar. Tenta novamente.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--bg)]">
      <div className="orb w-[500px] h-[500px] bg-accent top-[-150px] left-[-150px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[28px] p-11 text-center">

          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={28} className="text-accent" />
          </div>

          <h2 className="font-syne font-black text-2xl mb-2">Verifica o teu email</h2>
          <p className="text-[var(--muted)] text-sm mb-2">
            Enviámos um código de 6 dígitos para
          </p>
          <p className="font-semibold text-sm mb-8">{user.email}</p>

          {/* Inputs do código */}
          <div className="flex gap-2.5 justify-center mb-4">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl
                  bg-[var(--surface2)] border border-[var(--border2)]
                  text-[var(--text)] outline-none
                  focus:border-accent focus:ring-2 focus:ring-accent/10
                  transition-all duration-200"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleVerify}
            className="w-full mb-4"
          >
            Verificar email
          </Button>

          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm text-[var(--muted)] hover:text-accent disabled:cursor-not-allowed transition-colors"
          >
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : 'Não recebeste o código? Reenviar'
            }
          </button>

          {/* Nota de desenvolvimento */}
          <div className="mt-6 p-3 rounded-xl bg-accent/5 border border-accent/12 text-xs text-[var(--muted)] text-left">
            <strong className="text-[var(--text)]">Modo desenvolvimento:</strong> O código aparece
            na consola do browser e no terminal do Supabase Edge Functions.
            Em produção é enviado por email via Resend.
          </div>
        </div>
      </div>
    </div>
  )
}
