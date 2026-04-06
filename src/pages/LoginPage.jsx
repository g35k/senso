import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../components/AuthPages.css'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'SENSO — Log In'
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/lessons')
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
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">
              Email
              <input id="login-email" type="email" placeholder="name@email.com" required />
            </label>
            <label htmlFor="login-password">
              Password
              <input id="login-password" type="password" placeholder="Password" required />
            </label>
            <button type="submit" className="auth-btn">
              Log In
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
