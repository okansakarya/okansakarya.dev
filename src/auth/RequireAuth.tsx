import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '../pages/shared/PageState'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="page page--public">
        <LoadingState title="Oturum kontrol ediliyor…" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
