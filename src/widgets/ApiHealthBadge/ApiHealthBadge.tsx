import { useEffect, useState } from 'react'
import { getHealth } from '../../lib/api'
import { StatusBadge } from '../StatusBadge/StatusBadge'

const POLL_INTERVAL_MS = 30_000

type HealthState = 'checking' | 'up' | 'down'

const LABELS: Record<HealthState, string> = {
  checking: 'API kontrol ediliyor',
  up: 'API çalışıyor',
  down: 'API ulaşılamıyor',
}

export function ApiHealthBadge() {
  const [state, setState] = useState<HealthState>('checking')

  useEffect(() => {
    let controller = new AbortController()

    function check() {
      controller.abort()
      const current = new AbortController()
      controller = current
      getHealth(current.signal)
        .then((response) => setState(response?.status === 'ok' ? 'up' : 'down'))
        .catch(() => {
          if (!current.signal.aborted) {
            setState('down')
          }
        })
    }

    check()
    const interval = window.setInterval(check, POLL_INTERVAL_MS)
    return () => {
      window.clearInterval(interval)
      controller.abort()
    }
  }, [])

  const tone = state === 'up' ? 'success' : state === 'down' ? 'danger' : 'neutral'

  return (
    <span role="status" aria-live="polite">
      <StatusBadge tone={tone} dot>
        {LABELS[state]}
      </StatusBadge>
    </span>
  )
}
