import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  if (!user) return null

  const label = user.profile?.first_name || user.name

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <Link to="/" className="brand">
            Superintelligence Notes
          </Link>
          <p>Welcome, {label}</p>
        </div>
        <div className="top-actions">
          {user.plan_tier === 'premium' && (
            <span className={user.premium_active ? 'pill premium' : 'pill paused'}>
              {user.premium_active ? 'Premium' : 'Premium paused'}
            </span>
          )}
          <Link to="/profile" className="avatar-link" aria-label="Profile">
            {user.profile?.avatar_url ? (
              <img src={user.profile.avatar_url} alt="" />
            ) : (
              <span>{label.slice(0, 1).toUpperCase()}</span>
            )}
          </Link>
          <Link to="/settings" className="nav-link">
            Settings
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" className="nav-link">
              Admin
            </Link>
          )}
          <button type="button" className="ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      {children}
    </main>
  )
}
