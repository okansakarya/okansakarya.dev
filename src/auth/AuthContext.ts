import { createContext, useContext } from 'react'
import type { AdminProfile } from '../lib/api'

export type AuthContextValue = {
  /** False until Supabase has restored any stored session. */
  isReady: boolean
  isAuthenticated: boolean
  admin: AdminProfile | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  /** Runs an admin request and signs out when the session is rejected (HTTP 401). */
  authorized: <T>(call: () => Promise<T>) => Promise<T>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}
