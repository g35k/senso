import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { exchangeSessionFromEmailRedirect, updatePassword } from '../auth/supabaseAuth.js'
import { getSupabaseClient } from '../lib/supabaseClient.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/AuthPages.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [linkError, setLinkError] = useState(null)
  const [linkReady, setLinkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.title = 'SENSO — Reset Password'
  }, [])

  useEffect(() => {
    let cancelled = false

    async function handleRecoveryLink() {
      const { error: pkceError, exchanged } = await exchangeSessionFromEmailRedirect()
      if (cancelled) return
      if (pkceError) {
        setLinkError(pkceError.message ?? 'This reset link is invalid or expired.')
        setLinkReady(true)
        return
      }
      if (exchanged) {
        window.history.replaceState(null, '', '/reset-password')
        navigate('/reset-password', { replace: true })
        setLinkReady(true)
        return
      }

      const rawHash = window.location.hash.replace(/^#/, '')
      if (rawHash && /(access_token|refresh_token)/.test(rawHash)) {
        const supabase = getSupabaseClient()
        if (!supabase) {
          setLinkError('Supabase is not configured.')
          setLinkReady(true)
          return
        }
        await supabase.auth.getSession()
        if (cancelled) return
        window.history.replaceState(null, '', '/reset-password')
        navigate('/reset-password', { replace: true })
      }
      setLinkReady(true)
    }

    void handleRecoveryLink()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (!linkReady || authLoading || done) return
    if (!user && !linkError) {
      setLinkError('Open the reset link from your email, or request a new one below.')
    }
  }, [linkReady, authLoading, user, linkError, done])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { error: updateErr } = await updatePassword(password)
      if (updateErr) {
        setError(updateErr.message ?? 'Could not update password.')
        return
      }
      setDone(true)
      await signOut()
    } finally {
      setLoading(false)
    }
  }

  const showForm = linkReady && !authLoading && user && !linkError

  return (
    <div className="auth-page braille-bg-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-logo">
          senso
        </Link>
        <Link to="/login" className="auth-back">
          Log in
        </Link>
      </nav>
      <main className="auth-main">
        <section className="auth-card">
          <h1>Reset password</h1>
          <p>Choose a new password for your account.</p>

          {linkError ? (
            <p className="auth-error" role="alert">
              {linkError}
            </p>
          ) : null}
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          {authLoading && !linkError ? (
            <p className="auth-hint">Verifying link…</p>
          ) : null}

          {showForm ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="reset-password">
                New password
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              <label htmlFor="reset-password-confirm">
                Confirm password
                <input
                  id="reset-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          ) : null}

          {!showForm && linkReady && !authLoading ? (
            <div className="auth-links">
              <Link to="/forgot-password" className="auth-link">
                Request new reset email
              </Link>
            </div>
          ) : null}
        </section>
      </main>

      {done ? (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-label="Password updated">
          <div className="auth-modal">
            <h2>Password updated</h2>
            <p>You can now sign in with your new password.</p>
            <button type="button" className="auth-btn" onClick={() => navigate('/login', { replace: true })}>
              Return to Log In
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
