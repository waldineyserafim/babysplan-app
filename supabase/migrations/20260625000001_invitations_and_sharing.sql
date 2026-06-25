-- =============================================================
-- Sprint 9: Compartilhamento de gestação entre pais
-- Modelo: dois usuários compartilham o mesmo tenant_id
-- =============================================================

-- ── Tabela de convites ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inviter_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code  TEXT        UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  invited_name TEXT,                            -- nome opcional do convidado
  status       TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'cancelled')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  accepted_by  UUID        REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- O invitante gerencia seus convites
CREATE POLICY "inviter_manage_own" ON invitations
  FOR ALL USING (inviter_id = auth.uid());

-- Usuários autenticados podem ler qualquer convite (por código)
-- A segurança real está na função accept_invitation (SECURITY DEFINER)
CREATE POLICY "authenticated_read" ON invitations
  FOR SELECT TO authenticated USING (true);

-- ── Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;

-- ── Função: aceitar convite ───────────────────────────────────
-- Roda como SECURITY DEFINER para poder atualizar profiles de outros usuários
CREATE OR REPLACE FUNCTION accept_invitation(p_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite        invitations%ROWTYPE;
  v_old_tenant_id UUID;
  v_remaining     INT;
  v_family_name   TEXT;
BEGIN
  -- 1. Busca o convite válido
  SELECT * INTO v_invite
  FROM invitations
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite inválido ou expirado.'
    );
  END IF;

  -- 2. Impede que o invitante aceite o próprio convite
  IF v_invite.inviter_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Você não pode aceitar seu próprio convite.'
    );
  END IF;

  -- 3. Salva tenant atual do aceitante
  SELECT tenant_id INTO v_old_tenant_id
  FROM profiles
  WHERE id = auth.uid();

  -- 4. Obtém nome da família do invitante
  SELECT t.name INTO v_family_name
  FROM tenants t
  WHERE t.id = v_invite.tenant_id;

  -- 5. Atualiza o tenant_id do aceitante
  UPDATE profiles
  SET tenant_id = v_invite.tenant_id,
      role      = 'partner',
      updated_at = now()
  WHERE id = auth.uid();

  -- 6. Marca convite como aceito
  UPDATE invitations
  SET status      = 'accepted',
      accepted_by = auth.uid(),
      updated_at  = now()
  WHERE id = v_invite.id;

  -- 7. Remove o tenant antigo se não tiver mais usuários
  IF v_old_tenant_id IS NOT NULL
     AND v_old_tenant_id <> v_invite.tenant_id THEN

    SELECT COUNT(*) INTO v_remaining
    FROM profiles
    WHERE tenant_id = v_old_tenant_id;

    IF v_remaining = 0 THEN
      DELETE FROM tenants WHERE id = v_old_tenant_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success',     true,
    'tenant_id',   v_invite.tenant_id,
    'family_name', v_family_name
  );
END;
$$;

-- ── Função: cancelar convite ──────────────────────────────────
CREATE OR REPLACE FUNCTION cancel_invitation(p_invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invitations
  SET status = 'cancelled', updated_at = now()
  WHERE invite_code = p_invite_code
    AND inviter_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado.');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── Habilitar realtime nas tabelas principais ─────────────────
-- Garante que mudanças sejam transmitidas para todos os clientes do tenant
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE exams;
ALTER PUBLICATION supabase_realtime ADD TABLE vaccines;
ALTER PUBLICATION supabase_realtime ADD TABLE symptoms_log;
ALTER PUBLICATION supabase_realtime ADD TABLE diary_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE photos;
ALTER PUBLICATION supabase_realtime ADD TABLE kick_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE contractions;
ALTER PUBLICATION supabase_realtime ADD TABLE layette_user_items;
ALTER PUBLICATION supabase_realtime ADD TABLE hospital_bag_items;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE pregnancies;
