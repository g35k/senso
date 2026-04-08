import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/AuthPages.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  useEffect(() => {
    document.title = 'SENSO — Dashboard'
  }, [])

  async function handleLogout() {
    sessionStorage.removeItem('senso_student_bypass')
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-logo">
          senso
        </Link>
        <button type="button" className="auth-back auth-back-btn" onClick={handleLogout}>
          Log out
        </button>
      </nav>
      <main className="dashboard-shell">
        <h1>Dashboard</h1>
        <p>Placeholder dashboard page. This can later show user progress, current lessons, and recommendations.</p>

        <section className="dashboard-grid">
          <article className="dashboard-tile">
            <h3>Current lesson</h3>
            <p>Introduction to letters</p>
          </article>
          <article className="dashboard-tile">
            <h3>Streak</h3>
            <p>0 days (placeholder)</p>
          </article>
          <article className="dashboard-tile">
            <h3>Next action</h3>
            <p>Resume where you left off</p>
          </article>
        </section>
      </main>
    </div>
  )
}
