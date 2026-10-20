import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type Note } from '../lib/api'

type DownloadFormat = 'pdf' | 'docx' | 'txt'

const DOWNLOAD_OPTIONS: Array<{
  format: DownloadFormat
  label: string
  description: string
}> = [
  { format: 'pdf', label: 'PDF', description: 'Best for sharing and printing' },
  { format: 'docx', label: 'Word', description: 'Editable offline in Word' },
  { format: 'txt', label: 'Text', description: 'Plain backup, any device' },
]

export default function NoteDetailPage() {
  const { id } = useParams()
  const { user, loading } = useAuth()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null)

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

  useEffect(() => {
    if (!downloadOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDownloadOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [downloadOpen])

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

  async function handleDownload(format: DownloadFormat) {
    if (!id) return
    setDownloading(format)
    setError('')
    try {
      await api.downloadNote(id, format)
      setDownloadOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(null)
    }
  }

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
              <button type="button" onClick={() => setDownloadOpen(true)}>Download</button>
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

      {downloadOpen && (
        <div
          className="download-sheet-backdrop"
          role="presentation"
          onClick={() => downloading === null && setDownloadOpen(false)}
        >
          <div
            className="download-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="download-sheet-header">
              <h2 id="download-sheet-title">Choose a format</h2>
              <button
                type="button"
                className="ghost"
                disabled={downloading !== null}
                onClick={() => setDownloadOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="download-sheet-options">
              {DOWNLOAD_OPTIONS.map((option) => (
                <button
                  key={option.format}
                  type="button"
                  className="download-sheet-card"
                  disabled={downloading !== null}
                  onClick={() => handleDownload(option.format)}
                >
                  <strong>{downloading === option.format ? 'Downloading…' : option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}
