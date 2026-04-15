import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/LessonsPage.css'
import '../components/TeacherDashboard.css'
import { getDemoProgress, getDemoStudents } from '../lib/teacherDemoData.js'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const students = getDemoStudents()

  useEffect(() => {
    document.title = 'SENSO — Teacher Dashboard'
  }, [])

  async function handleLogout() {
    sessionStorage.removeItem('senso_student_bypass')
    sessionStorage.removeItem('senso_teacher_bypass')
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="lessons-page-root teacher-page-root">
      <div className="page-header">
        <div className="header-bg" />
        <div className="header-inner">
          <Link to="/" className="back-btn">
            ← Back
          </Link>
          <div className="header-actions">
            <button
              type="button"
              className="profile-btn"
              onClick={() => navigate('/teacher-profile')}
              aria-label="Profile"
              title="Profile"
            >
              <i className="fa-solid fa-user" aria-hidden="true" />
            </button>
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
          <div className="header-title">Dashboard</div>
          <div className="header-sub">Students</div>
        </div>
      </div>

      <div className="content">
        <section className="teacher-students" aria-label="Student list">
          <div className="teacher-student-list">
            {students.map((s) => {
              const p = getDemoProgress(s.id)
              const fullName = `${s.firstName} ${s.lastName}`.trim()
              return (
                <Link
                  key={s.id}
                  to={`/dashboard/students/${encodeURIComponent(s.id)}`}
                  className="teacher-student-card"
                >
                  <div className="teacher-student-row" role="group" aria-label={fullName}>
                    <div style={{ minWidth: 0 }}>
                      <div className="teacher-student-top">
                        <p className="teacher-student-name">{fullName}</p>
                        <span className="teacher-student-badge">{p.completionPct}%</span>
                      </div>
                      <div className="teacher-student-meta" aria-hidden="true">
                        <span>
                          Lessons: <strong>{p.lessonsCompleted}</strong>/{p.totalLessons}
                        </span>
                        <span>
                          Accuracy: <strong>{p.avgAccuracy}%</strong>
                        </span>
                        <span>
                          Streak: <strong>{p.streakDays}</strong>d
                        </span>
                        <span>
                          Active: <strong>{p.lastActiveLabel}</strong>
                        </span>
                      </div>
                    </div>
                    <span style={{ color: '#e8501a', fontWeight: 900 }} aria-hidden="true">
                      →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
