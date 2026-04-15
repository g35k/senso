const STUDENTS_KEY = 'senso_teacher_demo_students'

function hashToInt(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function ensureDemoStudents() {
  if (typeof localStorage === 'undefined') return []
  try {
    const existing = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]')
    if (Array.isArray(existing) && existing.length > 0) {
      const normalized = existing
        .filter((s) => s && typeof s === 'object')
        .map((s) => {
          const id = typeof s.id === 'string' ? s.id : null
          if (!id) return null
          const firstName =
            typeof s.firstName === 'string'
              ? s.firstName
              : typeof s.name === 'string'
                ? s.name
                : 'Student'
          const lastName = typeof s.lastName === 'string' ? s.lastName : 'Demo'
          return { id, firstName, lastName }
        })
        .filter(Boolean)

      if (normalized.length > 0) {
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(normalized))
        return normalized
      }
    }
  } catch {
    // ignore
  }

  const seed = String(Date.now())
  const demo = [
    { id: `s-${seed}-1`, firstName: 'Amina', lastName: 'Patel' },
    { id: `s-${seed}-2`, firstName: 'Leo', lastName: 'Nguyen' },
    { id: `s-${seed}-3`, firstName: 'Maya', lastName: 'Johnson' },
    { id: `s-${seed}-4`, firstName: 'Noah', lastName: 'Kim' },
  ]
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(demo))
  return demo
}

export function getDemoStudents() {
  return ensureDemoStudents()
}

export function getDemoStudent(studentId) {
  return ensureDemoStudents().find((s) => s.id === studentId) || null
}

/**
 * Demo progress model: deterministic per student id.
 * @returns {{ completionPct: number, lessonsCompleted: number, totalLessons: number, avgAccuracy: number, streakDays: number, lastActiveLabel: string }}
 */
export function getDemoProgress(studentId) {
  const totalLessons = 16
  const h = hashToInt(studentId)
  const lessonsCompleted = clamp((h % (totalLessons + 1)) | 0, 0, totalLessons)
  const completionPct = totalLessons ? Math.round((lessonsCompleted / totalLessons) * 100) : 0
  const avgAccuracy = clamp(62 + (h % 36), 0, 100)
  const streakDays = clamp((h % 12) | 0, 0, 30)

  const daysAgo = clamp(((h >>> 8) % 10) | 0, 0, 30)
  const lastActiveLabel = daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`

  return {
    completionPct,
    lessonsCompleted,
    totalLessons,
    avgAccuracy,
    streakDays,
    lastActiveLabel,
  }
}

export function getDemoCompletedLessonRows(studentId) {
  const { lessonsCompleted } = getDemoProgress(studentId)
  const rows = []
  for (let i = 1; i <= lessonsCompleted; i += 1) {
    rows.push({ id: `demo-${i}`, name: `Lesson ${i}` })
  }
  return rows
}

function pctFromHash(studentId, lessonId, min = 55, max = 100) {
  const h = hashToInt(`${studentId}::${lessonId}`)
  return clamp(min + (h % (max - min + 1)), 0, 100)
}

/**
 * Deterministic per-lesson stats for teacher demo.
 * @returns {{ status: 'completed' | 'in_progress' | 'not_started', bestAccuracy: number | null, attempts: number, correct: number, lastPracticedLabel: string }}
 */
export function getDemoLessonStat(studentId, lessonId, status) {
  const basePct =
    status === 'not_started' ? null : pctFromHash(studentId, lessonId, status === 'completed' ? 70 : 55, 100)

  const h = hashToInt(`${lessonId}::${studentId}`)
  const attempts = status === 'not_started' ? 0 : clamp(6 + (h % 28), 1, 80)
  const correct =
    status === 'not_started' || basePct == null
      ? 0
      : clamp(Math.round((attempts * basePct) / 100), 0, attempts)

  const daysAgo = status === 'not_started' ? null : clamp(((h >>> 9) % 14) | 0, 0, 30)
  const lastPracticedLabel =
    daysAgo == null ? '—' : daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`

  return {
    status,
    bestAccuracy: basePct,
    attempts,
    correct,
    lastPracticedLabel,
  }
}

