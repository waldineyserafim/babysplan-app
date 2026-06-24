import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentPregnancy } from '@/shared/hooks/useCurrentPregnancy'
import { useAuth } from '@/shared/hooks/useAuth'
import {
  fetchCatalog,
  fetchUserItems,
  addUserItem,
  updateUserItem,
  removeUserItem,
} from '../services/layetteService'
import type { LayetteUserItemInsert, LayetteUserItemUpdate } from '../services/layetteService'

export function useLayette() {
  const { profile } = useAuth()
  const { data: pregnancy } = useCurrentPregnancy()
  const qc = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: ['layette-catalog'],
    queryFn: fetchCatalog,
    staleTime: 1000 * 60 * 60,
  })

  const itemsQuery = useQuery({
    queryKey: ['layette-items', pregnancy?.id],
    enabled: !!pregnancy?.id,
    queryFn: () => fetchUserItems(pregnancy!.id),
  })

  const add = useMutation({
    mutationFn: (fields: Omit<LayetteUserItemInsert, 'pregnancy_id' | 'tenant_id'>) => {
      if (!pregnancy?.id || !profile?.tenant_id) throw new Error('No pregnancy')
      return addUserItem({ ...fields, pregnancy_id: pregnancy.id, tenant_id: profile.tenant_id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['layette-items'] }),
  })

  const update = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: LayetteUserItemUpdate }) =>
      updateUserItem(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['layette-items'] }),
  })

  const remove = useMutation({
    mutationFn: removeUserItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['layette-items'] }),
  })

  return {
    catalog: catalogQuery.data ?? [],
    items: itemsQuery.data ?? [],
    isLoading: itemsQuery.isLoading || catalogQuery.isLoading,
    add,
    update,
    remove,
  }
}
