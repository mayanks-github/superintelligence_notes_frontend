import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type Video } from '../lib/api'

function noteLabel(note: Video['notes'][number], index: number) {
  return note.title?.trim() || note.source || `Note ${index + 1}`
}

export default function VideoDetailPage() {
  const { videoId } = useParams()
  const { user, loading } = useAuth()
  const [video, setVideo] = useState<Video | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !videoId) return
    api
      .getVideo(videoId)
      .then(({ video }) => setVideo(video))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load video'),
      )
  }, [user, videoId])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  async function handleDelete(noteId: string) {
    setBusyId(noteId)
    try {
      await api.deleteNote(noteId)
      setVideo((current) => {
        if (!current) return current
        const notes = current.notes.filter((note) => note.id !== noteId)
        return {
          ...current,
          notes,
          notes_count: notes.length,
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Shell>
      <Link to="/" className="back">← Back</Link>

      {error && <div className="error">{error}</div>}

      {video && (
        <article className="video-detail">
          <div className="video-detail-header">
            {video.thumbnail_url && (
              <img
                className="video-thumb video-thumb-lg"
                src={video.thumbnail_url}
                alt=""
              />
            )}
            <div>
              <h1>{video.video_title}</h1>
              <div className="note-meta">
                <span>
                  {video.notes_count} note{video.notes_count === 1 ? '' : 's'}
                </span>
                {video.video_url && (
                  <a href={video.video_url} target="_blank" rel="noreferrer">
                    Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          </div>

          {video.notes.length === 0 ? (
            <section className="empty">
              <h2>No notes left</h2>
              <p>All notes for this video were deleted.</p>
            </section>
          ) : (
            <ul className="video-note-list">
              {video.notes.map((note, index) => (
                <li key={note.id} className="video-note-row">
                  <div>
                    <h2>{noteLabel(note, index)}</h2>
                    <div className="note-meta">
                      {note.source && <span>{note.source}</span>}
                      {note.captured_at && (
                        <span>{new Date(note.captured_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="note-actions">
                    <Link to={`/notes/${note.id}`}>Open</Link>
                    {note.web_view_link && (
                      <a href={note.web_view_link} target="_blank" rel="noreferrer">
                        Google Doc
                      </a>
                    )}
                    {note.source === 'youtube' && video.video_url && (
                      <a href={video.video_url} target="_blank" rel="noreferrer">
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
                </li>
              ))}
            </ul>
          )}
        </article>
      )}
    </Shell>
  )
}
