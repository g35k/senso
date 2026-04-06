import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../components/ProfilePage.css'

export default function ProfilePage() {
  useEffect(() => {
    document.title = 'SENSO — Profile'
  }, [])

  return (
    <div className="profile-page-root">
      <div className="page-header">
        <div className="header-bg" />
        <div className="header-inner">
          <Link to="/lessons" className="back-btn">
            ← Lessons
          </Link>
          <div className="header-title">Profile</div>
          <div className="header-sub">Your learning snapshot</div>
        </div>
      </div>

      <div className="profile-content">
        <section className="profile-card profile-hero">
          <div className="profile-avatar" aria-hidden="true">
            <i className="fa-solid fa-user" />
          </div>
          <div>
            <h2 className="profile-name">Learner</h2>
            <p className="profile-meta">Placeholder profile — connect account data later.</p>
          </div>
        </section>

        <section className="profile-card">
          <h3 className="profile-section-title">Stats</h3>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">—</span>
              <span className="profile-stat-label">Lessons completed</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">—</span>
              <span className="profile-stat-label">Practice streak</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">—</span>
              <span className="profile-stat-label">Total practice time</span>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h3 className="profile-section-title">Recently finished</h3>
          <p className="profile-placeholder">No lesson data yet — placeholder for last completed lesson.</p>
        </section>

        <section className="profile-card">
          <h3 className="profile-section-title">Continue where you left off</h3>
          <p className="profile-placeholder">Placeholder for resume link or next recommended lesson.</p>
        </section>
      </div>
    </div>
  )
}
