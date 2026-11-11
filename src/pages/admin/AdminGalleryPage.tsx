import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useResource } from '../../hooks/useResource'
import { listAdminProjects } from '../../lib/api'
import type { AssetKind } from '../../lib/api'
import { ASSET_RULES, formatBytes } from '../../lib/assets'
import { AssetTile } from '../../widgets/AssetTile/AssetTile'
import { Button } from '../../widgets/Button/Button'
import { GlassCard } from '../../widgets/GlassCard/GlassCard'
import { ErrorState, LoadingState, PageState } from '../shared/PageState'
import '../pages.css'

type Filter = 'all' | AssetKind

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'image', label: 'Görseller' },
  { value: 'video', label: 'Videolar' },
  { value: 'apk', label: 'APK' },
]

export function AdminGalleryPage() {
  const { authorized } = useAuth()
  const load = useCallback(
    (signal: AbortSignal) => authorized(() => listAdminProjects(signal)),
    [authorized],
  )
  const projects = useResource(load)
  const [filter, setFilter] = useState<Filter>('all')
  const [copyResult, setCopyResult] = useState<{ id: string; ok: boolean } | null>(null)

  const entries = useMemo(
    () =>
      (projects.data ?? [])
        .flatMap((project) => project.assets.map((asset) => ({ asset, project })))
        .sort((a, b) => b.asset.created_at.localeCompare(a.asset.created_at)),
    [projects.data],
  )
  const visible = filter === 'all' ? entries : entries.filter(({ asset }) => asset.kind === filter)
  const totalBytes = entries.reduce((sum, { asset }) => sum + asset.size_bytes, 0)

  async function copyLink(assetId: string, url: string) {
    let ok = true
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      ok = false
    }
    setCopyResult({ id: assetId, ok })
    window.setTimeout(
      () => setCopyResult((current) => (current?.id === assetId ? null : current)),
      2000,
    )
  }

  function copyLabel(assetId: string) {
    if (copyResult?.id !== assetId) {
      return { icon: 'content_copy', text: '1 Saatlik Link' }
    }
    return copyResult.ok
      ? { icon: 'check_circle', text: 'Kopyalandı' }
      : { icon: 'error', text: 'Kopyalanamadı' }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="page-heading__eyebrow">Cloudflare R2</span>
          <h1 className="page-heading__title">Medya & Video Galerisi</h1>
          <p className="page-heading__lead">
            Tüm projelere yüklenen görsel, video ve APK dosyaları. Yeni yükleme proje sayfasından
            yapılır. Dosyalar özel bucket’ta durur; kopyalanan linkler 1 saat geçerlidir.
          </p>
        </div>
        <div className="page-heading__actions">
          <Button variant="ghost" icon="sync" onClick={projects.reload}>
            Yenile
          </Button>
        </div>
      </div>

      {projects.status === 'loading' && <LoadingState title="Medya yükleniyor…" />}
      {projects.status === 'error' && <ErrorState error={projects.error} onRetry={projects.reload} />}

      {projects.status === 'success' && (
        <>
          <div className="stat-grid">
            <GlassCard eyebrow="Toplam Varlık" icon="perm_media" padding="md">
              <p className="stat-value">{entries.length}</p>
            </GlassCard>
            <GlassCard eyebrow="Depolama Kullanımı" icon="cloud_sync" padding="md">
              <p className="stat-value">{formatBytes(totalBytes)}</p>
            </GlassCard>
          </div>

          <div className="row" role="toolbar" aria-label="Dosya türü filtresi">
            {FILTERS.map((option) => {
              const count =
                option.value === 'all'
                  ? entries.length
                  : entries.filter(({ asset }) => asset.kind === option.value).length
              return (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  icon={option.value === 'all' ? 'apps' : ASSET_RULES[option.value].icon}
                  active={filter === option.value}
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                >
                  {`${option.label} (${count})`}
                </Button>
              )
            })}
          </div>

          {visible.length === 0 ? (
            <PageState
              icon="photo_library"
              title="Bu filtrede dosya yok"
              message="Bir projeye girip medya yüklediğinizde burada görünür."
              action={
                <Button to="/admin" variant="ghost" icon="terminal">
                  Projelere Git
                </Button>
              }
            />
          ) : (
            <div className="card-grid card-grid--dense">
              {visible.map(({ asset, project }) => (
                <AssetTile
                  key={asset.id}
                  asset={asset}
                  caption={`Proje: ${project.title}`}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={copyLabel(asset.id).icon}
                        onClick={() => copyLink(asset.id, asset.public_url)}
                      >
                        {copyLabel(asset.id).text}
                      </Button>
                      <Button to={`/admin/projects/${project.id}`} variant="ghost" size="sm" icon="edit">
                        Proje
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
