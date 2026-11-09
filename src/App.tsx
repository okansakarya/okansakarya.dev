import { useLayoutEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { AdminBansPage } from './pages/admin/AdminBansPage'
import { AdminGalleryPage } from './pages/admin/AdminGalleryPage'
import { AdminProjectEditPage } from './pages/admin/AdminProjectEditPage'
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage'
import { LoginPage } from './pages/LoginPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { PageState } from './pages/shared/PageState'
import { AppShell } from './widgets/AppShell/AppShell'
import type { NavItem } from './widgets/AppShell/AppShell'
import { Button } from './widgets/Button/Button'
import { SessionCard } from './widgets/SessionCard/SessionCard'
import { SocialLinks } from './widgets/SocialLinks/SocialLinks'

const CURRENT_YEAR = new Date().getFullYear()

const PUBLIC_NAV: NavItem[] = [
  { label: 'Anasayfa', to: '/', exact: true, scrollToTop: true },
  { label: 'Projeler', to: '/#projeler' },
  { label: 'İletişim', to: '/#iletisim' },
]

const ADMIN_NAV: NavItem[] = [
  {
    label: 'Proje Yönetimi',
    to: '/admin',
    icon: 'terminal',
    exact: true,
    activePrefixes: ['/admin/projects/'],
  },
  { label: 'Medya & Galeri', to: '/admin/gallery', icon: 'perm_media' },
  { label: 'IP Banları', to: '/admin/bans', icon: 'shield' },
]

function PublicLayout() {
  const { isAuthenticated } = useAuth()
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (pathname === '/' && hash === '') {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }, [pathname, hash])

  return (
    <AppShell
      variant="public"
      navItems={PUBLIC_NAV}
      actions={
        <Button to={isAuthenticated ? '/admin' : '/login'} variant="ghost" size="sm" icon="lock_open">
          {isAuthenticated ? 'Yönetim Paneli' : 'Admin Girişi'}
        </Button>
      }
      footer={
        <>
          <span>© {CURRENT_YEAR} Okan Sakarya. Tüm hakları saklıdır.</span>
          <SocialLinks size="sm" />
        </>
      }
    >
      <Outlet />
    </AppShell>
  )
}

function AdminLayout() {
  const { admin, signOut } = useAuth()

  return (
    <RequireAuth>
      <AppShell
        variant="admin"
        navItems={ADMIN_NAV}
        actions={
          <>
            <SessionCard username={admin?.username ?? null} />
            <Button to="/" variant="ghost" size="sm" icon="arrow_back" block>
              Portfolyoya Dön
            </Button>
            <Button variant="danger" size="sm" icon="logout" block onClick={signOut}>
              Çıkış Yap
            </Button>
          </>
        }
      >
        <Outlet />
      </AppShell>
    </RequireAuth>
  )
}

function NotFoundPage() {
  return (
    <div className="page page--public">
      <PageState
        icon="explore_off"
        title="Sayfa bulunamadı"
        action={
          <Button to="/" variant="ghost" icon="home">
            Ana Sayfa
          </Button>
        }
      />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<PortfolioPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminProjectsPage />} />
        <Route path="projects/:id" element={<AdminProjectEditPage />} />
        <Route path="gallery" element={<AdminGalleryPage />} />
        <Route path="bans" element={<AdminBansPage />} />
      </Route>
    </Routes>
  )
}
