import type { ReactNode } from 'react'
import './StatusBadge.css'

export type StatusTone = 'success' | 'info' | 'neutral' | 'danger'

type StatusBadgeProps = {
  children: ReactNode
  tone?: StatusTone
  icon?: string
  dot?: boolean
}

export function StatusBadge({ children, tone = 'neutral', icon, dot }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {dot && <span className="status-badge__dot" aria-hidden="true" />}
      {icon && (
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
