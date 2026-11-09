import type { Asset } from '../../lib/api'
import { ASSET_RULES, formatBytes, formatDate } from '../../lib/assets'
import { Button } from '../Button/Button'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './DownloadPod.css'

type DownloadPodProps = {
  asset: Asset
  title?: string
  description?: string
}

export function DownloadPod({ asset, title, description }: DownloadPodProps) {
  const rule = ASSET_RULES[asset.kind]

  return (
    <div className={`download-pod download-pod--${asset.kind}`}>
      <span className="download-pod__icon material-symbols-outlined" aria-hidden="true">
        {rule.icon}
      </span>
      <div className="download-pod__info">
        <StatusBadge tone="success" icon="verified">
          {rule.label}
        </StatusBadge>
        <p className="download-pod__title">{title ?? asset.original_filename}</p>
        <p className="download-pod__meta">
          {description ?? `${formatBytes(asset.size_bytes)} • ${formatDate(asset.created_at)}`}
        </p>
      </div>
      <Button href={asset.public_url} download icon="download">
        {`${rule.label} İndir`}
      </Button>
    </div>
  )
}
