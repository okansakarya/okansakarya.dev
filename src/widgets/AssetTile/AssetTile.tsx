import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Asset } from '../../lib/api'
import { ASSET_RULES, formatBytes, formatDate } from '../../lib/assets'
import { GlassCard } from '../GlassCard/GlassCard'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './AssetTile.css'

type AssetTileProps = {
  asset: Asset
  caption?: ReactNode
  actions?: ReactNode
}

function AssetPreview({ asset }: { asset: Asset }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="asset-tile__fallback" role="img" aria-label="Önizleme yüklenemedi">
        <span className="material-symbols-outlined" aria-hidden="true">
          broken_image
        </span>
        Önizleme yüklenemedi
      </span>
    )
  }
  if (asset.kind === 'image') {
    return (
      <img
        src={asset.public_url}
        alt={asset.original_filename}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    )
  }
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.public_url}
        controls
        preload="metadata"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span className="material-symbols-outlined" aria-hidden="true">
      android
    </span>
  )
}

export function AssetTile({ asset, caption, actions }: AssetTileProps) {
  const rule = ASSET_RULES[asset.kind]

  return (
    <GlassCard as="article" padding="none" interactive className="asset-tile">
      <div className={`asset-tile__preview asset-tile__preview--${asset.kind}`}>
        <AssetPreview asset={asset} />
        <span className="asset-tile__kind">
          <StatusBadge tone="info" icon={rule.icon}>
            {rule.label}
          </StatusBadge>
        </span>
      </div>
      <div className="asset-tile__body">
        <p className="asset-tile__name" title={asset.original_filename}>
          {asset.original_filename}
        </p>
        <p className="asset-tile__meta">
          {formatBytes(asset.size_bytes)} • {formatDate(asset.created_at)}
        </p>
        {caption && <div className="asset-tile__caption">{caption}</div>}
        {actions && <div className="asset-tile__actions">{actions}</div>}
      </div>
    </GlassCard>
  )
}
