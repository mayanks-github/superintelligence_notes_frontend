import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, type Video } from '../lib/api'

const PREVIEW_LIMIT = 3

function noteLabel(note: Video['notes'][number], index: number) {
  return note.title?.trim() || note.source || `Note ${index + 1}`
}

export default function VideosPage() {
  const { user, loading, logout } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    api
      .listVideos()
      .then(({ videos }) => setVideos(videos))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load videos'),
      )
  }, [user])

  if (loading) {
    return <main className="page"><p>Loading…</p></main>
  }

  if (!user) return <Navigate to="/login" replace />

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

      {videos.length === 0 ? (
        <section className="empty">
          <h2>No videos yet</h2>
          <p>
            Open a YouTube video, open Gemini’s summary, then click{' '}
            <strong>Save to Google Docs</strong> in the extension.
          </p>
        </section>
      ) : (
        <section className="videos-grid">
          {videos.map((video) => {
            const preview = video.notes.slice(0, PREVIEW_LIMIT)
            const hasMore = video.notes_count > PREVIEW_LIMIT

            return (
              <article key={video.video_id} className="video-card">
                {video.thumbnail_url ? (
                  <img
                    className="video-thumb"
                    src={video.thumbnail_url}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="video-thumb video-thumb-fallback" aria-hidden />
                )}

                <div className="video-card-body">
                  <h2>{video.video_title}</h2>
                  <p className="muted">
                    {video.notes_count} note{video.notes_count === 1 ? '' : 's'}
                  </p>

                  <ul className="note-title-list">
                    {preview.map((note, index) => (
                      <li key={note.id}>
                        <Link to={`/notes/${note.id}`}>{noteLabel(note, index)}</Link>
                      </li>
                    ))}
                  </ul>

                  <div className="note-actions">
                    {video.video_url && (
                      <a href={video.video_url} target="_blank" rel="noreferrer">
                        Watch
                      </a>
                    )}
                    {hasMore ? (
                      <Link to={`/videos/${encodeURIComponent(video.video_id)}`}>
                        Expand all {video.notes_count}
                      </Link>
                    ) : (
                      <Link to={`/videos/${encodeURIComponent(video.video_id)}`}>
                        Open folder
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
