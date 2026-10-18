import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type ExtensionSite } from '../lib/api'

function matchesQuery(site: ExtensionSite, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return false
  const compactNeedle = needle.replace(/\s+/g, '')
  const fields = [site.name, site.key, site.match_pattern, ...site.aliases]
  return fields.some((field) => {
    const value = field.toLowerCase()
    return value.includes(needle) || value.replace(/\s+/g, '').includes(compactNeedle)
  })
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [sites, setSites] = useState<ExtensionSite[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    api
      .listExtensionSites()
      .then(({ sites }) => setSites(sites))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load websites'))
  }, [user])

  const results = useMemo(
    () => (query.trim() ? sites.filter((site) => matchesQuery(site, query)) : []),
    [sites, query],
  )
  const enabled = sites.filter((site) => site.enabled)

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  async function toggle(site: ExtensionSite, next: boolean) {
    setBusyKey(site.key)
    setError('')
    try {
      const { site: updated } = await api.setExtensionSite(site.key, next)
      setSites((current) => current.map((item) => (item.key === updated.key ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the website')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <Shell>
      <section className="panel">
        <h1>Extension</h1>
        <p className="muted">The extension only runs on sites you enable. Search to add one.</p>
        {error && <div className="error">{error}</div>}
        <label>
          Search websites
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search websites, e.g. ChatGPT"
          />
        </label>

        {query.trim() && (
          <div className="site-block">
            <h2>Search results</h2>
            {results.length === 0 ? (
              <p className="muted">No websites found.</p>
            ) : (
              <ul className="site-list">
                {results.map((site) => (
                  <SiteRow
                    key={site.key}
                    site={site}
                    busy={busyKey === site.key}
                    onToggle={toggle}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="site-block">
          <h2>Enabled websites</h2>
          {enabled.length === 0 ? (
            <p className="muted">No websites enabled. Search above to add one.</p>
          ) : (
            <ul className="site-list">
              {enabled.map((site) => (
                <li key={site.key}>
                  <div>
                    <strong>{site.name}</strong>
                    <p className="muted">{site.match_pattern}</p>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    disabled={busyKey === site.key}
                    onClick={() => toggle(site, false)}
                  >
                    Disable
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </Shell>
  )
}

function SiteRow({
  site,
  busy,
  onToggle,
}: {
  site: ExtensionSite
  busy: boolean
  onToggle: (site: ExtensionSite, enabled: boolean) => void
}) {
  const unavailable = !site.catalog_enabled && !site.enabled
  return (
    <li>
      <div>
        <strong>{site.name}</strong>
        <p className="muted">{site.match_pattern}</p>
      </div>
      {unavailable ? (
        <span className="pill paused">Coming soon</span>
      ) : (
        <button
          type="button"
          className="ghost"
          disabled={busy}
          onClick={() => onToggle(site, !site.enabled)}
        >
          {site.enabled ? 'Disable' : 'Enable'}
        </button>
      )}
    </li>
  )
}
