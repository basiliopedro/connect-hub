import { z } from 'zod'

/**
 * Schemas de validação centralizados.
 * Usados nos formulários (react-hook-form + zod resolver)
 * e também no backend (Edge Functions).
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Password obrigatória'),
})

export const registerClienteSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome demasiado curto')
    .max(50, 'Nome demasiado longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome só pode conter letras'),
  apelido: z
    .string()
    .min(2, 'Apelido demasiado curto')
    .max(50, 'Apelido demasiado longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Apelido só pode conter letras'),
  email: z
    .string()
    .min(1, 'Email obrigatório')
    .email('Email inválido')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um símbolo'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword'],
})

export const registerProfissionalStep1Schema = z.object({
  nome: z
    .string()
    .min(2, 'Nome demasiado curto')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Só letras'),
  apelido: z
    .string()
    .min(2, 'Apelido demasiado curto')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Só letras'),
  email: z.string().email('Email inválido').toLowerCase(),
  idade: z
    .number({ invalid_type_error: 'Idade obrigatória' })
    .min(18, 'Tens de ter pelo menos 18 anos')
    .max(80, 'Idade inválida'),
  localizacao: z.string().min(3, 'Localização obrigatória'),
  area: z.string().min(1, 'Área profissional obrigatória'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter maiúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter símbolo'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword'],
})

export const registerProfissionalStep2Schema = z.object({
  descricao: z
    .string()
    .min(100, 'Descrição demasiado curta — escreve pelo menos 100 caracteres')
    .max(2000, 'Descrição demasiado longa'),
  tarifaHora: z
    .number({ invalid_type_error: 'Tarifa obrigatória' })
    .min(5, 'Tarifa mínima é $5/hora')
    .max(999, 'Tarifa muito elevada'),
  portfolioUrls: z.string().optional(), // separados por nova linha
})

export const verificationCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'O código tem 6 dígitos')
    .regex(/^\d{6}$/, 'Só dígitos'),
})

export const projectSchema = z.object({
  titulo: z
    .string()
    .min(10, 'Título demasiado curto')
    .max(200, 'Título demasiado longo'),
  descricao: z
    .string()
    .min(30, 'Descrição demasiado curta')
    .max(5000, 'Descrição demasiado longa'),
  orcamento: z
    .number({ invalid_type_error: 'Orçamento obrigatório' })
    .min(10, 'Orçamento mínimo é $10'),
  categoria: z.string().min(1, 'Categoria obrigatória'),
  prazo: z.string().min(1, 'Prazo obrigatório'),
})

// Helper para mostrar força da password
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Fraca', color: 'bg-red-500' },
    { score: 2, label: 'Razoável', color: 'bg-amber-500' },
    { score: 3, label: 'Boa', color: 'bg-blue-500' },
    { score: 4, label: 'Forte', color: 'bg-emerald-500' },
  ]

  return levels[score]
}
