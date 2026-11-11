import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ApiError } from '../lib/api'
import type { AdminProfile } from '../lib/api'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'

function adminProfile(session: Session | null): AdminProfile | null {
  const user = session?.user
  if (!user || user.app_metadata?.role !== 'admin') {
    return null
  }
  return { id: user.id, username: user.email ?? user.id }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setIsReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(() => {
    void supabase.auth.signOut()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new ApiError(error.code === 'invalid_credentials' ? 401 : (error.status ?? 0), error.message)
    }
    if (!adminProfile(data.session)) {
      await supabase.auth.signOut()
      throw new ApiError(403, 'Bu hesabın yönetici yetkisi yok.')
    }
  }, [])

  const authorized = useCallback(
    async <T,>(call: () => Promise<T>): Promise<T> => {
      try {
        return await call()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          signOut()
        }
        throw error
      }
    },
    [signOut],
  )

  const admin = useMemo(() => adminProfile(session), [session])

  const value = useMemo<AuthContextValue>(
    () => ({ isReady, isAuthenticated: admin !== null, admin, signIn, signOut, authorized }),
    [isReady, admin, signIn, signOut, authorized],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
