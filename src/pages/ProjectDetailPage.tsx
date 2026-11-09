import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useResource } from '../hooks/useResource'
import { ApiError, getPublishedProject } from '../lib/api'
import { ASSET_RULES, assetsOfKind, formatDate } from '../lib/assets'
import { AssetTile } from '../widgets/AssetTile/AssetTile'
import { Button } from '../widgets/Button/Button'
import { DownloadPod } from '../widgets/DownloadPod/DownloadPod'
import { GlassCard } from '../widgets/GlassCard/GlassCard'
import { StatusBadge } from '../widgets/StatusBadge/StatusBadge'
import { ErrorState, LoadingState, PageState } from './shared/PageState'
import './pages.css'

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const load = useCallback((signal: AbortSignal) => getPublishedProject(slug, signal), [slug])
  const project = useResource(load)

  if (project.status === 'loading') {
    return (
      <div className="page page--public">
        <LoadingState title="Proje yükleniyor…" />
      </div>
    )
  }

  if (project.status === 'error') {
    const notFound = project.error instanceof ApiError && project.error.status === 404
    return (
      <div className="page page--public">
        {notFound ? (
          <PageState
            icon="search_off"
            title="Proje bulunamadı"
            message="Aradığınız proje yayından kaldırılmış veya hiç var olmamış olabilir."
            action={
              <Button to="/" variant="ghost" icon="arrow_back">
                Projelere Dön
              </Button>
            }
          />
        ) : (
          <ErrorState error={project.error} onRetry={project.reload} />
        )}
      </div>
    )
  }

  const { data } = project
  const images = assetsOfKind(data.assets, 'image')
  const videos = assetsOfKind(data.assets, 'video')
  const apk = assetsOfKind(data.assets, 'apk')[0]

  return (
    <div className="page page--public">
      <section className="page-section">
        <div className="row">
          <Button to="/#projeler" variant="ghost" size="sm" icon="arrow_back">
            Projeler
          </Button>
          <StatusBadge tone="success" dot>
            Yayında
          </StatusBadge>
          <StatusBadge icon="update">Güncellendi: {formatDate(data.updated_at)}</StatusBadge>
        </div>
        <div className="page-heading">
          <div>
            <span className="page-heading__eyebrow">Proje Detayı</span>
            <h1 className="page-heading__title">{data.title}</h1>
            <p className="page-heading__lead preserve-lines">
              {data.description}
            </p>
          </div>
        </div>
        <div className="row">
          {(['image', 'video', 'apk'] as const).map((kind) => (
            <StatusBadge key={kind} icon={ASSET_RULES[kind].icon}>
              {assetsOfKind(data.assets, kind).length} {ASSET_RULES[kind].label}
            </StatusBadge>
          ))}
        </div>
      </section>

      {apk && (
        <GlassCard eyebrow="Doğrudan Dağıtım Kanalı" title="APK Paketini Cihazınıza Yükleyin" icon="install_mobile">
          <DownloadPod asset={apk} title="Doğrudan APK İndir" />
        </GlassCard>
      )}

      {videos.length > 0 && (
        <section className="page-section">
          <div className="page-heading">
            <div>
              <span className="page-heading__eyebrow">Tanıtım & Demo</span>
              <h2 className="page-heading__title">Videolar</h2>
            </div>
          </div>
          <div className="card-grid">
            {videos.map((asset) => (
              <AssetTile key={asset.id} asset={asset} />
            ))}
          </div>
        </section>
      )}

      {images.length > 0 && (
        <section className="page-section">
          <div className="page-heading">
            <div>
              <span className="page-heading__eyebrow">Arayüz & Etkileşim Galerisi</span>
              <h2 className="page-heading__title">Ekran Görüntüleri</h2>
            </div>
          </div>
          <div className="card-grid card-grid--dense">
            {images.map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                actions={
                  <Button href={asset.public_url} variant="ghost" size="sm" icon="open_in_new">
                    Tam Boyut
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {data.assets.length === 0 && (
        <PageState icon="perm_media" title="Bu proje için henüz medya eklenmedi" />
      )}
    </div>
  )
}
