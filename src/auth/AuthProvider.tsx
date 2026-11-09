import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, getCurrentAdmin, login } from '../lib/api'
import type { AdminProfile } from '../lib/api'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import { clearSession, readSession, writeSession } from './tokenStorage'

type LoadedProfile = { token: string; profile: AdminProfile }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession)
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null)

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  useEffect(() => {
    if (!session) {
      return
    }
    const timeout = window.setTimeout(signOut, session.expiresAt - Date.now())
    return () => window.clearTimeout(timeout)
  }, [session, signOut])

  useEffect(() => {
    if (!session) {
      return
    }
    const controller = new AbortController()
    getCurrentAdmin(session.token, controller.signal)
      .then((profile) => setLoaded({ token: session.token, profile }))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          signOut()
        }
      })
    return () => controller.abort()
  }, [session, signOut])

  const signIn = useCallback(async (username: string, password: string) => {
    const response = await login(username, password)
    setSession(writeSession(response.access_token, response.expires_in))
  }, [])

  const authorized = useCallback(
    async <T,>(call: (token: string) => Promise<T>): Promise<T> => {
      const current = readSession()
      if (!current) {
        signOut()
        throw new ApiError(401, 'Oturum süresi doldu, lütfen tekrar giriş yapın.')
      }
      try {
        return await call(current.token)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          signOut()
        }
        throw error
      }
    },
    [signOut],
  )

  const admin = session && loaded?.token === session.token ? loaded.profile : null

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: session !== null, admin, signIn, signOut, authorized }),
    [session, admin, signIn, signOut, authorized],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
