import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)]">
      <div className="font-syne font-black text-2xl gradient-text">
        CONNECT HUB
      </div>
      <Loader2 size={24} className="animate-spin text-accent" />
    </div>
  )
}
