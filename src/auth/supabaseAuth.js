import { getSupabaseClient } from '../lib/supabaseClient.js'

function notConfiguredResult() {
  const message =
    'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  return { data: null, error: { message } }
}

function browserOrigin() {
  return typeof window !== 'undefined' ? window.location.origin : ''
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function signInWithPassword(email, password) {
  const supabase = getSupabaseClient()
  if (!supabase) return notConfiguredResult()
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Load public.profiles row for the signed-in user (RLS: own row only).
 * @param {string} userId
 */
export async function fetchProfile(userId) {
  const supabase = getSupabaseClient()
  if (!supabase) return notConfiguredResult()
  return supabase
    .from('profiles')
    .select('user_id, email, role')
    .eq('user_id', userId)
    .maybeSingle()
}

/**
 * @param {{ email: string, password: string, fullName?: string, role: 'student' | 'teacher' }} params
 */
export async function signUp({ email, password, fullName, role }) {
  const supabase = getSupabaseClient()
  if (!supabase) return notConfiguredResult()
  const redirectTo =
    import.meta.env.VITE_SUPABASE_EMAIL_REDIRECT_TO || `${browserOrigin()}/login`
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        ...(fullName ? { full_name: fullName } : {}),
      },
      emailRedirectTo: redirectTo,
    },
  })
}

/**
 * Sends password reset email (configure redirect URL in Supabase dashboard + optional env).
 * @param {string} email
 */
export async function resetPasswordForEmail(email) {
  const supabase = getSupabaseClient()
  if (!supabase) return notConfiguredResult()
  const redirectTo =
    import.meta.env.VITE_SUPABASE_PASSWORD_RESET_REDIRECT_TO ||
    `${browserOrigin()}/login`
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function signOut() {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}

export { isSupabaseConfigured } from '../lib/supabaseClient.js'
