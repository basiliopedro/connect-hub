import { createContext, useContext, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle size={16} className="text-red-400 flex-shrink-0" />,
    info: <Info size={16} className="text-accent flex-shrink-0" />,
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-24 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl max-w-xs text-sm pointer-events-auto',
              'bg-[var(--surface)] border border-[var(--border2)] shadow-xl',
              'animate-[slideIn_0.3s_cubic-bezier(0.22,1,0.36,1)]'
            )}
          >
            {icons[t.type]}
            <span className="text-[var(--text)]">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-auto text-[var(--muted)] hover:text-[var(--text)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
