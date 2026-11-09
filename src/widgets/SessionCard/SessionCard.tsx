import { ApiHealthBadge } from '../ApiHealthBadge/ApiHealthBadge'
import './SessionCard.css'

export function SessionCard({ username }: { username: string | null }) {
  return (
    <div className="session-card">
      <span className="material-symbols-outlined session-card__avatar" aria-hidden="true">
        account_circle
      </span>
      <div className="session-card__info">
        <span className="session-card__label">Oturum</span>
        <span className="session-card__name">{username ?? 'Yükleniyor…'}</span>
      </div>
      <ApiHealthBadge />
    </div>
  )
}
