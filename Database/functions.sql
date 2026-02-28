-- ============================================================
-- FUNÇÃO: accept_proposal
-- Executa atomicamente:
--   1. Aceita a proposta seleccionada
--   2. Rejeita todas as outras propostas do mesmo projecto
--   3. Cria o contrato
--   4. Actualiza o status do projecto para 'in_progress'
--
-- Executa no Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION accept_proposal(
  p_proposal_id     UUID,
  p_project_id      UUID,
  p_professional_id UUID,
  p_client_id       UUID,
  p_valor           NUMERIC,
  p_comissao        NUMERIC
)
RETURNS UUID   -- retorna o ID do contrato criado
LANGUAGE plpgsql
SECURITY DEFINER  -- executa com permissões elevadas (contorna RLS para a transacção)
AS $$
DECLARE
  v_contract_id UUID;
BEGIN
  -- 1. Aceitar esta proposta
  UPDATE proposals
  SET status = 'accepted'
  WHERE id = p_proposal_id;

  -- 2. Rejeitar as restantes propostas deste projecto
  UPDATE proposals
  SET status = 'rejected'
  WHERE project_id = p_project_id
    AND id != p_proposal_id
    AND status = 'pending';

  -- 3. Criar contrato
  INSERT INTO contracts (
    project_id, proposal_id, client_id, professional_id,
    valor_total, comissao, status
  )
  VALUES (
    p_project_id, p_proposal_id, p_client_id, p_professional_id,
    p_valor, p_comissao, 'active'
  )
  RETURNING id INTO v_contract_id;

  -- 4. Actualizar projecto para 'in_progress'
  UPDATE projects
  SET status = 'in_progress'
  WHERE id = p_project_id;

  RETURN v_contract_id;

EXCEPTION WHEN OTHERS THEN
  RAISE;  -- propaga o erro para o cliente
END;
$$;

-- Permissão para utilizadores autenticados chamarem a função
GRANT EXECUTE ON FUNCTION accept_proposal TO authenticated;
