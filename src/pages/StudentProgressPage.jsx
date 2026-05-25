import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/LessonsPage.css'
import '../components/TeacherDashboard.css'
import { lessonChapters } from '../data/lessonChapters.js'
import { getDemoLessonStat, getDemoProgress, getDemoStudent } from '../lib/teacherDemoData.js'

export default function StudentProgressPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const params = useParams()
  const studentId = params.studentId ? decodeURIComponent(params.studentId) : null

  const student = useMemo(() => (studentId ? getDemoStudent(studentId) : null), [studentId])
  const progress = useMemo(() => (studentId ? getDemoProgress(studentId) : null), [studentId])
  const allLessons = useMemo(() => {
    const out = []
    for (const key of ['intro', 'ch1', 'ch2']) {
      const ch = lessonChapters[key]
      if (ch?.lessons?.length) {
        out.push(...ch.lessons.map((l) => ({ ...l, chapterKey: key, chapterLabel: ch.label })))
      }
    }
    return out
  }, [])

  useEffect(() => {
    const label = student ? `${student.firstName} ${student.lastName}`.trim() : null
    document.title = label ? `SENSO — ${label}` : 'SENSO — Student progress'
  }, [student])

  async function handleLogout() {
    sessionStorage.removeItem('senso_student_bypass')
    sessionStorage.removeItem('senso_teacher_bypass')
    await signOut()
    navigate('/login', { replace: true })
  }

  if (!student || !progress) {
    return (
      <div className="lessons-page-root teacher-page-root">
        <div className="page-header">
          <div className="header-bg" />
          <div className="header-inner">
            <Link to="/dashboard" className="back-btn">
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
            <div className="header-title">Progress</div>
            <div className="header-sub">Student not found</div>
          </div>
        </div>
        <div className="content">
          <h2 style={{ marginBottom: 8 }}>Student not found</h2>
          <p className="senso-muted">This student link is invalid.</p>
        </div>
      </div>
    )
  }

  const fullName = `${student.firstName} ${student.lastName}`.trim()

  const currentLessonIndex =
    progress.lessonsCompleted < allLessons.length ? progress.lessonsCompleted : null

  function lessonStatusByIndex(idx) {
    if (idx < progress.lessonsCompleted) return 'completed'
    if (currentLessonIndex != null && idx === currentLessonIndex) return 'in_progress'
    return 'not_started'
  }

  return (
    <div className="lessons-page-root teacher-page-root">
      <div className="page-header">
        <div className="header-bg" />
        <div className="header-inner">
          <Link to="/dashboard" className="back-btn">
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
          <div className="header-title">Progress</div>
          <div className="header-sub">{fullName}</div>
        </div>
      </div>

      <div className="content" style={{ maxWidth: 1100 }}>
        <section aria-label="Student progress">
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1.5px solid rgba(0,0,0,0.12)',
              padding: 16,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 900, marginBottom: 6 }}>{fullName}</p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'rgba(232, 80, 26, 0.12)',
                  color: '#b13a11',
                  whiteSpace: 'nowrap',
                }}
              >
                {progress.completionPct}%
              </span>
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 10,
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: 12,
                  background: '#fff8f5',
                }}
              >
                <p style={{ margin: 0, fontWeight: 900 }}>Completion</p>
                <p style={{ margin: '6px 0 0', color: '#5d5a52' }}>
                  <strong style={{ color: '#1a1a1a' }}>
                    {progress.lessonsCompleted}/{progress.totalLessons}
                  </strong>{' '}
                  lessons
                </p>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: 12,
                  background: '#fff8f5',
                }}
              >
                <p style={{ margin: 0, fontWeight: 900 }}>Avg accuracy</p>
                <p style={{ margin: '6px 0 0', color: '#5d5a52' }}>
                  <strong style={{ color: '#1a1a1a' }}>{progress.avgAccuracy}%</strong>
                </p>
              </div>
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  padding: 12,
                  background: '#fff8f5',
                }}
              >
                <p style={{ margin: 0, fontWeight: 900 }}>Last active</p>
                <p style={{ margin: '6px 0 0', color: '#5d5a52' }}>
                  <strong style={{ color: '#1a1a1a' }}>{progress.lastActiveLabel}</strong>
                </p>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h2 style={{ marginBottom: 12 }}>Lessons</h2>

              {['intro', 'ch1', 'ch2'].map((chapterKey) => {
                const chapter = lessonChapters[chapterKey]
                if (!chapter) return null

                return (
                  <div key={chapterKey} className="chapter open" id={`teacher-${chapterKey}`}>
                    <div className="chapter-header" role="presentation">
                      <div className="chapter-left">
                        <div
                          className="chapter-icon"
                          style={{
                            background:
                              chapterKey === 'intro'
                                ? '#fff0eb'
                                : chapterKey === 'ch1'
                                  ? '#eaf0ff'
                                  : '#e8f7ef',
                          }}
                        >
                          <i className="fa-solid fa-braille" />
                        </div>
                        <div>
                          <div className="chapter-title">{chapter.label}</div>
                          <div className="chapter-count">{chapter.lessons.length} lessons</div>
                        </div>
                      </div>
                    </div>

                    <div className="lessons-list" style={{ maxHeight: 'none' }}>
                      {chapter.lessons.map((l) => {
                        const idx = allLessons.findIndex((x) => x.id === l.id)
                        const status = lessonStatusByIndex(idx === -1 ? 9999 : idx)
                        const stat = getDemoLessonStat(studentId, l.id, status)

                        const statusLabel =
                          status === 'completed'
                            ? 'Completed'
                            : status === 'in_progress'
                              ? 'In progress'
                              : 'Not started'

                        const statusDot = status === 'completed' ? '✓' : status === 'in_progress' ? '•' : ''

                        const displayAcc = stat.bestAccuracy == null ? '—' : `${stat.bestAccuracy}%`
                        const barPct = stat.bestAccuracy == null ? 0 : stat.bestAccuracy

                        return (
                          <div key={l.id}>
                            <div className={`lesson-row ${status === 'completed' ? 'completed' : ''}`} role="presentation">
                              <div className="lesson-dot">{statusDot}</div>
                              <div className="lesson-text">
                                <div className="lesson-name">
                                  {l.num}: {l.title}
                                </div>
                                <div className="lesson-type learn">
                                  {statusLabel} · Best: {displayAcc}
                                </div>
                              </div>
                            </div>

                            <div className="teacher-lesson-details" role="region" aria-label={`Lesson details: ${l.title}`}>
                              <div className="row">
                                <span className="teacher-lesson-status">{statusLabel}</span>
                                <span className="metric">
                                  Best accuracy: <strong>{displayAcc}</strong>
                                </span>
                                <span className="metric">
                                  Attempts: <strong>{stat.attempts}</strong>
                                </span>
                                <span className="metric">
                                  Correct: <strong>{stat.correct}</strong>
                                </span>
                                <span className="metric">
                                  Last practiced: <strong>{stat.lastPracticedLabel}</strong>
                                </span>
                              </div>
                              <div className="teacher-lesson-bar" aria-label="Accuracy bar">
                                <div style={{ width: `${barPct}%` }} />
                              </div>
                              <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.5 }}>{l.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

