import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export default function BlockedPage() {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20
          flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={32} className="text-red-400" />
        </div>
        <h1 className="font-syne font-black text-2xl mb-3">Conta bloqueada</h1>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-8">
          A tua conta foi suspensa temporariamente. Se acreditas que isso é um erro,
          contacta o suporte através de <strong>suporte@connecthub.ao</strong>.
        </p>
        <Button variant="outline" onClick={signOut}>
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
