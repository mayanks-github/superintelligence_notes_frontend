import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, type Note } from '../lib/api'

export default function NoteDetailPage() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !id) return
    api
      .getNote(id)
      .then(({ note }) => setNote(note))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load note'),
      )
  }, [user, id])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  return (
    <main className="page">
      <Link
        to={note?.video_id ? `/videos/${encodeURIComponent(note.video_id)}` : '/'}
        className="back"
      >
        ← Back
      </Link>

      {error && <div className="error">{error}</div>}

      {note && (
        <article className="note-detail">
          <h1>{note.title || note.video_title || note.video_id}</h1>
          {note.video_title && note.title && note.title !== note.video_title && (
            <p className="muted">{note.video_title}</p>
          )}
          <div className="note-meta">
            <span>{note.source}</span>
            <span>{new Date(note.captured_at).toLocaleString()}</span>
            {note.web_view_link && (
              <a href={note.web_view_link} target="_blank" rel="noreferrer">
                Open in Google Docs
              </a>
            )}
            {note.video_url && (
              <a href={note.video_url} target="_blank" rel="noreferrer">
                Open on YouTube
              </a>
            )}
          </div>

          <section>
            <h2>Summary</h2>
            <pre className="summary">{note.summary_text}</pre>
          </section>

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
    </main>
  )
}
