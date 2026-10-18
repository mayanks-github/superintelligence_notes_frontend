import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { API_URL, api, type User } from '../lib/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => void
  completeLogin: (token: string) => Promise<void>
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const signInWithGoogle = useCallback(() => {
    const returnTo = `${window.location.origin}/auth/callback`
    window.location.assign(
      `${API_URL}/auth/google?return_to=${encodeURIComponent(returnTo)}`,
    )
  }, [])

  const completeLogin = useCallback(async (token: string) => {
    localStorage.setItem('token', token)
    try {
      const { user } = await api.me()
      setUser(user)
    } catch (error) {
      localStorage.removeItem('token')
      throw error
    }
  }, [])

  const refresh = useCallback(async () => {
    const { user } = await api.me()
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, completeLogin, refresh, logout }),
    [user, loading, signInWithGoogle, completeLogin, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
