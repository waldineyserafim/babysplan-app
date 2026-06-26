import { supabase } from '@/infrastructure/supabase/client'

// invitations table not yet in generated types — cast to any
const db = supabase as any

export interface Invitation {
  id: string
  tenant_id: string
  inviter_id: string
  invite_code: string
  invited_name: string | null
  status: 'pending' | 'accepted' | 'cancelled'
  expires_at: string
  accepted_by: string | null
  created_at: string
  updated_at: string | null
}

export async function createInvitation(tenantId: string, inviterId: string, invitedName?: string): Promise<Invitation> {
  const { data, error } = await db
    .from('invitations')
    .insert({
      tenant_id: tenantId,
      inviter_id: inviterId,
      invited_name: invitedName ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Invitation
}

export async function fetchActiveInvitations(tenantId: string): Promise<Invitation[]> {
  const { data, error } = await db
    .from('invitations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Invitation[]
}

export async function fetchInvitationByCode(code: string): Promise<Invitation | null> {
  const { data } = await db
    .from('invitations')
    .select('*')
    .eq('invite_code', code)
    .single()
  return (data ?? null) as Invitation | null
}

export async function cancelInvitation(code: string) {
  const { data, error } = await db.rpc('cancel_invitation', { p_invite_code: code })
  if (error) throw error
  return data as { success: boolean; error?: string }
}

export async function acceptInvitation(code: string) {
  const { data, error } = await db.rpc('accept_invitation', { p_invite_code: code })
  if (error) throw error
  return data as { success: boolean; tenant_id?: string; family_name?: string; error?: string }
}

export async function fetchTenantPartners(tenantId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, created_at')
    .eq('tenant_id', tenantId)
  if (error) throw error
  return data ?? []
}

export async function fetchTenantInfo(tenantId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function updatePregnancy(
  pregnancyId: string,
  fields: { baby_name?: string; baby_sex?: string; lmp_date?: string; due_date?: string }
) {
  const { data, error } = await supabase
    .from('pregnancies')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', pregnancyId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, fields: { full_name?: string; nickname?: string; phone?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
