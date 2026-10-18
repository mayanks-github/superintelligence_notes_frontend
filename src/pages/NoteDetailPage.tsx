import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type Note } from '../lib/api'

export default function NoteDetailPage() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user || !id) return
    api
      .getNote(id)
      .then(({ note }) => {
        setNote(note)
        setTitle(note.title || note.video_title || '')
        setSummary(note.summary_text)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load note'),
      )
  }, [user, id])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!id) return
    setBusy(true)
    setError('')
    try {
      const { note: updated } = await api.updateNote(id, { title, summary_text: summary })
      setNote(updated)
      setTitle(updated.title || title)
      setSummary(updated.summary_text)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the note')
    } finally {
      setBusy(false)
    }
  }

  const youtubeSource = note?.source === 'youtube'
  const backTo = note?.video_id && note.video_id !== 'library'
    ? `/videos/${encodeURIComponent(note.video_id)}`
    : '/'

  return (
    <Shell>
      <Link to={backTo} className="back">← Back</Link>

      {error && <div className="error">{error}</div>}

      {note && (
        <article className="note-detail">
          {editing ? (
            <form className="stack" onSubmit={handleSave}>
              <label>
                Title
                <input value={title} onChange={(event) => setTitle(event.target.value)} required />
              </label>
              <label>
                Chat
                <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={12} required />
              </label>
              <div className="note-actions">
                <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                <button type="button" className="ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1>{note.title || note.video_title || note.video_id}</h1>
              {note.video_title && note.title && note.title !== note.video_title && (
                <p className="muted">{note.video_title}</p>
              )}
            </>
          )}
          <div className="note-meta">
            <span>{note.source}</span>
            <span>{new Date(note.captured_at).toLocaleString()}</span>
            {note.web_view_link && (
              <a href={note.web_view_link} target="_blank" rel="noreferrer">
                Open in Google Docs
              </a>
            )}
            {youtubeSource && note.video_url && (
              <a href={note.video_url} target="_blank" rel="noreferrer">
                Watch
              </a>
            )}
          </div>
          {!editing && (
            <div className="note-actions">
              <button type="button" className="ghost" onClick={() => setEditing(true)}>Edit</button>
            </div>
          )}

          {!editing && (
          <section>
            <h2>Summary</h2>
            <pre className="summary">{note.summary_text}</pre>
          </section>
          )}

          {note.sections && note.sections.length > 0 && (
            <section>
              <h2>Sections</h2>
              {note.sections.map((section, index) => (
                <div key={`${section.heading}-${index}`} className="section-block">
                  <h3>
                    {section.heading || `Section ${index + 1}`}
                    {section.timestamp ? ` · ${section.timestamp}` : ''}
                  </h3>
                  <ul>
                    {(section.bullets || []).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </article>
      )}
    </Shell>
  )
}
