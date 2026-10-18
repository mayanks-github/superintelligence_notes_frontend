import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user?.profile) return
    setFirstName(user.profile.first_name)
    setLastName(user.profile.last_name || '')
    setPhone(user.profile.phone || '')
    setTimezone(user.profile.timezone)
    setBio(user.profile.bio || '')
  }, [user])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSaved('')
    try {
      await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        timezone,
        bio,
      })
      await refresh()
      setSaved('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      await api.uploadAvatar(file)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function handleRemoveAvatar() {
    setError('')
    try {
      await api.removeAvatar()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore the generated avatar')
    }
  }

  return (
    <Shell>
      <form className="panel" onSubmit={handleSave}>
        <div className="profile-head">
          <div className="avatar-lg">
            {user.profile?.avatar_url ? <img src={user.profile.avatar_url} alt="" /> : <span>{firstName.slice(0, 1)}</span>}
          </div>
          <div>
            <h1>{[firstName, lastName].filter(Boolean).join(' ') || user.name}</h1>
            {user.plan_tier === 'premium' && (
              <span className={user.premium_active ? 'pill premium' : 'pill paused'}>
                {user.premium_active ? 'Premium' : 'Premium paused'}
              </span>
            )}
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        {saved && <p className="muted">{saved}</p>}
        <label>
          Photo
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} />
        </label>
        {user.profile?.avatar_source === 'upload' && (
          <button type="button" className="ghost" onClick={handleRemoveAvatar}>
            Use generated avatar
          </button>
        )}
        <label>
          First name
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
        </label>
        <label>
          Last name
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </label>
        <label>
          Email
          <input value={user.profile?.email || user.email} readOnly />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91…" />
        </label>
        <label>
          Timezone
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
        </label>
        <label>
          Bio
          <input value={bio} onChange={(event) => setBio(event.target.value)} maxLength={160} />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </Shell>
  )
}
