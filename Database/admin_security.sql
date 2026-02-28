-- ============================================================
-- ADMIN OFFICE — Políticas RLS e segurança
-- Executa no Supabase SQL Editor (depois do schema.sql)
-- ============================================================

-- ── Helper: verificar se o utilizador autenticado é admin ────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── Políticas adicionais para admin ver tudo ─────────────────

-- users: admin pode ler e actualizar qualquer utilizador
DROP POLICY IF EXISTS "admin_read_all_users"   ON public.users;
DROP POLICY IF EXISTS "admin_update_all_users" ON public.users;

CREATE POLICY "admin_read_all_users" ON public.users
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "admin_update_all_users" ON public.users
  FOR UPDATE USING (auth.uid() = id OR is_admin());

-- professional_profiles: admin pode ler e actualizar todos
DROP POLICY IF EXISTS "admin_read_all_profiles"   ON public.professional_profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.professional_profiles;

CREATE POLICY "admin_read_all_profiles" ON public.professional_profiles
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "admin_update_all_profiles" ON public.professional_profiles
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- projects: admin pode ler e actualizar todos
DROP POLICY IF EXISTS "admin_read_all_projects"   ON public.projects;
DROP POLICY IF EXISTS "admin_update_all_projects" ON public.projects;

CREATE POLICY "admin_read_all_projects" ON public.projects
  FOR SELECT USING (client_id = auth.uid() OR is_admin() OR status = 'open');

CREATE POLICY "admin_update_all_projects" ON public.projects
  FOR UPDATE USING (client_id = auth.uid() OR is_admin());

-- proposals: admin pode ler todas
DROP POLICY IF EXISTS "admin_read_all_proposals" ON public.proposals;

CREATE POLICY "admin_read_all_proposals" ON public.proposals
  FOR SELECT USING (
    professional_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid()) OR
    is_admin()
  );

-- contracts: admin pode ler todos
DROP POLICY IF EXISTS "admin_read_all_contracts"   ON public.contracts;
DROP POLICY IF EXISTS "admin_update_all_contracts" ON public.contracts;

CREATE POLICY "admin_read_all_contracts" ON public.contracts
  FOR SELECT USING (
    client_id = auth.uid() OR professional_id = auth.uid() OR is_admin()
  );

CREATE POLICY "admin_update_all_contracts" ON public.contracts
  FOR UPDATE USING (
    client_id = auth.uid() OR is_admin()
  );

-- payments: admin pode ler todos
DROP POLICY IF EXISTS "admin_read_all_payments" ON public.payments;

CREATE POLICY "admin_read_all_payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
    ) OR is_admin()
  );

-- notifications: admin pode ler e criar para qualquer utilizador
DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;

CREATE POLICY "admin_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

-- messages: admin pode ler todas para suporte
DROP POLICY IF EXISTS "admin_read_all_messages" ON public.messages;

CREATE POLICY "admin_read_all_messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_id
        AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
    ) OR is_admin()
  );

-- ── Criar conta admin ─────────────────────────────────────────
-- Executa DEPOIS de te registares normalmente:
--
--   UPDATE public.users
--   SET role = 'admin', status = 'active', verified_email = true
--   WHERE email = 'teu-email@exemplo.com';
--

-- ── Storage: admin pode ler qualquer documento ────────────────
DROP POLICY IF EXISTS "admin_read_all_documents" ON storage.objects;

CREATE POLICY "admin_read_all_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );

-- ── Índices de performance para queries do admin ─────────────
CREATE INDEX IF NOT EXISTS users_status_idx       ON public.users(status);
CREATE INDEX IF NOT EXISTS users_role_status_idx  ON public.users(role, status);
CREATE INDEX IF NOT EXISTS projects_status_idx    ON public.projects(status);
CREATE INDEX IF NOT EXISTS contracts_status_idx   ON public.contracts(status);
CREATE INDEX IF NOT EXISTS payments_status_idx    ON public.payments(status);
CREATE INDEX IF NOT EXISTS proposals_status_idx   ON public.proposals(status);

-- ── Função: estatísticas por intervalo de datas ───────────────
CREATE OR REPLACE FUNCTION admin_stats_range(p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  SELECT json_build_object(
    'new_users',    (SELECT COUNT(*) FROM public.users    WHERE created_at BETWEEN p_start AND p_end),
    'new_projects', (SELECT COUNT(*) FROM public.projects WHERE created_at BETWEEN p_start AND p_end),
    'new_contracts',(SELECT COUNT(*) FROM public.contracts WHERE created_at BETWEEN p_start AND p_end),
    'revenue',      (SELECT COALESCE(SUM(comissao),0) FROM public.payments WHERE status='released' AND created_at BETWEEN p_start AND p_end)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_stats_range TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin         TO authenticated;
