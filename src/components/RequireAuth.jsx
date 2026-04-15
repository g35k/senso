import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'

const STUDENT_BYPASS_KEY = 'senso_student_bypass'
const TEACHER_BYPASS_KEY = 'senso_teacher_bypass'

/**
 * @param {{ children: import('react').ReactNode, roles?: ('student' | 'teacher')[] }} props
 */
export default function RequireAuth({ children, roles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  const studentBypass =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(STUDENT_BYPASS_KEY) === '1' &&
    roles?.includes('student')

  if (studentBypass) {
    return children
  }

  const teacherBypass =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(TEACHER_BYPASS_KEY) === '1' &&
    roles?.includes('teacher')

  if (teacherBypass) {
    return children
  }

  if (!isSupabaseConfigured()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '40vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Nunito, sans-serif',
          color: '#555',
        }}
      >
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles?.length && profile) {
    if (!roles.includes(profile.role)) {
      return <Navigate to={profile.role === 'teacher' ? '/dashboard' : '/lessons'} replace />
    }
  }

  if (roles?.length && !profile) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '48px auto',
          padding: 24,
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        <p style={{ fontWeight: 800, marginBottom: 8 }}>Account setup incomplete</p>
        <p style={{ color: '#555', lineHeight: 1.5 }}>
          Your profile was not found. If you just signed up, try again in a moment or contact support.
        </p>
      </div>
    )
  }

  return children
}
