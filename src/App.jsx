import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LessonDetailPage from './pages/LessonDetailPage.jsx'
import LessonsPage from './pages/LessonsPage.jsx'

function LessonDetailHtmlRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/lesson${search}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/lessons" element={<LessonsPage />} />
      <Route path="/lesson" element={<LessonDetailPage />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/lessons.html" element={<Navigate to="/lessons" replace />} />
      <Route path="/lesson-detail.html" element={<LessonDetailHtmlRedirect />} />
    </Routes>
  )
}
