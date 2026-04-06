import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../auth/supabaseAuth.js'
import '../components/AuthPages.css'

export default function CreateAccountPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountEmailSent, setAccountEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'SENSO — Create Account'
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
      })
      if (authError) {
        setError(authError.message ?? 'Could not create account.')
        return
      }
      setAccountEmailSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page braille-bg-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-logo">
          senso
        </Link>
        <Link to="/login" className="auth-back">
          Back
        </Link>
      </nav>
      <main className="auth-main">
        <section className="auth-card">
          <h1>Create Account</h1>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="create-name">
              Full name
              <input
                id="create-name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
            <label htmlFor="create-email">
              Email
              <input
                id="create-email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label htmlFor="create-password">
              Password
              <input
                id="create-password"
                type="password"
                autoComplete="new-password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </section>
      </main>

      {accountEmailSent ? (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-label="Account verification email sent">
          <div className="auth-modal">
            <h2>Email sent</h2>
            <p>An email has been sent to your email. Please verify your account, then return to log in.</p>
            <button type="button" className="auth-btn" onClick={() => navigate('/login')}>
              Return to Log In
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
