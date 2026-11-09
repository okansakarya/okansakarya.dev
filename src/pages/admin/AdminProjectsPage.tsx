import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useResource } from '../../hooks/useResource'
import { createProject, listAdminProjects, updateProject } from '../../lib/api'
import type { Project } from '../../lib/api'
import { assetsOfKind } from '../../lib/assets'
import { Button } from '../../widgets/Button/Button'
import { GlassCard } from '../../widgets/GlassCard/GlassCard'
import { ProjectCard } from '../../widgets/ProjectCard/ProjectCard'
import { TextField } from '../../widgets/TextField/TextField'
import { ErrorState, LoadingState, PageState } from '../shared/PageState'
import '../pages.css'

function ProjectStats({ projects }: { projects: Project[] }) {
  const assets = projects.flatMap((project) => project.assets)
  const stats = [
    { icon: 'terminal', label: 'Toplam Proje', value: projects.length },
    {
      icon: 'public',
      label: 'Yayınlanan Proje',
      value: projects.filter((project) => project.is_published).length,
    },
    { icon: 'android', label: 'APK Paketi', value: assetsOfKind(assets, 'apk').length },
    {
      icon: 'perm_media',
      label: 'Medya Varlığı',
      value: assets.length - assetsOfKind(assets, 'apk').length,
    },
  ]

  return (
    <div className="stat-grid">
      {stats.map((stat) => (
        <GlassCard key={stat.label} eyebrow={stat.label} icon={stat.icon} padding="md">
          <p className="stat-value">{stat.value}</p>
        </GlassCard>
      ))}
    </div>
  )
}

function CreateProjectForm({ onCreated }: { onCreated: (project: Project) => void }) {
  const { authorized } = useAuth()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const project = await authorized((token) =>
        createProject(token, { title, description, slug: slug.trim() || undefined }),
      )
      onCreated(project)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Proje oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GlassCard eyebrow="Yeni Kayıt" title="Yeni Proje Ekle" icon="add_circle">
      <form className="form-grid" onSubmit={handleSubmit}>
        <TextField
          label="Başlık"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
        <TextField
          label="Slug (opsiyonel)"
          hint="Boş bırakılırsa başlıktan üretilir. Örnek: aura-health"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxLength={200}
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
        {error && (
          <p className="form-message form-message--error span-2" role="alert">
            {error}
          </p>
        )}
        <div className="span-2 row">
          <Button
            type="submit"
            icon="add"
            loading={submitting}
            disabled={!title.trim() || !description.trim()}
          >
            Projeyi Oluştur
          </Button>
          <span className="stat-caption">Yeni projeler taslak olarak oluşturulur.</span>
        </div>
      </form>
    </GlassCard>
  )
}

export function AdminProjectsPage() {
  const { authorized } = useAuth()
  const navigate = useNavigate()
  const load = useCallback(
    (signal: AbortSignal) => authorized((token) => listAdminProjects(token, signal)),
    [authorized],
  )
  const projects = useResource(load)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function togglePublished(project: Project) {
    setPendingId(project.id)
    setActionError(null)
    try {
      const updated = await authorized((token) =>
        updateProject(token, project.id, { is_published: !project.is_published }),
      )
      projects.setData((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Güncelleme başarısız.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="page-heading__eyebrow">Kontrol Paneli</span>
          <h1 className="page-heading__title">Proje & Medya Yönetim Merkezi</h1>
          <p className="page-heading__lead">
            Portföy projeleri, APK paketleri ve görsel/video varlıklarını buradan yönetin.
          </p>
        </div>
        <div className="page-heading__actions">
          <Button variant="ghost" icon="sync" onClick={projects.reload}>
            Yenile
          </Button>
        </div>
      </div>

      {projects.status === 'success' && <ProjectStats projects={projects.data} />}

      <CreateProjectForm onCreated={(project) => navigate(`/admin/projects/${project.id}`)} />

      <section className="page-section">
        <div className="page-heading">
          <div>
            <h2 className="page-heading__title">Mevcut Projeler</h2>
            <p className="page-heading__lead">Yayın durumunu değiştirin veya medya yükleyin.</p>
          </div>
        </div>
        {actionError && (
          <p className="form-message form-message--error" role="alert">
            {actionError}
          </p>
        )}
        {projects.status === 'loading' && <LoadingState title="Projeler yükleniyor…" />}
        {projects.status === 'error' && (
          <ErrorState error={projects.error} onRetry={projects.reload} />
        )}
        {projects.status === 'success' && projects.data.length === 0 && (
          <PageState
            icon="inventory_2"
            title="Henüz proje yok"
            message="Yukarıdaki formla ilk projenizi oluşturun."
          />
        )}
        {projects.status === 'success' && projects.data.length > 0 && (
          <div className="card-grid">
            {projects.data.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                detailPath={`/admin/projects/${project.id}`}
                showStatus
                actions={
                  <>
                    <Button to={`/admin/projects/${project.id}`} size="sm" icon="edit">
                      Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={project.is_published ? 'visibility_off' : 'publish'}
                      loading={pendingId === project.id}
                      onClick={() => togglePublished(project)}
                    >
                      {project.is_published ? 'Yayından Kaldır' : 'Yayınla'}
                    </Button>
                    {project.is_published && (
                      <Button
                        to={`/projects/${project.slug}`}
                        variant="ghost"
                        size="sm"
                        icon="open_in_new"
                        aria-label={`${project.title} sayfasını görüntüle`}
                      />
                    )}
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
