import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type AdminExtensionSite, type AdminUser, type Source } from '../lib/api'

type Tab = 'overview' | 'users' | 'catalog'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState({
    users: 0,
    premium_users: 0,
    captures_today: 0,
    premium_feature_enabled: true,
  })
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [sites, setSites] = useState<AdminExtensionSite[]>([])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    api.adminDashboard().then(({ dashboard }) => setDashboard(dashboard)).catch((err) => setError(err.message))
    api.adminUsers().then(({ users }) => setUsers(users)).catch((err) => setError(err.message))
    api.adminSources().then(({ sources }) => setSources(sources)).catch((err) => setError(err.message))
    api.adminExtensionSites().then(({ sites }) => setSites(sites)).catch((err) => setError(err.message))
  }, [user])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  async function refreshDashboard() {
    const { dashboard } = await api.adminDashboard()
    setDashboard(dashboard)
  }

  async function searchUsers(event: React.FormEvent) {
    event.preventDefault()
    const { users } = await api.adminUsers(query)
    setUsers(users)
  }

  async function setUserPremium(person: AdminUser, enabled: boolean) {
    const { user: updated } = await api.adminSetPremium(person.id, enabled)
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    await refreshDashboard()
  }

  async function bulk(enabled: boolean) {
    const label = enabled ? 'enable premium for every user' : 'disable premium for every user'
    if (!window.confirm(`This will ${label}. Continue?`)) return
    await api.adminBulkPremium(enabled)
    const { users } = await api.adminUsers(query)
    setUsers(users)
    await refreshDashboard()
  }

  async function setFeature(enabled: boolean) {
    const { premium_feature_enabled } = await api.adminUpdateSettings(enabled)
    setDashboard((current) => ({ ...current, premium_feature_enabled }))
    const { users } = await api.adminUsers(query)
    setUsers(users)
  }

  async function saveSource(source: Source, enabled: boolean) {
    const { sources: updated } = await api.adminUpdateSources([
      { key: source.key, enabled, position: source.position },
    ])
    setSources(updated)
  }

  async function saveSite(site: AdminExtensionSite, patch: Partial<AdminExtensionSite>) {
    const { sites: updated } = await api.adminUpdateExtensionSites([
      {
        key: site.key,
        enabled: patch.enabled ?? site.enabled,
        default_enabled: patch.default_enabled ?? site.default_enabled,
      },
    ])
    setSites(updated)
  }

  return (
    <Shell>
      <div className="chips">
        {(['overview', 'users', 'catalog'] as Tab[]).map((item) => (
          <button key={item} type="button" className={tab === item ? 'chip active' : 'chip'} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}

      {tab === 'overview' && (
        <section className="panel">
          <h1>Admin</h1>
          <section className="stat-row">
            <article><strong>{dashboard.users}</strong><span>users</span></article>
            <article><strong>{dashboard.premium_users}</strong><span>premium</span></article>
            <article><strong>{dashboard.captures_today}</strong><span>captures today</span></article>
          </section>
          <h2>Premium feature</h2>
          <p className="muted">
            Kill switch is {dashboard.premium_feature_enabled ? 'on' : 'off'}. Users keep their plan, but premium features stay inactive while this is off.
          </p>
          <div className="note-actions">
            <button type="button" onClick={() => setFeature(true)}>Enable premium feature</button>
            <button type="button" className="danger" onClick={() => setFeature(false)}>Disable premium feature</button>
          </div>
          <h2>All users</h2>
          <div className="note-actions">
            <button type="button" onClick={() => bulk(true)}>Enable premium for all</button>
            <button type="button" className="ghost" onClick={() => bulk(false)}>Disable premium for all</button>
          </div>
        </section>
      )}

      {tab === 'users' && (
        <section className="panel">
          <h1>Users</h1>
          <form className="filters" onSubmit={searchUsers}>
            <label>
              Search
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" />
            </label>
            <button type="submit">Search</button>
          </form>
          <ul className="site-list">
            {users.map((person) => (
              <li key={person.id}>
                <div>
                  <strong>{person.name}</strong>
                  <p className="muted">{person.email} · {person.plan_tier} · {person.captures_count} notes</p>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setUserPremium(person, person.plan_tier !== 'premium')}
                >
                  {person.plan_tier === 'premium' ? 'Disable premium' : 'Enable premium'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'catalog' && (
        <section className="panel">
          <h1>Sources</h1>
          <ul className="site-list">
            {sources.map((source) => (
              <li key={source.key}>
                <div>
                  <strong>{source.name}</strong>
                  <p className="muted">{source.enabled ? 'Shown in filters' : 'Hidden'}</p>
                </div>
                <button type="button" className="ghost" onClick={() => saveSource(source, !source.enabled)}>
                  {source.enabled ? 'Disable' : 'Enable'}
                </button>
              </li>
            ))}
          </ul>
          <h1>Extension websites</h1>
          <ul className="site-list">
            {sites.map((site) => (
              <li key={site.key}>
                <div>
                  <strong>{site.name}</strong>
                  <p className="muted">
                    Catalog {site.enabled ? 'available' : 'hidden'} · default {site.default_enabled ? 'on' : 'off'}
                  </p>
                </div>
                <div className="note-actions">
                  <button type="button" className="ghost" onClick={() => saveSite(site, { enabled: !site.enabled })}>
                    {site.enabled ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" className="ghost" onClick={() => saveSite(site, { default_enabled: !site.default_enabled })}>
                    Default {site.default_enabled ? 'off' : 'on'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  )
}
