import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../components/LessonsPage.css'

function getCompleted() {
  try {
    return JSON.parse(sessionStorage.getItem('completed') || '[]')
  } catch {
    return []
  }
}

export default function LessonsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [open, setOpen] = useState({})
  const completed = getCompleted()

  useEffect(() => {
    document.title = 'SENSO — Lessons'
  }, [])

  const total = 16
  const progressPct = Math.round((completed.length / total) * 100)

  function toggle(id) {
    setOpen((o) => ({ ...o, [id]: !o[id] }))
  }

  function goLesson(chapter, lesson) {
    navigate(`/lesson?chapter=${chapter}&lesson=${lesson}`)
  }

  function isCompleted(lessonId) {
    return completed.includes(lessonId)
  }

  return (
    <div className="lessons-page-root">
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
              onClick={() => navigate('/profile')}
              aria-label="Profile"
              title="Profile"
            >
              <i className="fa-solid fa-user" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="logout-btn"
              onClick={async () => {
                sessionStorage.removeItem('senso_student_bypass')
                await signOut()
                navigate('/login', { replace: true })
              }}
              aria-label="Log out"
              title="Log out"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            </button>
          </div>
          <div className="header-title">Lessons</div>
          <div className="header-sub">Choose a lesson to begin</div>
        </div>
      </div>

      <div style={{ background: 'white' }}>
        <div className="progress-wrap">
          <span className="progress-label">Progress</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress-pct">{progressPct}%</span>
        </div>
      </div>

      <div className="content">
        <div className={`chapter ${open['ch-intro'] ? 'open' : ''}`} id="ch-intro">
          <div className="chapter-header" onClick={() => toggle('ch-intro')} role="presentation">
            <div className="chapter-left">
              <div className="chapter-icon" style={{ background: '#fff0eb' }}>
                <i className="fa-solid fa-power-off" />
              </div>
              <div>
                <div className="chapter-title">Introduction: Getting Started</div>
                <div className="chapter-count">2 lessons</div>
              </div>
            </div>
            <div className="chapter-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
          <div className="lessons-list">
            <div
              className={`lesson-row ${isCompleted('intro-1') ? 'completed' : ''}`}
              onClick={() => goLesson('intro', 'intro-1')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 1: Introduction to your SENSO device</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('intro-2') ? 'completed' : ''}`}
              onClick={() => goLesson('intro', 'intro-2')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 2: Number labeling of 6-cell grid</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`chapter ${open['ch-1'] ? 'open' : ''}`} id="ch-1">
          <div className="chapter-header" onClick={() => toggle('ch-1')} role="presentation">
            <div className="chapter-left">
              <div className="chapter-icon" style={{ background: '#eaf0ff' }}>
                <i className="fa-solid fa-braille" />
              </div>
              <div>
                <div className="chapter-title">Chapter 1: The Alphabet and Numbers</div>
                <div className="chapter-count">7 lessons</div>
              </div>
            </div>
            <div className="chapter-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
          <div className="lessons-list">
            <div className="section-label">The Alphabet</div>
            <div
              className={`lesson-row ${isCompleted('ch1-1') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-1')}
              role="presentation"
            >
              <div className="lesson-dot" />
              <div className="lesson-text">
                <div className="lesson-name">Lesson 1: The Alphabet - Letters A–J</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch1-2') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-2')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 2: The Alphabet - Letters K–T</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch1-3') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-3')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 3: The Alphabet - Letters U–Z</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch1-4') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-4')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 4: The Whole Alphabet!</div>
                <div className="lesson-type practice">Practice</div>
              </div>
            </div>
            <div className="section-label">Numbers</div>
            <div
              className={`lesson-row ${isCompleted('ch1-5') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-5')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 5: Numbers 0–4</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch1-5') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-5')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 6: Numbers 5-9</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch1-6') ? 'completed' : ''}`}
              onClick={() => goLesson('ch1', 'ch1-6')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 7: All the Numbers! 0–9</div>
                <div className="lesson-type practice">Practice</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`chapter ${open['ch-2'] ? 'open' : ''}`} id="ch-2">
          <div className="chapter-header" onClick={() => toggle('ch-2')} role="presentation">
            <div className="chapter-left">
              <div className="chapter-icon" style={{ background: '#e8f7ef' }}>
                <i className="fa-solid fa-braille" />
              </div>
              <div>
                <div className="chapter-title">Chapter 2: Grade 2 Braille</div>
                <div className="chapter-count">8 lessons</div>
              </div>
            </div>
            <div className="chapter-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
          </div>
          <div className="lessons-list">
            <div className="section-label">One-cell Whole Word Contractions</div>
            <div
              className={`lesson-row ${isCompleted('ch2-1') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-1')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 1: Words - but, can, do, every, from</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch2-2') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-2')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 2: Words - go, have, just, knowledge, like</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch2-3') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-3')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 3: Words - more, not, people, quite, rather</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch2-4') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-4')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 4: One-cell Whole word contractions</div>
                <div className="lesson-type practice">Practice</div>
              </div>
            </div>
            <div className="section-label">Strong Contraction Words</div>
            <div
              className={`lesson-row ${isCompleted('ch2-5') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-5')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 5: Words - and, for, of, the, with</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch2-6') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-6')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 6: Strong Contraction Words</div>
                <div className="lesson-type practice">Practice</div>
              </div>
            </div>
            <div className="section-label">Review</div>
            <div
              className={`lesson-row ${isCompleted('ch2-7') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-7')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 7: Grade 2 Mixed Practice</div>
                <div className="lesson-type learn">Learn</div>
              </div>
            </div>
            <div
              className={`lesson-row ${isCompleted('ch2-8') ? 'completed' : ''}`}
              onClick={() => goLesson('ch2', 'ch2-8')}
              role="presentation"
            >
              <div className="lesson-dot">✓</div>
              <div className="lesson-text">
                <div className="lesson-name">Lesson 8: Final Review</div>
                <div className="lesson-type practice">Practice</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
