import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { useAuth } from '@/shared/hooks/useAuth'
import {
  fetchHospitalBagItems,
  createHospitalBagItem,
  updateHospitalBagItem,
  deleteHospitalBagItem,
} from '../services/hospitalBagService'
import type { HospitalBagItemInsert } from '../services/hospitalBagService'

export function useHospitalBag() {
  const { profile } = useAuth()
  const { data: pregnancy } = useCurrentPregnancy()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['hospital-bag', pregnancy?.id],
    enabled: !!pregnancy?.id,
    queryFn: () => fetchHospitalBagItems(pregnancy!.id),
  })

  const create = useMutation({
    mutationFn: (fields: Omit<HospitalBagItemInsert, 'pregnancy_id' | 'tenant_id'>) => {
      if (!pregnancy?.id || !profile?.tenant_id) throw new Error('No pregnancy')
      return createHospitalBagItem({ ...fields, pregnancy_id: pregnancy.id, tenant_id: profile.tenant_id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bag'] }),
  })

  const bulkCreate = useMutation({
    mutationFn: async (items: Omit<HospitalBagItemInsert, 'pregnancy_id' | 'tenant_id'>[]) => {
      if (!pregnancy?.id || !profile?.tenant_id) throw new Error('No pregnancy')
      const payloads = items.map(f => ({ ...f, pregnancy_id: pregnancy.id, tenant_id: profile.tenant_id! }))
      for (const payload of payloads) {
        await createHospitalBagItem(payload)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bag'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Partial<HospitalBagItemInsert> }) =>
      updateHospitalBagItem(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bag'] }),
  })

  const remove = useMutation({
    mutationFn: deleteHospitalBagItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital-bag'] }),
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    create,
    bulkCreate,
    update,
    remove,
  }
}
