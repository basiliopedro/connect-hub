import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-[var(--bg)] text-center relative overflow-hidden">
      <div className="orb w-[600px] h-[600px] bg-accent top-[-200px] left-[-200px]" />
      <div className="orb w-[400px] h-[400px] bg-accent-2 bottom-[-100px] right-[-100px]" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl">
        <div className="font-syne font-black text-5xl gradient-text">CONNECT HUB</div>
        <p className="text-[var(--muted)] text-lg leading-relaxed">
          O marketplace de profissionais verificados para o mercado angolano e lusófono.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/register">
            <Button variant="primary" size="lg">Criar conta grátis</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Entrar</Button>
          </Link>
        </div>
        <Link to="/admin" className="text-[var(--muted)] text-xs hover:text-accent">
          Admin Office →
        </Link>
      </div>
    </div>
  )
}
