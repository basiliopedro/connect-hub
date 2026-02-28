import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { uploadService } from '@/services/uploadService'
import { useToast } from '@/components/ui/Toast'
import { Button, Card, Input, Textarea, Select, Avatar } from '@/components/ui'
import { Camera, Save, Loader2, ExternalLink, Plus, X } from 'lucide-react'
import { useForm } from 'react-hook-form'

const AREAS = [
  'Tecnologia & Desenvolvimento', 'Design & Criatividade', 'Marketing Digital',
  'Escrita & Conteúdo', 'Vídeo & Fotografia', 'Finanças & Contabilidade',
  'Direito & Jurídico', 'Ensino & Formação', 'Engenharia & Construção',
  'Saúde & Bem-estar', 'Outro',
]

export default function ProfilePage() {
  const { profile, refreshProfile, user } = useAuth()
  const { show }                          = useToast()
  const [proProfile, setProProfile]       = useState(null)
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setPreview]       = useState(null)
  const [portfolioLinks, setPortfolio]    = useState([''])
  const [saving, setSaving]               = useState(false)
  const [loading, setLoading]             = useState(true)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm()

  // Carregar dados actuais
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Perfil base
        reset({
          nome:      profile?.nome    ?? '',
          apelido:   profile?.apelido ?? '',
        })

        // Perfil profissional
        if (profile?.role === 'profissional') {
          const { data } = await supabase
            .from('professional_profiles')
            .select('*')
            .eq('user_id', profile.id)
            .single()

          if (data) {
            setProProfile(data)
            reset({
              nome:       profile.nome,
              apelido:    profile.apelido,
              area:       data.area,
              descricao:  data.descricao,
              tarifaHora: data.tarifa_hora,
              localizacao: data.localizacao,
            })
            setPortfolio(
              data.portfolio_urls?.length > 0
                ? data.portfolio_urls
                : ['']
            )
          }
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [profile, reset])

  // Preview do avatar
  useEffect(() => {
    if (!avatarFile) { setPreview(null); return }
    const url = URL.createObjectURL(avatarFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { show('Imagem muito grande. Máx 5MB.', 'error'); return }
    setAvatarFile(file)
  }

  const addPortfolioLink = () => setPortfolio(p => [...p, ''])
  const updateLink = (i, val) => setPortfolio(p => { const n = [...p]; n[i] = val; return n })
  const removeLink = (i) => setPortfolio(p => p.filter((_, idx) => idx !== i))

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      // 1. Upload de avatar se mudou
      let avatarUrl = profile?.avatar_url
      if (avatarFile) {
        avatarUrl = await uploadService.uploadAvatar(avatarFile)
      }

      // 2. Actualizar perfil base
      const { error: uErr } = await supabase
        .from('users')
        .update({
          nome:       data.nome,
          apelido:    data.apelido,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id)

      if (uErr) throw new Error(uErr.message)

      // 3. Actualizar perfil profissional
      if (profile.role === 'profissional') {
        const cleanLinks = portfolioLinks.filter(l => l.trim())

        const { error: pErr } = await supabase
          .from('professional_profiles')
          .update({
            area:           data.area,
            descricao:      data.descricao,
            tarifa_hora:    Number(data.tarifaHora),
            localizacao:    data.localizacao,
            portfolio_urls: cleanLinks,
          })
          .eq('user_id', profile.id)

        if (pErr) throw new Error(pErr.message)
      }

      await refreshProfile()
      setAvatarFile(null)
      show('✅ Perfil actualizado com sucesso!', 'success')
    } catch (err) {
      show(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-[var(--muted)]">
        <Loader2 size={18} className="animate-spin" /> A carregar...
      </div>
    )
  }

  const displayAvatar = avatarPreview ?? profile?.avatar_url

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-syne font-black text-2xl">Editar Perfil</h1>
        <p className="text-[var(--muted)] text-sm mt-0.5">
          As alterações ficam visíveis imediatamente após gravar
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* ── Foto de perfil ── */}
        <Card className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[var(--border)]">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent to-accent-2
                  flex items-center justify-center text-white font-syne font-black text-2xl">
                  {profile?.nome?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            {/* Overlay de edição */}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100
                transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera size={22} className="text-white" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h3 className="font-semibold text-base">{profile?.nome} {profile?.apelido}</h3>
            <p className="text-[var(--muted)] text-sm capitalize mb-3">{profile?.role}</p>
            <label htmlFor="avatar-upload">
              <Button type="button" variant="outline" size="sm" as="span">
                <Camera size={14} /> Alterar foto
              </Button>
            </label>
            <p className="text-xs text-[var(--muted)] mt-1.5">JPG, PNG ou WebP · Máx 5MB</p>
          </div>
        </Card>

        {/* ── Dados pessoais ── */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-syne font-bold text-base border-b border-[var(--border)] pb-3 mb-1">
            Informações pessoais
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome *"
              error={errors.nome?.message}
              {...register('nome', { required: 'Nome obrigatório' })}
            />
            <Input
              label="Apelido *"
              error={errors.apelido?.message}
              {...register('apelido', { required: 'Apelido obrigatório' })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted)]">Email</label>
            <div className="mt-1.5 px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]
              text-sm text-[var(--muted)]">
              {user?.email}
              <span className="ml-2 text-xs text-[var(--muted)] opacity-60">
                (alteração de email nas Definições)
              </span>
            </div>
          </div>
        </Card>

        {/* ── Campos exclusivos do profissional ── */}
        {profile?.role === 'profissional' && (
          <Card className="flex flex-col gap-4">
            <h3 className="font-syne font-bold text-base border-b border-[var(--border)] pb-3 mb-1">
              Perfil profissional
            </h3>

            <Select
              label="Área de actuação *"
              error={errors.area?.message}
              {...register('area', { required: 'Área obrigatória' })}
            >
              <option value="">Seleccionar...</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Localização *"
                placeholder="Luanda, Angola"
                error={errors.localizacao?.message}
                {...register('localizacao', { required: 'Localização obrigatória' })}
              />
              <Input
                label="Tarifa/hora (USD) *"
                type="number"
                placeholder="25"
                error={errors.tarifaHora?.message}
                {...register('tarifaHora', {
                  required: 'Tarifa obrigatória',
                  valueAsNumber: true,
                  min: { value: 5, message: 'Mínimo $5/h' },
                })}
              />
            </div>

            <Textarea
              label="Descrição profissional *"
              placeholder="Descreve a tua experiência, áreas de especialização e o que podes oferecer..."
              className="min-h-[140px]"
              hint="Mínimo 100 caracteres"
              error={errors.descricao?.message}
              {...register('descricao', {
                required: 'Descrição obrigatória',
                minLength: { value: 100, message: 'Mínimo 100 caracteres' },
              })}
            />

            {/* Links do portfólio */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-[var(--muted)]">
                Links do portfólio
              </label>
              {portfolioLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl
                    bg-[var(--surface2)] border border-[var(--border2)]
                    focus-within:border-accent transition-colors">
                    <ExternalLink size={14} className="text-[var(--muted)] flex-shrink-0" />
                    <input
                      type="url"
                      value={link}
                      onChange={e => updateLink(i, e.target.value)}
                      placeholder="https://github.com/o-teu-perfil"
                      className="flex-1 bg-transparent outline-none text-sm text-[var(--text)]
                        placeholder:text-[var(--muted)]"
                    />
                  </div>
                  {portfolioLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="p-2.5 rounded-xl text-[var(--muted)] hover:text-red-400
                        hover:bg-red-500/10 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPortfolioLink}
                className="flex items-center gap-2 text-sm text-accent hover:text-accent/80
                  transition-colors self-start mt-1"
              >
                <Plus size={15} /> Adicionar link
              </button>
            </div>
          </Card>
        )}

        {/* ── Botão gravar ── */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={!isDirty && !avatarFile && !portfolioLinks.some(l => l)}
          >
            <Save size={15} /> Gravar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
