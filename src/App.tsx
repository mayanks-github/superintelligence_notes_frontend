import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminPage from './pages/AdminPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import LoginPage from './pages/LoginPage'
import LibraryPage from './pages/LibraryPage'
import NoteDetailPage from './pages/NoteDetailPage'
import PastePage from './pages/PastePage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import VideoDetailPage from './pages/VideoDetailPage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/videos/:videoId" element={<VideoDetailPage />} />
          <Route path="/notes/new" element={<PastePage />} />
          <Route path="/notes/:id" element={<NoteDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
