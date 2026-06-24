import { supabase } from '@/infrastructure/supabase/client'
import type { Database } from '@/infrastructure/supabase/database.types'

export type BirthPlan = Database['public']['Tables']['birth_plan']['Row']
export type BirthPlanInsert = Database['public']['Tables']['birth_plan']['Insert']

export const ANALGESIA_OPTIONS = [
  { value: 'sem_analgesia',  label: 'Sem analgesia — parto natural' },
  { value: 'epidural',       label: 'Epidural' },
  { value: 'raquidea',       label: 'Raquidiana' },
  { value: 'combinada',      label: 'Combinada (raqui + peridural)' },
  { value: 'decidir_hora',   label: 'Decidir na hora' },
]

export const PAIN_MANAGEMENT_OPTIONS = [
  'Massagem',
  'Bola de pilates',
  'Banheira / chuveiro',
  'Caminhada',
  'Musicoterapia',
  'Aromaterapia',
  'Respiração / meditação',
  'Compressas quentes',
]

export const BIRTH_POSITION_OPTIONS = [
  'Deitada (litotomia)',
  'Semi-sentada',
  'De cócoras',
  'Lateral (posição de Sims)',
  'De quatro apoios',
  'Em pé',
  'Na água',
]

export const CORD_OPTIONS = [
  { value: 'corte_imediato',    label: 'Corte imediato' },
  { value: 'corte_tardio',      label: 'Corte tardio (após parar de pulsar)' },
  { value: 'pai_corta',         label: 'Papai corta o cordão' },
  { value: 'acompanhante_corta', label: 'Acompanhante corta o cordão' },
]

export async function fetchBirthPlan(pregnancyId: string): Promise<BirthPlan | null> {
  const { data, error } = await supabase
    .from('birth_plan')
    .select('*')
    .eq('pregnancy_id', pregnancyId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertBirthPlan(payload: BirthPlanInsert): Promise<BirthPlan> {
  const { data, error } = await supabase
    .from('birth_plan')
    .upsert(payload, { onConflict: 'pregnancy_id' })
    .select()
    .single()
  if (error) throw error
  return data
}
