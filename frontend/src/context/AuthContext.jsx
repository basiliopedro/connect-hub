import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

/**
 * AuthProvider — envolve toda a app e expõe:
 *   user        → dados do Supabase Auth
 *   profile     → dados estendidos da tabela users (role, status, etc.)
 *   loading     → true enquanto verifica a sessão inicial
 *   signOut     → termina sessão e limpa estado
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Supabase Auth user
  const [profile, setProfile] = useState(null) // tabela public.users
  const [loading, setLoading] = useState(true)

  // Busca o perfil estendido do utilizador
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error.message)
      return null
    }
    return data
  }, [])

  // Inicializa sessão ao carregar a app
  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Verifica se há sessão activa
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user && mounted) {
        setUser(session.user)
        const p = await fetchProfile(session.user.id)
        if (mounted) setProfile(p)
      }

      if (mounted) setLoading(false)
    }

    init()

    // Ouve mudanças de sessão em tempo real
    // (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    // onAuthStateChange trata de limpar o estado
  }

  // Recarrega o perfil (útil após editar dados)
  const refreshProfile = async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    isAdmin: profile?.role === 'admin',
    isProfessional: profile?.role === 'profissional',
    isClient: profile?.role === 'cliente',
    isPending: profile?.status === 'pending_approval',
    isBlocked: profile?.status === 'blocked',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook de conveniência
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
