import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../components/AuthPages.css'

export default function CreateAccountPage() {
  const navigate = useNavigate()
  const [accountEmailSent, setAccountEmailSent] = useState(false)

  useEffect(() => {
    document.title = 'SENSO — Create Account'
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setAccountEmailSent(true)
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
          <p>Create your account placeholder.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="create-name">
              Full name
              <input id="create-name" type="text" placeholder="Your name" required />
            </label>
            <label htmlFor="create-email">
              Email
              <input id="create-email" type="email" placeholder="name@email.com" required />
            </label>
            <label htmlFor="create-password">
              Password
              <input id="create-password" type="password" placeholder="Create password" required />
            </label>
            <button type="submit" className="auth-btn">
              Create Account
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
