-- ============================================================
-- CONNECTHUB — Schema completo para Supabase (PostgreSQL)
-- Executa no Supabase SQL Editor pela ordem apresentada
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABELA: users (perfil estendido do Supabase Auth)
-- ============================================================
CREATE TABLE public.users (
  id              UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            VARCHAR(100)  NOT NULL,
  apelido         VARCHAR(100)  NOT NULL,
  role            TEXT          NOT NULL DEFAULT 'cliente'
                                CHECK (role IN ('admin', 'cliente', 'profissional')),
  status          TEXT          NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'pending_approval', 'blocked')),
  verified_email  BOOLEAN       NOT NULL DEFAULT false,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELA: professional_profiles
-- ============================================================
CREATE TABLE public.professional_profiles (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area            VARCHAR(150)  NOT NULL,
  descricao       TEXT          NOT NULL,
  tarifa_hora     NUMERIC(10,2) NOT NULL CHECK (tarifa_hora >= 5),
  localizacao     VARCHAR(150)  NOT NULL,
  idade           SMALLINT      NOT NULL CHECK (idade >= 18 AND idade <= 80),
  cv_url          TEXT,
  portfolio_urls  TEXT[]        NOT NULL DEFAULT '{}',
  certificados    TEXT[]        NOT NULL DEFAULT '{}',
  aprovado_em     TIMESTAMPTZ,
  aprovado_por    UUID          REFERENCES public.users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);


-- ============================================================
-- TABELA: projects
-- ============================================================
CREATE TABLE public.projects (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID          NOT NULL REFERENCES public.users(id),
  titulo          VARCHAR(200)  NOT NULL,
  descricao       TEXT          NOT NULL,
  orcamento       NUMERIC(10,2) NOT NULL CHECK (orcamento >= 10),
  categoria       VARCHAR(100)  NOT NULL,
  prazo           VARCHAR(100),
  status          TEXT          NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELA: proposals
-- ============================================================
CREATE TABLE public.proposals (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID          NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  professional_id UUID          NOT NULL REFERENCES public.users(id),
  valor           NUMERIC(10,2) NOT NULL CHECK (valor >= 5),
  mensagem        TEXT          NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, professional_id)  -- uma proposta por profissional por projecto
);


-- ============================================================
-- TABELA: contracts
-- ============================================================
CREATE TABLE public.contracts (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID          NOT NULL REFERENCES public.projects(id),
  proposal_id     UUID          NOT NULL REFERENCES public.proposals(id),
  client_id       UUID          NOT NULL REFERENCES public.users(id),
  professional_id UUID          NOT NULL REFERENCES public.users(id),
  valor_total     NUMERIC(10,2) NOT NULL,
  comissao        NUMERIC(10,2) NOT NULL,  -- 10% da plataforma
  status          TEXT          NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELA: messages (chat)
-- ============================================================
CREATE TABLE public.messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID          NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  sender_id       UUID          NOT NULL REFERENCES public.users(id),
  conteudo        TEXT          NOT NULL,
  lida            BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice para performance do chat
CREATE INDEX messages_contract_id_idx ON public.messages(contract_id);
CREATE INDEX messages_created_at_idx  ON public.messages(created_at);


-- ============================================================
-- TABELA: payments
-- ============================================================
CREATE TABLE public.payments (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID          NOT NULL REFERENCES public.contracts(id),
  stripe_intent   TEXT          UNIQUE NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  comissao        NUMERIC(10,2) NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'held', 'released', 'refunded')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- TABELA: email_verifications
-- ============================================================
CREATE TABLE public.email_verifications (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  codigo          CHAR(6)       NOT NULL,
  expira_em       TIMESTAMPTZ   NOT NULL,
  usado           BOOLEAN       NOT NULL DEFAULT false,
  tentativas      SMALLINT      NOT NULL DEFAULT 0 CHECK (tentativas <= 5),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Função para incrementar tentativas falhadas
CREATE OR REPLACE FUNCTION increment_verification_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.email_verifications
  SET tentativas = tentativas + 1
  WHERE user_id = p_user_id AND usado = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Segurança ao nível da base de dados
-- ============================================================

-- Activar RLS em todas as tabelas
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications    ENABLE ROW LEVEL SECURITY;


-- ── USERS ────────────────────────────────────────────────────
-- Utilizador vê o seu próprio perfil
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admin vê todos
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Utilizador actualiza o seu próprio perfil
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Inserir apenas o próprio perfil (no registo)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ── PROFESSIONAL PROFILES ────────────────────────────────────
-- Perfis aprovados são visíveis a todos (feed público)
CREATE POLICY "pro_profiles_public_read" ON public.professional_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_id AND u.status = 'active'
    )
  );

-- Profissional gere o seu próprio perfil
CREATE POLICY "pro_profiles_own" ON public.professional_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Admin gere tudo
CREATE POLICY "pro_profiles_admin" ON public.professional_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- ── PROJECTS ─────────────────────────────────────────────────
-- Projectos abertos são públicos (feed)
CREATE POLICY "projects_public_read" ON public.projects
  FOR SELECT USING (status = 'open');

-- Cliente gere os seus projectos
CREATE POLICY "projects_client_own" ON public.projects
  FOR ALL USING (auth.uid() = client_id);

-- Profissional vê projectos em que está envolvido
CREATE POLICY "projects_professional_involved" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.project_id = id AND p.professional_id = auth.uid()
    )
  );

-- Admin vê tudo
CREATE POLICY "projects_admin" ON public.projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- ── PROPOSALS ────────────────────────────────────────────────
-- Cliente vê propostas dos seus projectos
CREATE POLICY "proposals_client_view" ON public.proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.client_id = auth.uid()
    )
  );

-- Profissional gere as suas propostas
CREATE POLICY "proposals_professional_own" ON public.proposals
  FOR ALL USING (auth.uid() = professional_id);

-- Admin vê tudo
CREATE POLICY "proposals_admin" ON public.proposals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- ── CONTRACTS ────────────────────────────────────────────────
-- Partes do contrato vêem o contrato
CREATE POLICY "contracts_parties" ON public.contracts
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = professional_id
  );

-- Admin vê tudo
CREATE POLICY "contracts_admin" ON public.contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- ── MESSAGES ─────────────────────────────────────────────────
-- Partes do contrato vêem e enviam mensagens
CREATE POLICY "messages_parties" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
        AND c.status = 'active'
    )
  );

-- Admin lê tudo
CREATE POLICY "messages_admin" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- ── PAYMENTS ─────────────────────────────────────────────────
-- Profissional e admin vêem pagamentos
CREATE POLICY "payments_professional" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.professional_id = auth.uid() OR c.client_id = auth.uid())
    )
  );

CREATE POLICY "payments_admin" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );


-- ── EMAIL VERIFICATIONS ───────────────────────────────────────
-- Utilizador vê apenas os seus próprios
CREATE POLICY "verifications_own" ON public.email_verifications
  FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- REALTIME — activar para o chat
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ============================================================
-- ADMIN INICIAL — cria o teu utilizador admin
-- Substitui o email pelo teu antes de executar
-- ============================================================
-- NOTA: Primeiro regista-te normalmente na aplicação,
-- depois executa este UPDATE para tornar-te admin:
--
-- UPDATE public.users
-- SET role = 'admin', status = 'active', verified_email = true
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'SEU_EMAIL@exemplo.com'
-- );
