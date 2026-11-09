import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { profile } from '../content/profile'
import { useResource } from '../hooks/useResource'
import { listPublishedProjects } from '../lib/api'
import { Button } from '../widgets/Button/Button'
import { GlassCard } from '../widgets/GlassCard/GlassCard'
import { ProjectCard } from '../widgets/ProjectCard/ProjectCard'
import { StatusBadge } from '../widgets/StatusBadge/StatusBadge'
import { SocialLinks } from '../widgets/SocialLinks/SocialLinks'
import { TechMarquee } from '../widgets/TechMarquee/TechMarquee'
import { ErrorState, LoadingState, PageState } from './shared/PageState'
import './pages.css'
import './PortfolioPage.css'

export function PortfolioPage() {
  const projects = useResource(listPublishedProjects)
  const { hash } = useLocation()

  useEffect(() => {
    if (hash && projects.status !== 'loading') {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hash, projects.status])

  return (
    <div className="page page--public">
      <section className="hero">
        <StatusBadge tone="success" dot>
          {profile.availability}
        </StatusBadge>
        <h1 className="hero__title">
          {profile.headline[0]} <span className="hero__accent">{profile.headline[1]}</span>{' '}
          {profile.headline[2]}
        </h1>
        <p className="hero__intro">
          Merhaba, ben <strong>{profile.name}</strong>. {profile.intro}
        </p>
        <div className="row">
          <Button to="/#projeler" icon="arrow_downward">
            Projeleri Gör
          </Button>
          <Button href={`mailto:${profile.email}`} variant="ghost" icon="mail">
            İletişime Geç
          </Button>
        </div>
        <ul className="hero__highlights">
          {profile.highlights.map((item) => (
            <li key={item.label}>
              <StatusBadge icon={item.icon}>{item.label}</StatusBadge>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-section" aria-labelledby="teknolojiler">
        <h2 id="teknolojiler" className="page-heading__eyebrow">
          Kullandığım Teknolojiler
        </h2>
        <TechMarquee items={profile.technologies} label="Kullandığım teknolojiler" />
      </section>

      <section id="projeler" className="page-section">
        <div className="page-heading">
          <div>
            <span className="page-heading__eyebrow">Portföy & Çalışmalar</span>
            <h2 className="page-heading__title">Öne Çıkan Projeler</h2>
            <p className="page-heading__lead">
              Geliştirdiğim mobil, yapay zeka ve web uygulamaları.
            </p>
          </div>
        </div>

        {projects.status === 'loading' && <LoadingState title="Projeler yükleniyor…" />}
        {projects.status === 'error' && (
          <ErrorState error={projects.error} onRetry={projects.reload} />
        )}
        {projects.status === 'success' && projects.data.length === 0 && (
          <PageState
            icon="inventory_2"
            title="Henüz yayınlanmış proje yok"
            message="Yeni projeler yakında burada olacak."
          />
        )}
        {projects.status === 'success' && projects.data.length > 0 && (
          <div className="card-grid">
            {projects.data.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                detailPath={`/projects/${project.slug}`}
              />
            ))}
          </div>
        )}
      </section>

      <section id="iletisim" className="page-section page-section--contact">
        <div className="page-heading">
          <div>
            <span className="page-heading__eyebrow">İletişim</span>
            <h2 className="page-heading__title">Birlikte Harika Şeyler Üretelim</h2>
            <p className="page-heading__lead">
              Mobil veya full-stack geliştirme fırsatları, ekip arkadaşlığı ya da yeni bir proje fikri
              için her zaman bana ulaşabilirsiniz.
            </p>
          </div>
        </div>
        <GlassCard as="div">
          <div className="contact-actions">
            <Button href={`mailto:${profile.email}`} icon="mail">
              {profile.email}
            </Button>
            <SocialLinks />
            <StatusBadge icon="location_on">{profile.location}</StatusBadge>
          </div>
        </GlassCard>
      </section>

      <section className="page-section" aria-labelledby="hakkimda">
        <div className="page-heading">
          <div>
            <h2 id="hakkimda" className="page-heading__title">
              Hakkımda
            </h2>
          </div>
        </div>
        <div className="about-list">
          {profile.about.map((item) => (
            <details key={item.question} className="about-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <div className="home-scroll-room" aria-hidden="true" />
    </div>
  )
}
