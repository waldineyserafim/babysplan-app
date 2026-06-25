import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/infrastructure/supabase/client'

// Maps Supabase table names to React Query keys that should be invalidated
const TABLE_TO_QUERY_KEYS: Record<string, string[][]> = {
  appointments:       [['appointments']],
  exams:              [['exams']],
  vaccines:           [['vaccines']],
  symptoms_log:       [['symptoms']],
  diary_entries:      [['diary']],
  photos:             [['photos']],
  kick_counts:        [['kicks']],
  contractions:       [['contractions']],
  layette_user_items: [['layette']],
  hospital_bag_items: [['hospital-bag']],
  timeline_milestones:[['timeline']],
  documents:          [['documents']],
  notifications:      [['notifications'], ['unread-notifications-count']],
  pregnancies:        [['pregnancy']],
}

/**
 * Subscribes to Supabase realtime changes on all major data tables.
 * When any change arrives, the corresponding React Query cache is invalidated
 * so both parents see updates without a manual refresh.
 *
 * Only active when a pregnancyId is provided (i.e., user has a pregnancy set up).
 */
export function useRealtimeSync(pregnancyId: string | undefined) {
  const qc = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!pregnancyId) return

    // Clean up any previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`realtime-sync-${pregnancyId}`)

    Object.entries(TABLE_TO_QUERY_KEYS).forEach(([table, queryKeys]) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `pregnancy_id=eq.${pregnancyId}`,
        },
        () => {
          queryKeys.forEach(key => {
            qc.invalidateQueries({ queryKey: key })
          })
        }
      )
    })

    // Also listen to profiles changes (for partner joining)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => {
        qc.invalidateQueries({ queryKey: ['tenant-partners'] })
      }
    )

    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [pregnancyId, qc])
}
