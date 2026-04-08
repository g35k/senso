import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProfile, signInWithPassword } from '../auth/supabaseAuth.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/AuthPages.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'SENSO — Log In'
  }, [])

  useEffect(() => {
    if (authLoading || !user || !profile) return
    sessionStorage.removeItem('senso_student_bypass')
    navigate(profile.role === 'teacher' ? '/dashboard' : '/lessons', { replace: true })
  }, [authLoading, user, profile, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error: authError } = await signInWithPassword(email.trim(), password)
      if (authError) {
        setError(authError.message ?? 'Could not sign in.')
        return
      }
      const uid = data?.user?.id
      if (!uid) {
        setError('Signed in but no user id returned.')
        return
      }
      sessionStorage.removeItem('senso_student_bypass')
      const { data: prof, error: profileError } = await fetchProfile(uid)
      if (profileError) {
        setError(profileError.message ?? 'Could not load your profile.')
        return
      }
      if (!prof?.role) {
        setError('Profile not found. Ask an admin to finish account setup.')
        return
      }
      navigate(prof.role === 'teacher' ? '/dashboard' : '/lessons')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page login-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-logo">
          senso
        </Link>
        <Link to="/" className="auth-back">
          Back
        </Link>
      </nav>
      <main className="auth-main">
        <section className="auth-card">
          <h1>Log In</h1>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">
              Email
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label htmlFor="login-password">
              Password
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="auth-btn" disabled={loading || authLoading}>
              {loading ? 'Signing in…' : 'Log In'}
            </button>
          </form>
          <div className="auth-links">
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
            <Link to="/create-account" className="auth-link">
              Create Account
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
