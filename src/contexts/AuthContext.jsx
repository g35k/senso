import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient.js'
import { fetchProfile, signOut as authSignOut } from '../auth/supabaseAuth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(() => isSupabaseConfigured())

  const refreshProfile = useCallback(async (userId) => {
    if (!userId || !isSupabaseConfigured()) {
      setProfile(null)
      return
    }
    const { data, error } = await fetchProfile(userId)
    if (error) {
      console.warn('fetchProfile:', error.message ?? error)
      setProfile(null)
      return
    }
    setProfile(data ?? null)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return
    }

    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return
      setSession(s ?? null)
      setUser(s?.user ?? null)
      if (s?.user?.id) {
        refreshProfile(s.user.id).finally(() => {
          if (!cancelled) setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
      setUser(s?.user ?? null)
      if (s?.user?.id) {
        refreshProfile(s.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      refreshProfile,
      signOut,
    }),
    [session, user, profile, loading, refreshProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* eslint-disable react-refresh/only-export-components -- hook colocated with provider */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
