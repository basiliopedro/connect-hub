import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

/**
 * ProtectedRoute — guarda rotas por autenticação e role.
 *
 * Exemplos de uso:
 *   <ProtectedRoute>                    → só requer login
 *   <ProtectedRoute role="admin">       → só admin
 *   <ProtectedRoute role="profissional"> → só profissional aprovado
 */
export function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Enquanto verifica a sessão, mostra loading
  if (loading) return <LoadingScreen />

  // Não autenticado → redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Conta bloqueada
  if (profile?.status === 'blocked') {
    return <Navigate to="/conta-bloqueada" replace />
  }

  // Verificação de email pendente
  if (profile && !profile.verified_email) {
    return <Navigate to="/verificar-email" replace />
  }

  // Guarda de role específico
  if (role && profile?.role !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

/**
 * AdminRoute — atalho para rotas exclusivas do admin.
 * Redireciona para /dashboard se o utilizador não for admin.
 */
export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/admin" state={{ from: location }} replace />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}

/**
 * GuestRoute — redireciona utilizadores já autenticados
 * (evita aceder ao login estando já dentro)
 */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />

  return children
}
