import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useResource } from '../../hooks/useResource'
import { deleteAsset, deleteProject, getAdminProject, updateProject, uploadAsset } from '../../lib/api'
import type { AssetKind, Project, ProjectUpdate } from '../../lib/api'
import { ASSET_RULES, UPLOAD_ACCEPT, detectAssetKind, formatBytes } from '../../lib/assets'
import { AssetTile } from '../../widgets/AssetTile/AssetTile'
import { Button } from '../../widgets/Button/Button'
import { FileDropzone } from '../../widgets/FileDropzone/FileDropzone'
import { GlassCard } from '../../widgets/GlassCard/GlassCard'
import { StatusBadge } from '../../widgets/StatusBadge/StatusBadge'
import { TextField } from '../../widgets/TextField/TextField'
import { ErrorState, LoadingState } from '../shared/PageState'
import '../pages.css'
import './admin.css'

type UploadItem = {
  id: string
  name: string
  size: number
  kind: AssetKind | null
  progress: number
  status: 'queued' | 'uploading' | 'done' | 'error'
  message?: string
}

function ProjectDetailsForm({
  project,
  onSaved,
}: {
  project: Project
  onSaved: (project: Project) => void
}) {
  const { authorized } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState(project.title)
  const [slug, setSlug] = useState(project.slug)
  const [description, setDescription] = useState(project.description)
  const [savingAction, setSavingAction] = useState<'details' | 'publish' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  async function save(changes: ProjectUpdate, action: 'details' | 'publish') {
    setSavingAction(action)
    setMessage(null)
    try {
      const updated = await authorized((token) => updateProject(token, project.id, changes))
      onSaved(updated)
      setMessage({ tone: 'success', text: 'Değişiklikler kaydedildi.' })
    } catch (caught) {
      setMessage({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Kaydetme başarısız.',
      })
    } finally {
      setSavingAction(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const changes: ProjectUpdate = {}
    if (title !== project.title) changes.title = title
    if (slug !== project.slug) changes.slug = slug
    if (description !== project.description) changes.description = description
    if (Object.keys(changes).length === 0) {
      setMessage({ tone: 'success', text: 'Kaydedilecek değişiklik yok.' })
      return
    }
    void save(changes, 'details')
  }

  async function handleDelete() {
    if (!window.confirm(`"${project.title}" projesi ve tüm dosyaları silinsin mi?`)) {
      return
    }
    setDeleting(true)
    try {
      await authorized((token) => deleteProject(token, project.id))
      navigate('/admin', { replace: true })
    } catch (caught) {
      setDeleting(false)
      setMessage({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Silme başarısız.',
      })
    }
  }

  return (
    <GlassCard
      eyebrow="Proje Bilgileri"
      title={project.title}
      icon="edit_note"
      actions={
        <StatusBadge tone={project.is_published ? 'success' : 'neutral'} dot>
          {project.is_published ? 'Yayında' : 'Taslak'}
        </StatusBadge>
      }
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <TextField
          label="Başlık"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
        <TextField
          label="Slug"
          hint={`Herkese açık adres: /projects/${slug || '…'}`}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxLength={200}
          required
        />
        <div className="span-2">
          <TextField
            multiline
            label="Açıklama"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={20000}
            required
          />
        </div>
        {message && (
          <p className={`form-message form-message--${message.tone} span-2`} role="status">
            {message.text}
          </p>
        )}
        <div className="span-2 row">
          <Button
            type="submit"
            icon="save"
            loading={savingAction === 'details'}
            disabled={savingAction !== null}
          >
            Kaydet
          </Button>
          <Button
            variant="ghost"
            icon={project.is_published ? 'visibility_off' : 'publish'}
            loading={savingAction === 'publish'}
            disabled={savingAction !== null}
            onClick={() => save({ is_published: !project.is_published }, 'publish')}
          >
            {project.is_published ? 'Yayından Kaldır' : 'Yayınla'}
          </Button>
          <Button variant="danger" icon="delete" loading={deleting} onClick={handleDelete}>
            Projeyi Sil
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}

export function AdminProjectEditPage() {
  const { id = '' } = useParams()
  const { authorized } = useAuth()
  const load = useCallback(
    (signal: AbortSignal) => authorized((token) => getAdminProject(token, id, signal)),
    [authorized, id],
  )
  const project = useResource(load)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
  const [assetError, setAssetError] = useState<string | null>(null)

  const patchUpload = (uploadId: string, patch: Partial<UploadItem>) =>
    setUploads((items) => items.map((item) => (item.id === uploadId ? { ...item, ...patch } : item)))

  async function handleFiles(files: File[]) {
    const queued: UploadItem[] = files.map((file) => {
      const kind = detectAssetKind(file)
      const base = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        kind,
        progress: 0,
      }
      if (!kind) {
        return { ...base, status: 'error', message: 'Desteklenmeyen dosya türü.' }
      }
      if (file.size > ASSET_RULES[kind].maxBytes) {
        return {
          ...base,
          status: 'error',
          message: `${ASSET_RULES[kind].label} en fazla ${formatBytes(ASSET_RULES[kind].maxBytes)} olabilir.`,
        }
      }
      return { ...base, status: 'queued' }
    })
    setUploads((items) => [...queued, ...items])

    for (const [index, item] of queued.entries()) {
      if (item.status !== 'queued' || !item.kind) {
        continue
      }
      const kind = item.kind
      patchUpload(item.id, { status: 'uploading' })
      try {
        const asset = await authorized((token) =>
          uploadAsset(token, id, kind, files[index], (progress) =>
            patchUpload(item.id, { progress }),
          ),
        )
        patchUpload(item.id, { status: 'done', progress: 1 })
        project.setData((current) => ({ ...current, assets: [...current.assets, asset] }))
      } catch (caught) {
        patchUpload(item.id, {
          status: 'error',
          message: caught instanceof Error ? caught.message : 'Yükleme başarısız.',
        })
      }
    }
  }

  async function handleDeleteAsset(assetId: string, filename: string) {
    if (project.status !== 'success' || !window.confirm(`"${filename}" silinsin mi?`)) {
      return
    }
    setDeletingAssetId(assetId)
    setAssetError(null)
    try {
      await authorized((token) => deleteAsset(token, id, assetId))
      project.setData((current) => ({
        ...current,
        assets: current.assets.filter((asset) => asset.id !== assetId),
      }))
    } catch (caught) {
      setAssetError(caught instanceof Error ? caught.message : 'Dosya silinemedi.')
    } finally {
      setDeletingAssetId(null)
    }
  }

  if (project.status === 'loading') {
    return <LoadingState title="Proje yükleniyor…" />
  }
  if (project.status === 'error') {
    return <ErrorState error={project.error} onRetry={project.reload} />
  }

  const { data } = project
  const hasApk = data.assets.some((asset) => asset.kind === 'apk')

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="page-heading__eyebrow">Proje Yönetimi</span>
          <h1 className="page-heading__title">{data.title}</h1>
        </div>
        <div className="page-heading__actions">
          <Button to="/admin" variant="ghost" icon="arrow_back">
            Projeler
          </Button>
          {data.is_published && (
            <Button to={`/projects/${data.slug}`} variant="ghost" icon="open_in_new">
              Sayfayı Gör
            </Button>
          )}
        </div>
      </div>

      <ProjectDetailsForm key={data.id} project={data} onSaved={project.setData} />

      <GlassCard eyebrow="Cloudflare R2" title="Medya & APK Yükleme Alanı" icon="cloud_upload">
        <FileDropzone
          title="Görselleri, videoları veya APK dosyasını buraya sürükleyin"
          hint={`Görsel: JPEG, PNG, WebP (10 MB) • Video: MP4, WebM (100 MB) • APK: tek paket (200 MB)${
            hasApk ? ' — Bu projede zaten bir APK var, yenisi için önce mevcut olanı silin.' : ''
          }`}
          accept={UPLOAD_ACCEPT}
          onFiles={handleFiles}
        >
          {uploads.map((item) => (
            <div key={item.id} className={`upload-row upload-row--${item.status}`}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {item.kind ? ASSET_RULES[item.kind].icon : 'help'}
              </span>
              <div className="upload-row__info">
                <p className="upload-row__name">{item.name}</p>
                <p className="upload-row__meta">
                  {item.message ?? `${formatBytes(item.size)} • %${Math.round(item.progress * 100)}`}
                </p>
                <div className="upload-row__bar" aria-hidden="true">
                  <span style={{ width: `${Math.round(item.progress * 100)}%` }} />
                </div>
              </div>
              <StatusBadge
                tone={
                  item.status === 'done' ? 'success' : item.status === 'error' ? 'danger' : 'info'
                }
              >
                {
                  {
                    queued: 'Sırada',
                    uploading: 'Yükleniyor',
                    done: 'Tamamlandı',
                    error: 'Hata',
                  }[item.status]
                }
              </StatusBadge>
            </div>
          ))}
        </FileDropzone>
      </GlassCard>

      <section className="page-section">
        <div className="page-heading">
          <div>
            <h2 className="page-heading__title">Yüklenen Varlıklar ({data.assets.length})</h2>
          </div>
          <div className="page-heading__actions">
            <Button to="/admin/gallery" variant="ghost" size="sm" icon="perm_media">
              Galeriye Git
            </Button>
          </div>
        </div>
        {assetError && (
          <p className="form-message form-message--error" role="alert">
            {assetError}
          </p>
        )}
        {data.assets.length === 0 ? (
          <p className="stat-caption">Bu projeye henüz dosya yüklenmedi.</p>
        ) : (
          <div className="card-grid card-grid--dense">
            {data.assets.map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                actions={
                  <>
                    <Button href={asset.public_url} variant="ghost" size="sm" icon="open_in_new">
                      Aç
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon="delete"
                      loading={deletingAssetId === asset.id}
                      onClick={() => handleDeleteAsset(asset.id, asset.original_filename)}
                    >
                      Sil
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
