import { supabase } from '@/infrastructure/supabase/client'
import type { Database } from '@/infrastructure/supabase/database.types'

export type HospitalBagItem = Database['public']['Tables']['hospital_bag_items']['Row']
export type HospitalBagItemInsert = Database['public']['Tables']['hospital_bag_items']['Insert']

export const PERSONS = [
  { value: 'mae',          label: 'Mamãe',         emoji: '👩' },
  { value: 'bebe',         label: 'Bebê',           emoji: '👶' },
  { value: 'pai',          label: 'Papai',          emoji: '👨' },
  { value: 'acompanhante', label: 'Acompanhante',   emoji: '🤝' },
] as const

export const SUGGESTED_ITEMS: Record<string, string[]> = {
  mae: [
    'Documentos pessoais (RG, cartão do plano)',
    'Camisola / robe confortável',
    'Absorvente pós-parto',
    'Calcinha descartável',
    'Sutiã de amamentação',
    'Itens de higiene pessoal',
    'Escova de dentes e pasta',
    'Cremes e cuidados com a pele',
    'Snacks e bebidas',
    'Carregador de celular',
    'Fone de ouvido',
    'Travesseiro pessoal',
    'Meias antiderrapantes',
    'Chinelo',
    'Roupa confortável para saída',
  ],
  bebe: [
    'Bodies (pelo menos 5 peças)',
    'Macacão para saída da maternidade',
    'Meias (3 pares)',
    'Touca de recém-nascido',
    'Luvas para recém-nascido',
    'Cobertor / mantinha',
    'Fraldas RN (1 pacote)',
    'Lenços umedecidos',
    'Pomada para assaduras',
    'Cadeirinha do carro (instalada)',
  ],
  pai: [
    'Roupas para 2-3 dias',
    'Itens de higiene pessoal',
    'Carregador de celular',
    'Snacks e bebidas',
    'Câmera / carregador de câmera',
    'Dinheiro / cartão',
    'Almofada',
  ],
  acompanhante: [
    'Roupas para 1-2 dias',
    'Itens de higiene pessoal',
    'Carregador de celular',
    'Snacks',
    'Cobertor / almofada',
  ],
}

export async function fetchHospitalBagItems(pregnancyId: string): Promise<HospitalBagItem[]> {
  const { data, error } = await supabase
    .from('hospital_bag_items')
    .select('*')
    .eq('pregnancy_id', pregnancyId)
    .order('person')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createHospitalBagItem(payload: HospitalBagItemInsert): Promise<HospitalBagItem> {
  const { data, error } = await supabase
    .from('hospital_bag_items')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHospitalBagItem(id: string, fields: Partial<HospitalBagItemInsert>): Promise<HospitalBagItem> {
  const { data, error } = await supabase
    .from('hospital_bag_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteHospitalBagItem(id: string): Promise<void> {
  const { error } = await supabase.from('hospital_bag_items').delete().eq('id', id)
  if (error) throw error
}
