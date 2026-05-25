import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/ProfilePage.css'
import '../components/TeacherDashboard.css'

export default function TeacherProfilePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  useEffect(() => {
    document.title = 'SENSO — Teacher Profile'
  }, [])

  async function handleLogout() {
    sessionStorage.removeItem('senso_student_bypass')
    sessionStorage.removeItem('senso_teacher_bypass')
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-page-root teacher-page-root">
      <div className="page-header">
        <div className="header-bg" />
        <div className="header-inner">
          <Link to="/dashboard" className="back-btn">
            ← Dashboard
          </Link>
          <div className="header-actions">
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            </button>
          </div>
          <div className="header-title">Profile</div>
          <div className="header-sub">Teacher account</div>
        </div>
      </div>

      <div className="profile-content">
        <section className="profile-card profile-hero">
          <div className="profile-avatar" aria-hidden="true">
            <i className="fa-solid fa-chalkboard-user" />
          </div>
          <div>
            <h2 className="profile-name">Teacher</h2>
            <p className="profile-meta">Placeholder profile — connect teacher account data later.</p>
          </div>
        </section>

        <section className="profile-card">
          <h3 className="profile-section-title">Classroom</h3>
          <p className="profile-placeholder">This is where class roster + assignments can go later.</p>
        </section>

        <section className="profile-card">
          <h3 className="profile-section-title">Settings</h3>
          <p className="profile-placeholder">Placeholder for teacher preferences and account settings.</p>
        </section>
      </div>
    </div>
  )
}

