import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { lessonChapters } from '../data/lessonChapters.js'
import '../components/LessonDetailPage.css'

const circumference = 289

function getCompleted() {
  try {
    return JSON.parse(sessionStorage.getItem('completed') || '[]')
  } catch {
    return []
  }
}

function saveCompleted(arr) {
  sessionStorage.setItem('completed', JSON.stringify(arr))
}

function setArc(el, pct) {
  if (!el) return
  const offset = circumference - (pct / 100) * circumference
  el.setAttribute('stroke-dashoffset', String(offset))
}

export default function LessonDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const chapterId = searchParams.get('chapter') || 'ch1'
  const lessonId = searchParams.get('lesson') || 'ch1-1'

  const chapter = lessonChapters[chapterId] ?? lessonChapters.ch1
  const lesson = chapter.lessons.find((l) => l.id === lessonId) ?? chapter.lessons[0]

  const [statsTick, setStatsTick] = useState(0)
  const completedList = getCompleted()
  const completionArcRef = useRef(null)
  const accuracyArcRef = useRef(null)

  useEffect(() => {
    document.title = 'SENSO — ' + lesson.title
  }, [lesson.title])

  useEffect(() => {
    const ch = lessonChapters[chapterId] ?? lessonChapters.ch1
    const completed = getCompleted()
    const chLessons = ch.lessons.map((l) => l.id)
    const donePct = Math.round(
      (chLessons.filter((id) => completed.includes(id)).length / chLessons.length) * 100,
    )
    const t1 = setTimeout(() => setArc(completionArcRef.current, donePct), 100)

    const seed = lesson.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    let t2
    if (completed.includes(lesson.id)) {
      const acc = 60 + (seed % 36)
      t2 = setTimeout(() => setArc(accuracyArcRef.current, acc), 200)
    } else {
      setArc(accuracyArcRef.current, 0)
    }

    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
  }, [chapterId, lesson.id, statsTick])

  const alreadyDone = completedList.includes(lesson.id)
  const accuracyDisplay = alreadyDone
    ? `${60 + (lesson.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 36)}%`
    : '—'

  function markCurrentDone() {
    const completed = getCompleted()
    if (!completed.includes(lesson.id)) {
      completed.push(lesson.id)
      saveCompleted(completed)
    }
    setStatsTick((n) => n + 1)
  }

  function goLesson(id) {
    navigate(`/lesson?chapter=${chapterId}&lesson=${id}`)
  }

  return (
    <div className="lesson-detail-page-root">
      <nav>
        <Link to="/lessons" className="nav-back">
          ← Lessons
        </Link>
        <div className="nav-logo">senso</div>
        <div style={{ width: 80 }} />
      </nav>

      <div className="hero-card" id="heroCard">
        <div className="hero-left">
          <div className={`lesson-tag ${lesson.type === 'practice' ? 'practice-tag' : ''}`}>
            {lesson.type === 'practice' ? 'Practice' : 'Learn'}
          </div>
          <h1 className="hero-title">{lesson.title}</h1>
          <p className="hero-desc">{lesson.desc}</p>
          <p className="hero-instructions">{lesson.instructions}</p>
          <button
            type="button"
            className="btn-start"
            id="heroStartBtn"
            onClick={markCurrentDone}
            style={alreadyDone ? { background: '#5cb85c' } : undefined}
          >
            {alreadyDone ? 'COMPLETED ✓' : 'complete'}
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat-circle" id="circleCompletion">
            <svg viewBox="0 0 110 110">
              <circle className="track" cx="55" cy="55" r="46" />
              <circle
                ref={completionArcRef}
                className="fill-orange"
                id="completionArc"
                cx="55"
                cy="55"
                r="46"
                strokeDasharray="289"
                strokeDashoffset="289"
              />
            </svg>
            <div className="stat-inner">
              <div className="stat-pct" id="completionPct">
                {Math.round(
                  (chapter.lessons.filter((l) => completedList.includes(l.id)).length /
                    chapter.lessons.length) *
                    100,
                )}
                %
              </div>
              <div className="stat-label">
                chapter
                <br />
                completion
              </div>
            </div>
          </div>
          <div className="stat-circle">
            <svg viewBox="0 0 110 110">
              <circle className="track" cx="55" cy="55" r="46" />
              <circle
                ref={accuracyArcRef}
                className="fill-blue"
                id="accuracyArc"
                cx="55"
                cy="55"
                r="46"
                strokeDasharray="289"
                strokeDashoffset="289"
              />
            </svg>
            <div className="stat-inner">
              <div className="stat-pct" id="accuracyPct">
                {accuracyDisplay}
              </div>
              <div className="stat-label">accuracy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-title" id="chapterLabel">
        {chapter.label}
      </div>
      <div className="lessons-grid" id="lessonsGrid">
        {chapter.lessons.map((l) => {
          const isDone = completedList.includes(l.id)
          const isActive = l.id === lesson.id
          return (
            <div
              key={l.id}
              className={`lesson-card ${isActive ? 'active' : ''} ${isDone ? 'completed-card' : ''}`}
              onClick={() => goLesson(l.id)}
              role="presentation"
            >
              <div className="card-num">{l.num}</div>
              <div className="card-title">{l.title}</div>
              <div className="card-desc">{l.desc}</div>
              <button
                type="button"
                className={`card-btn ${isDone ? 'done-btn' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  goLesson(l.id)
                }}
              >
                {isDone ? 'DONE ✓' : 'START'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
