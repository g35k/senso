import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../components/AuthPages.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    document.title = 'SENSO — Forgot Password'
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setEmailSent(true)
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
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">
              Email
              <input id="forgot-email" type="email" placeholder="name@email.com" required />
            </label>
            <button type="submit" className="auth-btn">
              Send Email
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
