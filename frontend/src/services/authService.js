import { supabase } from '@/lib/supabase'

/**
 * authService — centraliza todas as operações de autenticação.
 * O componente chama o service, o service fala com o Supabase.
 * Nunca misturamos lógica de auth directamente nos componentes.
 */
export const authService = {

  /**
   * REGISTO — Cliente
   * Fluxo: criar conta Auth → inserir perfil → enviar código email
   */
  async registerCliente({ nome, apelido, email, password }) {
    // 1. Criar conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Não envia email de confirmação automático do Supabase
        // Usamos o nosso próprio sistema de código de 6 dígitos
        emailRedirectTo: undefined,
        data: { nome, apelido, role: 'cliente' },
      },
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Erro ao criar utilizador')

    // 2. Inserir perfil estendido na tabela users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // mesmo UUID do Auth
        nome,
        apelido,
        role: 'cliente',
        status: 'active',
        verified_email: false,
      })

    if (profileError) throw new Error(profileError.message)

    // 3. Gerar e guardar código de verificação
    await authService.generateVerificationCode(authData.user.id, email)

    return authData.user
  },

  /**
   * REGISTO — Profissional
   * Fluxo: criar conta Auth → inserir perfil → inserir perfil profissional → enviar código
   */
  async registerProfissional({ nome, apelido, email, password, profData }) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, apelido, role: 'profissional' },
      },
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Erro ao criar utilizador')

    // Inserir perfil base
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        nome,
        apelido,
        role: 'profissional',
        status: 'pending_approval', // aguarda aprovação do admin
        verified_email: false,
      })

    if (profileError) throw new Error(profileError.message)

    // Inserir perfil profissional
    const { error: proError } = await supabase
      .from('professional_profiles')
      .insert({
        user_id: authData.user.id,
        area: profData.area,
        descricao: profData.descricao,
        tarifa_hora: profData.tarifaHora,
        localizacao: profData.localizacao,
        idade: profData.idade,
        portfolio_urls: profData.portfolioUrls || [],
      })

    if (proError) throw new Error(proError.message)

    // Código de verificação
    await authService.generateVerificationCode(authData.user.id, email)

    return authData.user
  },

  /**
   * Gera código 6 dígitos, guarda na BD, chama Edge Function para enviar email
   */
  async generateVerificationCode(userId, email) {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

    // Invalida códigos anteriores
    await supabase
      .from('email_verifications')
      .update({ usado: true })
      .eq('user_id', userId)
      .eq('usado', false)

    // Insere novo código
    const { error } = await supabase
      .from('email_verifications')
      .insert({ user_id: userId, codigo, expira_em: expiraEm })

    if (error) throw new Error('Erro ao criar código de verificação')

    // Chama Edge Function para enviar o email via Resend
    const { error: fnError } = await supabase.functions.invoke('send-verification-email', {
      body: { email, codigo, nome: '' },
    })

    // Em desenvolvimento, mostramos o código no console
    if (fnError) {
      console.warn('Edge Function não disponível. Código para desenvolvimento:', codigo)
    }

    return codigo // Retornamos para usar em desenvolvimento/testes
  },

  /**
   * VERIFICAR EMAIL — valida código de 6 dígitos
   */
  async verifyEmail(userId, codigoInserido) {
    const { data, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('codigo', codigoInserido)
      .eq('usado', false)
      .gte('expira_em', new Date().toISOString())
      .single()

    if (error || !data) {
      // Incrementar tentativas
      await supabase.rpc('increment_verification_attempts', { p_user_id: userId })
      throw new Error('Código inválido ou expirado')
    }

    if (data.tentativas >= 5) {
      throw new Error('Demasiadas tentativas. Solicita um novo código.')
    }

    // Marcar código como usado
    await supabase
      .from('email_verifications')
      .update({ usado: true })
      .eq('id', data.id)

    // Marcar email como verificado
    await supabase
      .from('users')
      .update({ verified_email: true })
      .eq('id', userId)

    return true
  },

  /**
   * LOGIN — email + password
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Mensagem genérica para não revelar se o email existe
      throw new Error('Email ou password incorretos')
    }

    return data
  },

  /**
   * LOGOUT
   */
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  /**
   * Obter utilizador actual
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
}
