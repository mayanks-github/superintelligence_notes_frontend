import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type Source } from '../lib/api'

export default function PastePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [sources, setSources] = useState<Source[]>([])
  const [source, setSource] = useState('gemini')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    api
      .listSources()
      .then(({ sources }) => {
        const pasteable = sources.filter((item) => item.supports_manual_paste)
        setSources(pasteable)
        if (pasteable[0]) setSource(pasteable[0].key)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load sources'))
  }, [user])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  const selected = sources.find((item) => item.key === source)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { note } = await api.createCapture({
        source,
        title,
        summary_text: summary,
        video_url: selected?.supports_watch ? videoUrl : undefined,
      })
      navigate(`/notes/${note.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the chat')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <Link to="/" className="back">← Back</Link>
      <form className="panel" onSubmit={handleSubmit}>
        <h1>Paste a chat</h1>
        <p className="muted">This creates a Google Doc and a note in your library.</p>
        {error && <div className="error">{error}</div>}
        <label>
          Source
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            {sources.map((item) => (
              <option key={item.key} value={item.key}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        {selected?.supports_watch && (
          <label>
            YouTube URL
            <input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              required
            />
          </label>
        )}
        <label>
          Chat
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={12}
            required
            placeholder="Paste the conversation here"
          />
        </label>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save chat'}</button>
      </form>
    </Shell>
  )
}
