export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export type Profile = {
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  timezone: string
  bio: string | null
  avatar_source: string
  avatar_url: string | null
}

export type User = {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  plan_tier: 'free' | 'premium'
  premium_active: boolean
  profile: Profile | null
}

export type Source = {
  key: string
  name: string
  kind: string
  brand_color: string
  supports_watch: boolean
  supports_manual_paste: boolean
  enabled: boolean
  position: number
}

export type Capture = {
  id: number
  title: string
  summary_text: string | null
  origin: string
  google_doc_id: string | null
  external_url: string | null
  video_id: string | null
  video_url: string | null
  video_title: string | null
  thumbnail_url: string | null
  saved_at: string
  storage: string
  web_view_link: string | null
  source: Source
}

export type ExtensionSite = {
  key: string
  name: string
  match_pattern: string
  aliases: string[]
  catalog_enabled: boolean
  default_enabled: boolean
  enabled: boolean
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  plan_tier: 'free' | 'premium'
  premium_active: boolean
  created_at: string
  captures_count: number
}

export type AdminExtensionSite = {
  key: string
  name: string
  match_pattern: string
  aliases: string[]
  enabled: boolean
  default_enabled: boolean
  position: number
}

export type CaptureQuery = {
  source?: string
  saved_from?: string
  saved_to?: string
  sort?: 'saved_at_desc' | 'saved_at_asc'
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

async function upload<T>(path: string, body: FormData): Promise<T> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error || 'Upload failed')
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

  updateNote: (id: string, note: { title?: string; summary_text?: string }) =>
    request<{ note: Note }>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    }),

  getProfile: () => request<{ profile: Profile }>('/profile'),

  updateProfile: (profile: Partial<Pick<Profile, 'first_name' | 'last_name' | 'phone' | 'timezone' | 'bio'>>) =>
    request<{ user: User }>('/profile', {
      method: 'PATCH',
      body: JSON.stringify({ profile }),
    }),

  uploadAvatar: (file: File) => {
    const body = new FormData()
    body.append('avatar', file)
    return upload<{ user: User }>('/profile/avatar', body)
  },

  removeAvatar: () =>
    request<{ user: User }>('/profile/avatar', { method: 'DELETE' }),

  listSources: () => request<{ sources: Source[] }>('/sources'),

  listCaptures: (query: CaptureQuery = {}) => {
    const params = new URLSearchParams()
    if (query.source) params.set('source', query.source)
    if (query.saved_from) params.set('saved_from', query.saved_from)
    if (query.saved_to) params.set('saved_to', query.saved_to)
    if (query.sort) params.set('sort', query.sort)
    const suffix = params.toString()
    return request<{ captures: Capture[] }>(`/captures${suffix ? `?${suffix}` : ''}`)
  },

  createCapture: (capture: {
    source: string
    title: string
    summary_text: string
    video_url?: string
  }) =>
    request<{ capture: Capture; note: Note }>('/captures', {
      method: 'POST',
      body: JSON.stringify({ capture }),
    }),

  listExtensionSites: () => request<{ sites: ExtensionSite[] }>('/settings/extension_sites'),

  setExtensionSite: (key: string, enabled: boolean) =>
    request<{ site: ExtensionSite }>(`/settings/extension_sites/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    }),

  adminDashboard: () =>
    request<{
      dashboard: {
        users: number
        premium_users: number
        captures_today: number
        premium_feature_enabled: boolean
      }
    }>('/admin/dashboard'),

  adminUsers: (q?: string) =>
    request<{ users: AdminUser[] }>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  adminSetPremium: (id: number, enabled: boolean) =>
    request<{ user: AdminUser }>(`/admin/users/${id}/premium`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  adminBulkPremium: (enabled: boolean) =>
    request<{ premium_users: number; users: number }>('/admin/premium/bulk', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  adminSettings: () => request<{ premium_feature_enabled: boolean }>('/admin/settings'),

  adminUpdateSettings: (premium_feature_enabled: boolean) =>
    request<{ premium_feature_enabled: boolean }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ premium_feature_enabled }),
    }),

  adminSources: () => request<{ sources: Source[] }>('/admin/sources'),

  adminUpdateSources: (sources: Array<Pick<Source, 'key' | 'enabled' | 'position'>>) =>
    request<{ sources: Source[] }>('/admin/sources', {
      method: 'PATCH',
      body: JSON.stringify({ sources }),
    }),

  adminExtensionSites: () => request<{ sites: AdminExtensionSite[] }>('/admin/extension_sites'),

  adminUpdateExtensionSites: (
    extension_sites: Array<Pick<AdminExtensionSite, 'key' | 'enabled' | 'default_enabled'>>,
  ) =>
    request<{ sites: AdminExtensionSite[] }>('/admin/extension_sites', {
      method: 'PATCH',
      body: JSON.stringify({ extension_sites }),
    }),
}
