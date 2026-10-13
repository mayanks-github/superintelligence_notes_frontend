import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const { completeLogin } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    const oauthError = params.get('error')

    if (oauthError) {
      setError(oauthError)
      return
    }

    if (!token) {
      setError('Google sign-in did not return a session.')
      return
    }

    let cancelled = false
    completeLogin(token)
      .then(() => {
        if (!cancelled) navigate('/', { replace: true })
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Google sign-in failed')
        }
      })

    return () => {
      cancelled = true
    }
  }, [completeLogin, navigate, params])

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Superintelligence Notes</h1>
        {error ? (
          <>
            <div className="error">{error}</div>
            <p className="muted">
              <Link to="/login">Back to sign in</Link>
            </p>
          </>
        ) : (
          <p>Signing you in…</p>
        )}
      </section>
    </main>
  )
}
