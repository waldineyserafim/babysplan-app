import { supabase } from '@/infrastructure/supabase/client'
import type { Database } from '@/infrastructure/supabase/database.types'

export type LayetteCatalog = Database['public']['Tables']['layette_catalog']['Row']
export type LayetteUserItem = Database['public']['Tables']['layette_user_items']['Row']
export type LayetteUserItemInsert = Database['public']['Tables']['layette_user_items']['Insert']
export type LayetteUserItemUpdate = Database['public']['Tables']['layette_user_items']['Update']

export type LayetteItemWithCatalog = LayetteUserItem & { catalog: LayetteCatalog }

export const STATUS_CONFIG = {
  planned:   { label: 'Planejado',  color: '#f59e0b', bg: '#fef3c7' },
  purchased: { label: 'Comprado',   color: '#0ea5e9', bg: '#e0f2fe' },
  received:  { label: 'Recebido',   color: '#22c55e', bg: '#dcfce7' },
  gifted:    { label: 'Presenteado', color: '#a855f7', bg: '#f3e8ff' },
} as const

export const CATEGORY_LABELS: Record<string, string> = {
  roupas:        'Roupas',
  higiene:       'Higiene & Banho',
  alimentacao:   'Alimentação',
  transporte:    'Transporte',
  quarto:        'Quarto & Sono',
  seguranca:     'Segurança',
  brinquedos:    'Brinquedos',
  saude:         'Saúde',
  outros:        'Outros',
}

export async function fetchCatalog(): Promise<LayetteCatalog[]> {
  const { data, error } = await supabase
    .from('layette_catalog')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchUserItems(pregnancyId: string): Promise<LayetteItemWithCatalog[]> {
  const { data, error } = await supabase
    .from('layette_user_items')
    .select('*, catalog:layette_catalog(*)')
    .eq('pregnancy_id', pregnancyId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as LayetteItemWithCatalog[]
}

export async function addUserItem(payload: LayetteUserItemInsert): Promise<LayetteItemWithCatalog> {
  const { data, error } = await supabase
    .from('layette_user_items')
    .insert(payload)
    .select('*, catalog:layette_catalog(*)')
    .single()
  if (error) throw error
  return data as LayetteItemWithCatalog
}

export async function updateUserItem(id: string, fields: LayetteUserItemUpdate): Promise<LayetteItemWithCatalog> {
  const { data, error } = await supabase
    .from('layette_user_items')
    .update(fields)
    .eq('id', id)
    .select('*, catalog:layette_catalog(*)')
    .single()
  if (error) throw error
  return data as LayetteItemWithCatalog
}

export async function removeUserItem(id: string): Promise<void> {
  const { error } = await supabase.from('layette_user_items').delete().eq('id', id)
  if (error) throw error
}
