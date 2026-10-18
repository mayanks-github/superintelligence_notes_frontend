import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../context/AuthContext'
import { api, type Capture, type Source } from '../lib/api'

type View = 'notes' | 'videos'

function snippet(text: string | null) {
  const value = text?.trim() || ''
  return value.length > 140 ? `${value.slice(0, 140)}…` : value
}

export default function LibraryPage() {
  const { user, loading } = useAuth()
  const [sources, setSources] = useState<Source[]>([])
  const [captures, setCaptures] = useState<Capture[]>([])
  const [source, setSource] = useState('')
  const [savedFrom, setSavedFrom] = useState('')
  const [savedTo, setSavedTo] = useState('')
  const [sort, setSort] = useState<'saved_at_desc' | 'saved_at_asc'>('saved_at_desc')
  const [view, setView] = useState<View>('notes')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    api.listSources().then(({ sources }) => setSources(sources)).catch(() => setSources([]))
  }, [user])

  useEffect(() => {
    if (!user) return
    api
      .listCaptures({
        source: source || undefined,
        saved_from: savedFrom || undefined,
        saved_to: savedTo || undefined,
        sort,
      })
      .then(({ captures }) => {
        setCaptures(captures)
        setError('')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notes'))
  }, [user, source, savedFrom, savedTo, sort])

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const thisWeek = captures.filter((capture) => new Date(capture.saved_at).getTime() >= weekAgo).length
  const sourceCount = new Set(captures.map((capture) => capture.source.key)).size

  const videos = useMemo(() => {
    const groups = new Map<string, Capture[]>()
    captures.forEach((capture) => {
      if (!capture.video_id) return
      const list = groups.get(capture.video_id) || []
      list.push(capture)
      groups.set(capture.video_id, list)
    })
    return Array.from(groups.entries()).map(([videoId, notes]) => ({
      videoId,
      title: notes.find((note) => note.video_title)?.video_title || videoId,
      videoUrl: notes.find((note) => note.video_url)?.video_url || null,
      thumbnail: notes.find((note) => note.thumbnail_url)?.thumbnail_url || null,
      notes,
    }))
  }, [captures])

  if (loading) return <main className="page"><p>Loading…</p></main>
  if (!user) return <Navigate to="/login" replace />

  return (
    <Shell>
      {error && <div className="error">{error}</div>}

      <section className="stat-row">
        <article>
          <strong>{captures.length}</strong>
          <span>notes</span>
        </article>
        <article>
          <strong>{sourceCount}</strong>
          <span>sources</span>
        </article>
        <article>
          <strong>{thisWeek}</strong>
          <span>saved this week</span>
        </article>
      </section>

      <section className="library-toolbar">
        <div className="chips">
          <button type="button" className={source === '' ? 'chip active' : 'chip'} onClick={() => setSource('')}>
            All
          </button>
          {sources.map((item) => (
            <button
              key={item.key}
              type="button"
              className={source === item.key ? 'chip active' : 'chip'}
              onClick={() => setSource(item.key)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="filters">
          <label>
            From
            <input type="date" value={savedFrom} onChange={(event) => setSavedFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={savedTo} onChange={(event) => setSavedTo(event.target.value)} />
          </label>
          <label>
            Sort
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="saved_at_desc">Newest</option>
              <option value="saved_at_asc">Oldest</option>
            </select>
          </label>
          <div className="view-toggle">
            <button type="button" className={view === 'notes' ? 'chip active' : 'chip'} onClick={() => setView('notes')}>
              Notes
            </button>
            <button type="button" className={view === 'videos' ? 'chip active' : 'chip'} onClick={() => setView('videos')}>
              By video
            </button>
          </div>
          <Link to="/notes/new" className="paste-link">
            + Paste
          </Link>
        </div>
      </section>

      {captures.length === 0 ? (
        <section className="empty">
          <h2>No notes yet</h2>
          <p>Save a chat from the extension, or paste one here.</p>
          <Link to="/notes/new" className="paste-link">
            Paste a chat
          </Link>
        </section>
      ) : view === 'notes' ? (
        <section className="notes-grid">
          {captures.map((capture) => (
            <article key={capture.id} className="note-card">
              <span className="source-pill" style={{ color: capture.source.brand_color }}>
                {capture.source.name}
              </span>
              <h2>{capture.title}</h2>
              {snippet(capture.summary_text) && <p className="muted">{snippet(capture.summary_text)}</p>}
              <div className="note-meta">
                <span>{new Date(capture.saved_at).toLocaleString()}</span>
              </div>
              <div className="note-actions">
                {capture.google_doc_id && <Link to={`/notes/${capture.google_doc_id}`}>Open</Link>}
                {capture.source.supports_watch && capture.video_url && (
                  <a href={capture.video_url} target="_blank" rel="noreferrer">
                    Watch
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="videos-grid">
          {videos.length === 0 ? (
            <section className="empty">
              <h2>No videos in this view</h2>
              <p>Video folders appear when a note is tied to a YouTube id.</p>
            </section>
          ) : (
            videos.map((video) => (
              <article key={video.videoId} className="video-card">
                {video.thumbnail ? (
                  <img className="video-thumb" src={video.thumbnail} alt="" />
                ) : (
                  <div className="video-thumb video-thumb-fallback" />
                )}
                <div className="video-card-body">
                  <h2>{video.title}</h2>
                  <p className="muted">
                    {video.notes.length} note{video.notes.length === 1 ? '' : 's'}
                  </p>
                  <ul className="note-title-list">
                    {video.notes.slice(0, 3).map((note) => (
                      <li key={note.id}>
                        {note.google_doc_id ? (
                          <Link to={`/notes/${note.google_doc_id}`}>{note.title}</Link>
                        ) : (
                          note.title
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="note-actions">
                    {video.videoUrl && (
                      <a href={video.videoUrl} target="_blank" rel="noreferrer">
                        Watch
                      </a>
                    )}
                    <Link to={`/videos/${encodeURIComponent(video.videoId)}`}>Open folder</Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </Shell>
  )
}
