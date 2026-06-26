import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/infrastructure/supabase/client'
import type { Database } from '@/infrastructure/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }))
      if (session?.user) loadProfile(session.user.id)
      else setState(prev => ({ ...prev, loading: false }))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Set loading: true so guards wait for profile before making routing decisions
        setState(prev => ({ ...prev, session, user: session.user!, loading: true }))
        loadProfile(session.user.id)
      } else {
        setState(prev => ({ ...prev, session: null, user: null, profile: null, loading: false }))
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setState(prev => ({ ...prev, profile: data, loading: false }))
    } catch {
      setState(prev => ({ ...prev, profile: null, loading: false }))
    }
  }

  async function signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  async function signUp(email: string, password: string, fullName: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  async function refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadProfile(user.id)
  }

  return {
    ...state,
    isAuthenticated: !!state.user,
    isAdmin: state.profile?.role === 'platform_admin',
    isPartner: state.profile?.role === 'partner',
    isViewer: state.profile?.role === 'family_viewer',
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    refreshProfile,
  }
}
