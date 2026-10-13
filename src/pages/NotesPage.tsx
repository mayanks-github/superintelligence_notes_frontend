import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, type Note } from '../lib/api'

export default function NotesPage() {
  const { user, loading, logout } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    api
      .listNotes()
      .then(({ notes }) => setNotes(notes))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load notes'),
      )
  }, [user])

  if (loading) {
    return <main className="page"><p>Loading…</p></main>
  }

  if (!user) return <Navigate to="/login" replace />

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      await api.deleteNote(id)
      setNotes((current) => current.filter((note) => note.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Superintelligence Notes</h1>
          <p>Welcome, {user.name}</p>
        </div>
        <button type="button" className="ghost" onClick={logout}>
          Sign out
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      {notes.length === 0 ? (
        <section className="empty">
          <h2>No notes yet</h2>
          <p>
            Open a YouTube video, open Gemini’s summary, then click{' '}
            <strong>Save to Google Docs</strong> in the extension.
          </p>
        </section>
      ) : (
        <section className="notes-grid">
          {notes.map((note) => (
            <article key={note.id} className="note-card">
              <div className="note-meta">
                <span>{note.source}</span>
                <span>{new Date(note.captured_at).toLocaleString()}</span>
              </div>
              <h2>{note.video_title || note.video_id}</h2>
              <p>{note.summary_text.slice(0, 220)}{note.summary_text.length > 220 ? '…' : ''}</p>
              <div className="note-actions">
                <Link to={`/notes/${note.id}`}>Open</Link>
                {note.web_view_link && (
                  <a href={note.web_view_link} target="_blank" rel="noreferrer">
                    Google Doc
                  </a>
                )}
                {note.video_url && (
                  <a href={note.video_url} target="_blank" rel="noreferrer">
                    Watch
                  </a>
                )}
                <button
                  type="button"
                  className="danger"
                  disabled={busyId === note.id}
                  onClick={() => handleDelete(note.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
