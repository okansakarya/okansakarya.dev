import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Project } from '../../lib/api'
import { ASSET_RULES, assetsOfKind } from '../../lib/assets'
import { Button } from '../Button/Button'
import { GlassCard } from '../GlassCard/GlassCard'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import './ProjectCard.css'

type ProjectCardProps = {
  project: Project
  detailPath: string
  showStatus?: boolean
  actions?: ReactNode
}

export function ProjectCard({ project, detailPath, showStatus, actions }: ProjectCardProps) {
  const [coverFailed, setCoverFailed] = useState(false)
  const cover = coverFailed ? undefined : assetsOfKind(project.assets, 'image')[0]
  const apk = assetsOfKind(project.assets, 'apk')[0]
  const counts = (['image', 'video', 'apk'] as const)
    .map((kind) => ({ kind, count: assetsOfKind(project.assets, kind).length }))
    .filter(({ count }) => count > 0)

  return (
    <GlassCard as="article" padding="none" interactive className="project-card">
      <div className="project-card__cover">
        {cover ? (
          <img
            src={cover.public_url}
            alt=""
            loading="lazy"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <span className="material-symbols-outlined" aria-hidden="true">
            terminal
          </span>
        )}
      </div>

      <div className="project-card__body">
        {showStatus && (
          <StatusBadge tone={project.is_published ? 'success' : 'neutral'} dot>
            {project.is_published ? 'Yayında' : 'Taslak'}
          </StatusBadge>
        )}
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__description">{project.description}</p>
      </div>

      <footer className="project-card__footer">
        {counts.length > 0 && (
          <div className="project-card__counts">
            {counts.map(({ kind, count }) => (
              <StatusBadge key={kind} icon={ASSET_RULES[kind].icon}>
                {count} {ASSET_RULES[kind].label}
              </StatusBadge>
            ))}
          </div>
        )}
        <div className="project-card__actions">
          {actions ?? (
            <>
              <Button to={detailPath} size="sm" icon="arrow_forward">
                Detay
              </Button>
              {apk && (
                <Button href={apk.public_url} download variant="ghost" size="sm" icon="download">
                  APK İndir
                </Button>
              )}
            </>
          )}
        </div>
      </footer>
    </GlassCard>
  )
}
