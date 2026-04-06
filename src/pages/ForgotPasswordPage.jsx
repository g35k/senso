import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resetPasswordForEmail } from '../auth/supabaseAuth.js'
import '../components/AuthPages.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'SENSO — Forgot Password'
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await resetPasswordForEmail(email.trim())
      if (authError) {
        setError(authError.message ?? 'Could not send reset email.')
        return
      }
      setEmailSent(true)
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
          <h1>Forgot Password</h1>
          <p>Enter your email and we will send reset instructions.</p>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">
              Email
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send Email'}
            </button>
          </form>
        </section>
      </main>

      {emailSent ? (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-label="Email sent confirmation">
          <div className="auth-modal">
            <h2>Email sent</h2>
            <p>Check your inbox for next steps to reset your password.</p>
            <button type="button" className="auth-btn" onClick={() => navigate('/login')}>
              Return to Log In
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
