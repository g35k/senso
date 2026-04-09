/**
 * Per-lesson progress in sessionStorage (best accuracy + completed).
 * Migrates legacy `completed` JSON array on first read.
 */

const STATS_KEY = 'senso_lesson_stats'
const LEGACY_COMPLETED_KEY = 'completed'

function seededAccuracy(lessonId) {
  return 60 + (lessonId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 36)
}

function loadRawStats() {
  try {
    const raw = sessionStorage.getItem(STATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  const stats = {}
  try {
    const legacy = JSON.parse(sessionStorage.getItem(LEGACY_COMPLETED_KEY) || '[]')
    if (Array.isArray(legacy)) {
      for (const id of legacy) {
        const acc = seededAccuracy(id)
        stats[id] = {
          completed: true,
          bestAccuracy: acc,
        }
      }
    }
  } catch {
    /* ignore */
  }
  if (Object.keys(stats).length) {
    sessionStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }
  return stats
}

function saveRawStats(obj) {
  sessionStorage.setItem(STATS_KEY, JSON.stringify(obj))
}

/** @returns {{ completed: boolean; bestAccuracy: number | null }} */
export function getLessonStat(lessonId) {
  const s = loadRawStats()[lessonId]
  if (!s) return { completed: false, bestAccuracy: null }
  return {
    completed: Boolean(s.completed),
    bestAccuracy: typeof s.bestAccuracy === 'number' ? s.bestAccuracy : null,
  }
}

/**
 * Update best accuracy for a lesson (e.g. from device quiz).
 * @param {number} pct 0–100
 * @returns {{ improved: boolean }}
 */
export function recordBestAccuracy(lessonId, pct) {
  const all = loadRawStats()
  const prev = all[lessonId] || {}
  const n = Math.max(0, Math.min(100, Math.round(pct)))
  const prevBest = prev.bestAccuracy ?? 0
  const best = Math.max(prevBest, n)
  const improved = best > prevBest
  all[lessonId] = { ...prev, bestAccuracy: best }
  saveRawStats(all)
  return { improved }
}

export function markLessonComplete(lessonId) {
  let legacy = []
  try {
    legacy = JSON.parse(sessionStorage.getItem(LEGACY_COMPLETED_KEY) || '[]')
  } catch {
    legacy = []
  }
  if (!legacy.includes(lessonId)) {
    legacy.push(lessonId)
    sessionStorage.setItem(LEGACY_COMPLETED_KEY, JSON.stringify(legacy))
  }

  const all = loadRawStats()
  const prev = all[lessonId] || {}
  const seed = seededAccuracy(lessonId)
  all[lessonId] = {
    ...prev,
    completed: true,
    bestAccuracy: Math.max(prev.bestAccuracy ?? 0, seed),
  }
  saveRawStats(all)
}

/** Chapter-level aggregates for UI */
export function getChapterSummary(lessons) {
  const ids = lessons.map((l) => l.id)
  let done = 0
  let accSum = 0
  let accCount = 0
  for (const id of ids) {
    const st = getLessonStat(id)
    if (st.completed) done += 1
    if (st.bestAccuracy != null && st.bestAccuracy > 0) {
      accSum += st.bestAccuracy
      accCount += 1
    }
  }
  const avgAccuracy = accCount > 0 ? Math.round(accSum / accCount) : null
  return {
    total: ids.length,
    done,
    avgAccuracy,
    completionPct: ids.length ? Math.round((done / ids.length) * 100) : 0,
  }
}
