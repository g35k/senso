import { useCallback, useEffect, useState } from 'react'
import './App.css'
import {
  fetchState,
  getPiBaseUrl,
  postNext,
  postPress,
  setPiBaseUrl,
} from './piApi.js'

function App() {
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiUrlInput, setApiUrlInput] = useState(() => getPiBaseUrl())
  const [connectionOpen, setConnectionOpen] = useState(false)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const data = await fetchState()
      setState(data)
    } catch (e) {
      setError(e.message ?? String(e))
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
  }, [refresh])

  function applyApiUrl() {
    setPiBaseUrl(apiUrlInput)
    setApiUrlInput(getPiBaseUrl())
    refresh()
  }

  async function handlePress() {
    setLoading(true)
    setError(null)
    try {
      setState(await postPress())
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleNext() {
    setLoading(true)
    setError(null)
    try {
      setState(await postNext())
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  const pattern = state?.last_pattern
  const progress = state?.progress

  return (
    <main className="senso-app">
      <header className="senso-header">
        <h1>Senso</h1>
        <p className="senso-sub">
          Lesson progress is stored in <code>user_state.json</code> on the Pi
          (same file as <code>braille.py</code>) and shown here via{' '}
          <code>GET /state</code>.
        </p>
      </header>

      <section className="senso-connection">
        <button
          type="button"
          className="senso-btn ghost senso-disclosure"
          onClick={() => setConnectionOpen((o) => !o)}
          aria-expanded={connectionOpen}
        >
          Pi connection {connectionOpen ? '▼' : '▶'}
        </button>
        {connectionOpen && (
          <div className="senso-connection-panel">
            <label className="senso-label" htmlFor="api-url">
              API base URL
            </label>
            <div className="senso-connection-row">
              <input
                id="api-url"
                className="senso-input"
                type="url"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                placeholder="http://192.168.1.10:5001"
                autoComplete="off"
              />
              <button
                type="button"
                className="senso-btn primary"
                onClick={applyApiUrl}
              >
                Save &amp; connect
              </button>
            </div>
            <p className="senso-hint small">
              Same Wi‑Fi as the Pi. Pi IP: <code>hostname -I</code>. Default:{' '}
              <code>{getPiBaseUrl()}</code>
            </p>
          </div>
        )}
      </section>

      <section className="senso-progress" aria-live="polite">
        <h2 className="senso-h2">Lessons (from Pi)</h2>
        {progress && (
          <>
            <p className="senso-current">
              <span className="label">Current</span>
              <strong>{progress.current_lesson_name}</strong>
              <span className="id"> ({progress.current_lesson_id})</span>
            </p>
            {progress.completed_lessons?.length > 0 ? (
              <ul className="senso-lesson-list">
                {progress.completed_lessons.map((row, idx) => (
                  <li key={`${row.id}-${idx}`}>
                    <span className="check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{row.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="senso-muted">No lessons completed yet on the Pi.</p>
            )}
            {(progress.letters_completed?.length > 0 ||
              progress.numbers_completed?.length > 0) && (
              <div className="senso-chips">
                {progress.letters_completed?.length > 0 && (
                  <p>
                    <span className="label">Letters learned</span>{' '}
                    {progress.letters_completed.join(', ')}
                  </p>
                )}
                {progress.numbers_completed?.length > 0 && (
                  <p>
                    <span className="label">Numbers learned</span>{' '}
                    {progress.numbers_completed.join(', ')}
                  </p>
                )}
              </div>
            )}
          </>
        )}
        {!progress && !error && <p className="senso-loading">Loading…</p>}
        {!progress && error && (
          <p className="senso-muted">Could not load lesson progress.</p>
        )}
      </section>

      <section className="senso-quiz" aria-live="polite">
        <h2 className="senso-h2">Web quiz</h2>
        {error && (
          <div className="senso-error" role="alert">
            {error}
            <p className="senso-hint">
              Run <code>python app.py</code> in <code>braille-hardware</code>,
              then set the API URL above if the browser is not on the same
              machine as the Pi.
            </p>
          </div>
        )}

        {state && (
          <>
            <div className="senso-target">
              <span className="label">Target letter</span>
              <span className="target-letter">{state.target}</span>
            </div>

            <dl className="senso-stats">
              <div>
                <dt>Quiz score</dt>
                <dd>
                  {state.score} / {state.attempts}
                </dd>
              </div>
              <div>
                <dt>All-time (Pi + web)</dt>
                <dd>
                  {state.total_correct ?? '—'} / {state.total_attempts ?? '—'}
                </dd>
              </div>
              <div>
                <dt>GPIO</dt>
                <dd>{state.gpio_ok ? 'OK' : 'simulated (no Pi)'}</dd>
              </div>
            </dl>

            {state.last_result && (
              <p
                className={
                  state.last_result === 'correct'
                    ? 'senso-result ok'
                    : 'senso-result bad'
                }
              >
                {state.last_result === 'correct'
                  ? 'Correct!'
                  : `Not yet — you entered ${state.last_decoded ?? 'invalid pattern'}`}
              </p>
            )}

            {pattern && (
              <div className="senso-pattern" aria-label="Last dot pattern">
                {pattern.map((on, i) => (
                  <span
                    key={i}
                    className={on ? 'dot on' : 'dot'}
                    title={`Dot ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            )}

            <div className="senso-actions">
              <button
                type="button"
                className="senso-btn primary"
                onClick={handlePress}
                disabled={loading}
              >
                Submit (read keys)
              </button>
              <button
                type="button"
                className="senso-btn"
                onClick={handleNext}
                disabled={loading}
              >
                Next letter
              </button>
              <button
                type="button"
                className="senso-btn ghost"
                onClick={() => refresh()}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </>
        )}

        {!state && !error && <p className="senso-loading">Loading…</p>}
      </section>
    </main>
  )
}
