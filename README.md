# ConnectHub V2 — Plataforma de Freelancers

Marketplace de profissionais verificados para o mercado lusófono.
Stack: **React + Vite** (Netlify) · **Supabase** (BD, Auth, Storage, Realtime, Edge Functions) · **Stripe** (pagamentos).

---

## Setup rápido

### 1. Supabase — executa por esta ordem no SQL Editor

```
database/schema.sql          → tabelas, RLS base, triggers
database/storage.sql         → buckets (avatars, documents, portfolios)
database/functions.sql       → accept_proposal (transacção atómica)
database/notifications.sql   → tabela de notificações + triggers
database/admin_security.sql  → políticas RLS do admin + índices
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# preenche VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 3. Edge Functions

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF

supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FROM_EMAIL=noreply@connecthub.ao
supabase secrets set STRIPE_SECRET_KEY=sk_live_...

supabase functions deploy send-verification-email
supabase functions deploy create-payment-intent
supabase functions deploy release-escrow
```

### 4. Criar conta Admin

1. Regista-te normalmente em `/register`
2. No SQL Editor do Supabase executa:

```sql
UPDATE public.users
SET role = 'admin', status = 'active', verified_email = true
WHERE email = 'teu@email.com';
```

3. Acede ao painel em `/admin`

### 5. Deploy Netlify

```
Build command:  npm run build
Publish dir:    dist
Base dir:       frontend

Variáveis: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## Rotas do Admin Office

| Rota | Descrição |
|---|---|
| `/admin` | Login do administrador |
| `/admin/painel` | Dashboard com métricas e gráficos |
| `/admin/aprovacoes` | Fila de aprovação de profissionais |
| `/admin/utilizadores` | Lista completa + drawer de detalhe |
| `/admin/projectos` | Todos os projectos + cancelamento |
| `/admin/contratos` | Todos os contratos |
| `/admin/pagamentos` | Histórico financeiro + resumo |

---

## Segurança

| Mecanismo | Implementação |
|---|---|
| Autenticação admin | role = 'admin' na BD + função is_admin() no RLS |
| Row Level Security | Activo em todas as tabelas |
| Pagamentos | Stripe PCI-DSS, dados nunca passam no servidor |
| Escrow | Valor retido até confirmação do cliente |
| Notificações | Triggers PostgreSQL, independentes do frontend |
| URLs privadas | Signed URLs expiram em 1 hora |
