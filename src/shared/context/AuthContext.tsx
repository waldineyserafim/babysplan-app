import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  isAdmin: boolean
  isPartner: boolean
  isViewer: boolean
  signInWithEmail: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>
  signInWithGoogle: () => ReturnType<typeof supabase.auth.signInWithOAuth>
  signUp: (email: string, password: string, fullName: string) => ReturnType<typeof supabase.auth.signUp>
  signOut: () => ReturnType<typeof supabase.auth.signOut>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as Profile | null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on subscription — no need for getSession().
    // Single subscription shared by all consumers via Context eliminates race conditions
    // caused by multiple independent useAuth() hook instances.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session, user: session.user!, loading: true }))
        fetchProfile(session.user.id).then(profile => {
          setState(prev => ({ ...prev, profile, loading: false }))
        })
      } else {
        setState({ user: null, session: null, profile: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function refreshProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const profile = await fetchProfile(user.id)
    setState(prev => ({ ...prev, profile }))
  }

  const value: AuthContextValue = {
    ...state,
    isAuthenticated: !!state.user,
    isAdmin: state.profile?.role === 'platform_admin',
    isPartner: state.profile?.role === 'partner',
    isViewer: state.profile?.role === 'family_viewer',
    signInWithEmail: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      }),
    signUp: (email, password, fullName) =>
      supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
