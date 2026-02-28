import { supabase } from '@/lib/supabase'

/**
 * uploadService — gere todos os uploads para o Supabase Storage.
 *
 * Buckets configurados no Supabase:
 *   avatars    → fotos de perfil (público)
 *   documents  → CVs e certificados (privado)
 *   portfolios → ficheiros de portfólio (público)
 */
export const uploadService = {

  /**
   * Upload de foto de perfil com compressão automática.
   * Retorna a URL pública da imagem.
   */
  async uploadAvatar(file) {
    // Comprime antes de fazer upload
    const compressed = await compressImage(file, 400, 0.8)

    const ext      = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path     = `public/${filename}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, compressed, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw new Error(`Erro ao carregar foto: ${error.message}`)

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  },

  /**
   * Upload de documentos (CV, certificados).
   * Retorna o path privado (não URL pública — requer signed URL).
   */
  async uploadDocument(file, type = 'cv') {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Ficheiro demasiado grande. Máximo 10MB.')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const ext      = file.name.split('.').pop()
    const filename = `${user.id}/${type}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('documents')
      .upload(filename, file, {
        contentType: file.type,
        upsert: true, // substitui se já existir CV anterior
      })

    if (error) throw new Error(`Erro ao carregar documento: ${error.message}`)

    return filename // guardamos o path, não a URL
  },

  /**
   * Gera URL temporária (1 hora) para documentos privados.
   * Usada pelo admin ao ver o CV de um profissional.
   */
  async getDocumentSignedUrl(path) {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600) // 1 hora

    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  /**
   * Actualiza a foto de perfil do utilizador actual.
   */
  async updateUserAvatar(file) {
    const url = await uploadService.uploadAvatar(file)

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: url })
      .eq('id', (await supabase.auth.getUser()).data.user?.id)

    if (error) throw new Error(error.message)
    return url
  },
}

/**
 * Comprime uma imagem usando Canvas API.
 * maxSize: dimensão máxima em pixels (largura ou altura)
 * quality: 0-1 para JPEG
 */
async function compressImage(file, maxSize = 400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Calcular novo tamanho mantendo proporção
      if (width > height) {
        if (width > maxSize) { height = (height * maxSize) / width; width = maxSize }
      } else {
        if (height > maxSize) { width = (width * maxSize) / height; height = maxSize }
      }

      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha ao comprimir imagem')); return }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    img.src = url
  })
}
