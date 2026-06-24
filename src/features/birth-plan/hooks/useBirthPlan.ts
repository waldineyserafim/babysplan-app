import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { useAuth } from '@/shared/hooks/useAuth'
import { fetchBirthPlan, upsertBirthPlan } from '../services/birthPlanService'
import type { BirthPlanInsert } from '../services/birthPlanService'

export function useBirthPlan() {
  const { profile } = useAuth()
  const { data: pregnancy } = useCurrentPregnancy()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['birth-plan', pregnancy?.id],
    enabled: !!pregnancy?.id,
    queryFn: () => fetchBirthPlan(pregnancy!.id),
  })

  const save = useMutation({
    mutationFn: (fields: Omit<BirthPlanInsert, 'pregnancy_id' | 'tenant_id'>) => {
      if (!pregnancy?.id || !profile?.tenant_id) throw new Error('No pregnancy')
      return upsertBirthPlan({ ...fields, pregnancy_id: pregnancy.id, tenant_id: profile.tenant_id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['birth-plan'] }),
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    save,
  }
}
