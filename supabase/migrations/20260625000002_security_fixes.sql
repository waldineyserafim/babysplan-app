-- =============================================================
-- Security fixes
-- =============================================================

-- FIX 1: Missing INSERT policy on tenants
-- Without this, any call to supabase.from('tenants').insert(...)
-- from the client (RegisterPage, OnboardingPage) fails with RLS violation.
-- Safe to allow any authenticated user: the UUID is auto-generated and
-- subsequent data access is still scoped by auth_tenant_id().
CREATE POLICY "tenant_insert_authenticated" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (true);

-- FIX 2: Harden invitations read policy
-- The previous "authenticated_read" (USING true) allowed any logged-in user
-- to enumerate ALL pending invitation codes — a privacy and security risk.
-- New policy: you can only read invitations if:
--   a) You sent the invitation (inviter)
--   b) Your profile is in the same tenant (existing partner)
--   c) You have no tenant yet (new user reading a code to join)
DROP POLICY IF EXISTS "authenticated_read" ON invitations;

CREATE POLICY "invitations_read_restricted" ON invitations
  FOR SELECT TO authenticated USING (
    inviter_id = auth.uid()
    OR tenant_id = auth_tenant_id()
    OR auth_tenant_id() IS NULL
  );
