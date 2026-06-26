// Re-export from the single-instance Context. All components share the same auth
// state and Supabase subscription — no independent hook instances causing race conditions.
export { useAuth, AuthProvider } from '@/shared/context/AuthContext'
