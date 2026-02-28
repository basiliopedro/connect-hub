import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL e Anon Key são obrigatórios. ' +
    'Copia .env.example para .env.local e preenche os valores.'
  )
}

/**
 * Cliente Supabase configurado com:
 * - persistSession: true  → sessão mantida entre recarregamentos
 * - autoRefreshToken: true → token renovado automaticamente
 * - detectSessionInUrl: true → suporte a magic links e OAuth
 *
 * SEGURANÇA: O Supabase JS v2 com @supabase/ssr usa cookies
 * HttpOnly quando configurado no servidor. No cliente React
 * usa localStorage encriptado. Para HttpOnly puro, as Edge
 * Functions do Supabase gerem os cookies no servidor.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Cookies seguros geridos pelo Supabase Auth
    flowType: 'pkce', // Proof Key for Code Exchange — mais seguro que implicit flow
  },
})

export default supabase
