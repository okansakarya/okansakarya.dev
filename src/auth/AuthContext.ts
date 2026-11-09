import { createContext, useContext } from 'react'
import type { AdminProfile } from '../lib/api'

export type AuthContextValue = {
  isAuthenticated: boolean
  /** Profile from `/auth/me`; null until it loads for the current token. */
  admin: AdminProfile | null
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => void
  /** Runs an admin request with the current token and signs out on HTTP 401. */
  authorized: <T>(call: (token: string) => Promise<T>) => Promise<T>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}
