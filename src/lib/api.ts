export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export type User = {
  id: number
  name: string
  email: string
}

export type NoteSection = {
  heading?: string
  timestamp?: string
  bullets?: string[]
}

export type Note = {
  id: string
  title?: string | null
  video_id: string
  video_title: string | null
  video_url: string | null
  summary_text: string
  source: string
  sections: NoteSection[] | null
  captured_at: string
  created_at: string
  updated_at: string
  web_view_link?: string | null
}

export type VideoNoteSummary = {
  id: string
  title: string | null
  source: string | null
  captured_at: string | null
  created_at: string | null
  web_view_link?: string | null
}

export type Video = {
  video_id: string
  video_title: string
  video_url: string | null
  thumbnail_url: string | null
  notes_count: number
  notes: VideoNoteSummary[]
  latest_captured_at: string | null
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message =
      body.error ||
      (Array.isArray(body.errors) ? body.errors.join(', ') : null) ||
      'Request failed'
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  me: () => request<{ user: User }>('/auth/me'),

  listVideos: () => request<{ videos: Video[] }>('/videos'),

  getVideo: (videoId: string) =>
    request<{ video: Video }>(`/videos/${encodeURIComponent(videoId)}`),

  listNotes: (videoId?: string) => {
    const query = videoId
      ? `?video_id=${encodeURIComponent(videoId)}`
      : ''
    return request<{ notes: Note[] }>(`/notes${query}`)
  },

  getNote: (id: string) => request<{ note: Note }>(`/notes/${id}`),

  deleteNote: (id: string) =>
    request<void>(`/notes/${id}`, { method: 'DELETE' }),
}
