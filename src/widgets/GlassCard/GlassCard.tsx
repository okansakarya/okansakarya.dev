import type { ElementType, ReactNode } from 'react'
import './GlassCard.css'

type GlassCardProps = {
  children: ReactNode
  as?: ElementType
  title?: string
  eyebrow?: string
  icon?: string
  actions?: ReactNode
  interactive?: boolean
  padding?: 'md' | 'lg' | 'none'
  className?: string
}

export function GlassCard({
  children,
  as: Tag = 'section',
  title,
  eyebrow,
  icon,
  actions,
  interactive,
  padding = 'lg',
  className,
}: GlassCardProps) {
  const classes = [
    'glass-card',
    `glass-card--pad-${padding}`,
    interactive && 'glass-card--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const hasHeader = title || eyebrow || actions

  return (
    <Tag className={classes}>
      {hasHeader && (
        <header className="glass-card__header">
          <div className="glass-card__heading">
            {icon && (
              <span className="glass-card__icon material-symbols-outlined" aria-hidden="true">
                {icon}
              </span>
            )}
            <div>
              {eyebrow && <span className="glass-card__eyebrow">{eyebrow}</span>}
              {title && <h2 className="glass-card__title">{title}</h2>}
            </div>
          </div>
          {actions && <div className="glass-card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  )
}
