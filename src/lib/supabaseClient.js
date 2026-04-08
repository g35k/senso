import { createClient } from '@supabase/supabase-js'

/**
 * Vite exposes env vars prefixed with VITE_ to the client bundle.
 * Copy `.env.example` to `.env` and fill in your Supabase project values.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client = null

export function isSupabaseConfigured() {
  return Boolean(
    typeof url === 'string' &&
      url.length > 0 &&
      typeof anonKey === 'string' &&
      anonKey.length > 0,
  )
}

/**
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        // Parse #access_token / recovery fragments from email magic links
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
