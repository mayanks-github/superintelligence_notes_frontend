import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()

  if (user) return <Navigate to="/" replace />

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Superintelligence Notes</h1>
        <p>Sign in with Google. Summaries are saved into your Google Docs.</p>
        <button type="button" onClick={signInWithGoogle}>
          Continue with Google
        </button>
      </section>
    </main>
  )
}
