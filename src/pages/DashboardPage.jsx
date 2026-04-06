import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../components/AuthPages.css'

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'SENSO — Dashboard'
  }, [])

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-logo">
          senso
        </Link>
        <Link to="/login" className="auth-back">
          Log out
        </Link>
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
