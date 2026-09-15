import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe, login as apiLogin, logout as apiLogout, putData, signup as apiSignup, type AuthUser } from './lib/api'
import { hasLocalContent, loadData, clearLocalData } from './lib/storage'

type Auth = {
  user: AuthUser | null
  loading: boolean
  signup: (username: string, password: string) => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getMe()
      .then((next) => {
        if (!cancelled) setUser(next)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const onExpired = () => setUser(null)
    window.addEventListener('onesh-auth-expired', onExpired)
    return () => {
      cancelled = true
      window.removeEventListener('onesh-auth-expired', onExpired)
    }
  }, [])

  const signup = useCallback(async (username: string, password: string) => {
    const next = await apiSignup(username, password)
    const local = loadData()
    if (hasLocalContent(local)) {
      await putData(local).catch(() => undefined)
    }
    setUser(next)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setUser(await apiLogin(username, password))
  }, [])

  const logout = useCallback(async () => {
    await apiLogout().catch(() => undefined)
    clearLocalData()
    setUser(null)
  }, [])

  const value = useMemo<Auth>(() => ({ user, loading, signup, login, logout }), [user, loading, signup, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
