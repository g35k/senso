import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { lessonChapters } from '../data/lessonChapters.js'
import { getChapterSummary, getLessonStat, recordBestAccuracy } from '../lib/lessonProgressStorage.js'
import { fetchState } from '../piApi.js'
import '../components/LessonDetailPage.css'

export default function LessonDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const chapterId = searchParams.get('chapter') || 'ch1'
  const lessonId = searchParams.get('lesson') || 'ch1-1'

  const chapter = lessonChapters[chapterId] ?? lessonChapters.ch1
  const lesson =
    chapter.lessons.find((l) => l.id === lessonId) ?? chapter.lessons[0]

  const [tick, setTick] = useState(0)
  const [deviceOk, setDeviceOk] = useState(null)

  const summary = getChapterSummary(chapter.lessons)

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    document.title = `SENSO — ${chapter.label}`
  }, [chapter.label])

  useEffect(() => {
    let cancelled = false
    let timer

    async function poll() {
      try {
        const state = await fetchState()
        if (cancelled) return
        setDeviceOk(true)
        const attempts = state.attempts ?? 0
        const score = state.score ?? 0
        if (attempts > 0) {
          const pct = Math.min(100, Math.round((score / attempts) * 100))
          const { improved } = recordBestAccuracy(lesson.id, pct)
          if (improved) refresh()
        }
      } catch {
        if (!cancelled) {
          setDeviceOk(false)
        }
      }
      timer = window.setTimeout(poll, 2000)
    }

    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [lesson.id, refresh])

  function selectLesson(id) {
    navigate(`/lesson?chapter=${chapterId}&lesson=${id}`)
  }

  return (
    <div className="lesson-detail-v2">
      <header className="lesson-v2-nav">
        <Link to="/lessons" className="lesson-v2-back">
          ← All lessons
        </Link>
        <span className="lesson-v2-brand">senso</span>
        <span className="lesson-v2-nav-spacer" />
      </header>

      <main className="lesson-v2-main">
        <section className="lesson-v2-chapter-card" aria-labelledby="chapter-heading">
          <p className="lesson-v2-eyebrow">Your chapter</p>
          <h1 id="chapter-heading" className="lesson-v2-chapter-title">
            {chapter.label}
          </h1>
          <p className="lesson-v2-chapter-sub">
            Follow along on your SENSO. This screen shows how you are doing.
          </p>

          <div className="lesson-v2-summary-row" role="group" aria-label="Chapter scores">
            <div className="lesson-v2-summary-pill">
              <span className="lesson-v2-summary-label">Lessons finished</span>
              <span className="lesson-v2-summary-value">
                {summary.done}
                <span className="lesson-v2-summary-of"> / {summary.total}</span>
              </span>
            </div>
            <div className="lesson-v2-summary-pill lesson-v2-summary-pill-accent">
              <span className="lesson-v2-summary-label">Chapter score</span>
              <span className="lesson-v2-summary-value">
                {summary.avgAccuracy != null ? `${summary.avgAccuracy}%` : '—'}
              </span>
            </div>
          </div>

          <div
            className="lesson-v2-chapter-bar"
            role="progressbar"
            aria-valuenow={summary.completionPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="lesson-v2-chapter-bar-fill"
              style={{ width: `${summary.completionPct}%` }}
            />
          </div>
          <p className="lesson-v2-chapter-bar-caption">
            {summary.completionPct}% of this chapter done
          </p>
        </section>

        <section className="lesson-v2-device" aria-label="Device connection">
          <div className="lesson-v2-device-inner">
            <span
              className={`lesson-v2-device-dot ${deviceOk ? 'on' : deviceOk === false ? 'off' : ''}`}
              aria-hidden
            />
            <div>
              <p className="lesson-v2-device-title">
                {deviceOk === true
                  ? 'SENSO is connected'
                  : deviceOk === false
                    ? 'SENSO not connected'
                    : 'Checking your SENSO…'}
              </p>
              <p className="lesson-v2-device-text">
                Press the square button on your device to start the lesson. Your score updates here
                while you practice.
              </p>
            </div>
          </div>
        </section>

        <section className="lesson-v2-lessons-section" aria-labelledby="lessons-heading">
          <h2 id="lessons-heading" className="lesson-v2-tiles-heading">
            Lessons
          </h2>
          <div className="lesson-v2-tile-grid">
            {chapter.lessons.map((l, index) => {
              const stat = getLessonStat(l.id)
              const active = l.id === lesson.id
              const displayAcc = stat.bestAccuracy
              const accText =
                displayAcc != null && displayAcc > 0 ? `${displayAcc}%` : '—'

              function onTileKeyDown(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  selectLesson(l.id)
                }
              }

              return (
                <div
                  key={l.id}
                  className={`lesson-v2-tile ${active ? 'lesson-v2-tile-active' : ''} ${stat.completed ? 'lesson-v2-tile-complete' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectLesson(l.id)}
                  onKeyDown={onTileKeyDown}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Lesson ${index + 1}: ${l.title}`}
                >
                  <div className="lesson-v2-tile-top">
                    <span className="lesson-v2-tile-num">{index + 1}</span>
                    <span
                      className={`lesson-v2-tile-type ${l.type === 'practice' ? 'is-practice' : ''}`}
                    >
                      {l.type === 'practice' ? 'Practice' : 'Learn'}
                    </span>
                  </div>
                  <h3 className="lesson-v2-tile-title">{l.title}</h3>
                  <p className="lesson-v2-tile-desc">{l.desc}</p>
                  <div className="lesson-v2-tile-best">
                    <span className="lesson-v2-tile-best-label">Your best</span>
                    <span className="lesson-v2-tile-best-pct">{accText}</span>
                  </div>
                  <span
                    className={`lesson-v2-tile-status ${stat.completed ? 'is-done' : 'is-pending'}`}
                    aria-hidden
                  >
                    {stat.completed ? 'Done ✓' : 'Not finished'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
