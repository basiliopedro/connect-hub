-- ============================================================
-- FASE 5 — Notificações + Realtime
-- Executa no Supabase SQL Editor
-- ============================================================

-- ── Tabela de notificações ────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo        TEXT        NOT NULL,
  -- tipos: 'new_proposal' | 'proposal_accepted' | 'proposal_rejected'
  --        'new_message' | 'contract_completed' | 'payment_released'
  --        'account_approved' | 'account_blocked'
  titulo      TEXT        NOT NULL,
  mensagem    TEXT        NOT NULL,
  lida        BOOLEAN     NOT NULL DEFAULT false,
  link        TEXT,        -- rota interna ex: '/contratos'
  meta        JSONB,       -- dados extra (contract_id, project_id, etc.)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_lida_idx    ON public.notifications(user_id, lida);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Função helper para criar notificação (chamada internamente)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id  UUID,
  p_tipo     TEXT,
  p_titulo   TEXT,
  p_mensagem TEXT,
  p_link     TEXT DEFAULT NULL,
  p_meta     JSONB DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link, meta)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_link, p_meta);
END;
$$;

-- ── Trigger: nova mensagem → notifica o destinatário ─────────
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contract  RECORD;
  v_sender    RECORD;
  v_recipient UUID;
BEGIN
  -- Obter contrato
  SELECT * INTO v_contract FROM public.contracts WHERE id = NEW.contract_id;

  -- Obter remetente
  SELECT nome, apelido INTO v_sender FROM public.users WHERE id = NEW.sender_id;

  -- Destinatário = a outra parte
  IF NEW.sender_id = v_contract.client_id THEN
    v_recipient := v_contract.professional_id;
  ELSE
    v_recipient := v_contract.client_id;
  END IF;

  -- Criar notificação
  PERFORM create_notification(
    v_recipient,
    'new_message',
    'Nova mensagem de ' || v_sender.nome,
    LEFT(NEW.conteudo, 80) || CASE WHEN LENGTH(NEW.conteudo) > 80 THEN '...' ELSE '' END,
    '/chat?contract=' || NEW.contract_id::text,
    jsonb_build_object('contract_id', NEW.contract_id, 'sender_id', NEW.sender_id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ── Trigger: proposta aceite → notifica profissional ─────────
CREATE OR REPLACE FUNCTION notify_proposal_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_project RECORD;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT titulo INTO v_project FROM public.projects WHERE id = NEW.project_id;

    PERFORM create_notification(
      NEW.professional_id,
      'proposal_accepted',
      '🎉 Proposta aceite!',
      'A tua proposta para "' || v_project.titulo || '" foi aceite. Vai aos contratos.',
      '/contratos',
      jsonb_build_object('project_id', NEW.project_id, 'proposal_id', NEW.id)
    );
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    SELECT titulo INTO v_project FROM public.projects WHERE id = NEW.project_id;

    PERFORM create_notification(
      NEW.professional_id,
      'proposal_rejected',
      'Proposta não seleccionada',
      'A tua proposta para "' || v_project.titulo || '" não foi seleccionada desta vez.',
      '/propostas',
      jsonb_build_object('project_id', NEW.project_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER proposals_notify
  AFTER UPDATE OF status ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION notify_proposal_accepted();

-- ── Trigger: nova proposta → notifica cliente ────────────────
CREATE OR REPLACE FUNCTION notify_new_proposal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_project   RECORD;
  v_pro_name  TEXT;
BEGIN
  SELECT p.titulo, p.client_id, u.nome || ' ' || u.apelido AS client_name
  INTO v_project
  FROM public.projects p JOIN public.users u ON u.id = p.client_id
  WHERE p.id = NEW.project_id;

  SELECT nome || ' ' || apelido INTO v_pro_name
  FROM public.users WHERE id = NEW.professional_id;

  PERFORM create_notification(
    v_project.client_id,
    'new_proposal',
    'Nova proposta recebida',
    v_pro_name || ' enviou uma proposta para "' || v_project.titulo || '".',
    '/projectos',
    jsonb_build_object('project_id', NEW.project_id, 'proposal_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER proposals_new_notify
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION notify_new_proposal();

-- ── Activar Realtime para mensagens e notificações ────────────
-- (messages já foi adicionado na Fase 2 — verifica se está activo)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
