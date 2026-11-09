import type { ReactNode } from 'react'
import { Button } from '../../widgets/Button/Button'
import { GlassCard } from '../../widgets/GlassCard/GlassCard'

type PageStateProps = {
  icon: string
  title: string
  message?: string
  action?: ReactNode
}

/** Loading, empty and error states composed from GlassCard. */
export function PageState({ icon, title, message, action }: PageStateProps) {
  return (
    <GlassCard className="page-state">
      <span className="page-state__icon material-symbols-outlined" aria-hidden="true">
        {icon}
      </span>
      <p className="page-state__title" role="status">
        {title}
      </p>
      {message && <p className="page-state__message">{message}</p>}
      {action}
    </GlassCard>
  )
}

export function LoadingState({ title = 'Yükleniyor…' }: { title?: string }) {
  return <PageState icon="progress_activity" title={title} />
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <PageState
      icon="error"
      title="Bir sorun oluştu"
      message={error.message}
      action={
        onRetry && (
          <Button variant="ghost" icon="refresh" onClick={onRetry}>
            Tekrar Dene
          </Button>
        )
      }
    />
  )
}
