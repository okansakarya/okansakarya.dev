import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { Button } from '../Button/Button'
import './AppShell.css'

export type NavItem = {
  label: string
  to: string
  icon?: string
  exact?: boolean
  /** Extra path prefixes that should also mark this item active. */
  activePrefixes?: string[]
  /** Jump straight to the top of the page, including when already on this route. */
  scrollToTop?: boolean
}

type AppShellProps = {
  variant: 'public' | 'admin'
  navItems: NavItem[]
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

function isActive(pathname: string, hash: string, item: NavItem) {
  const [path, itemHash] = item.to.split('#')
  if (itemHash) {
    return pathname === path && hash === `#${itemHash}`
  }
  if (item.activePrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }
  if (item.exact) {
    return pathname === path && hash === ''
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <Link to="/" className="app-shell__brand" onClick={scrollToTop}>
      <img className="app-shell__logo" src={logo} alt="" width={44} height={44} decoding="async" />
      <span>
        <span className="app-shell__name">Okan Sakarya</span>
        <span className="app-shell__subtitle">{subtitle}</span>
      </span>
    </Link>
  )
}

export function AppShell({ variant, navItems, actions, footer, children }: AppShellProps) {
  const { pathname, hash } = useLocation()
  const isAdmin = variant === 'admin'

  const nav = (
    <nav className="app-shell__nav" aria-label={isAdmin ? 'Yönetim menüsü' : 'Ana menü'}>
      {navItems.map((item) => (
        <Button
          key={item.to}
          to={item.to}
          variant="ghost"
          size="sm"
          icon={item.icon}
          active={isActive(pathname, hash, item)}
          onClick={item.scrollToTop ? scrollToTop : undefined}
          block={isAdmin}
          className="app-shell__nav-item"
        >
          {item.label}
        </Button>
      ))}
    </nav>
  )

  if (isAdmin) {
    return (
      <div className="app-shell app-shell--admin">
        <aside className="app-shell__sidebar">
          <Brand subtitle="Yönetici Konsolu" />
          {nav}
          {actions && <div className="app-shell__sidebar-actions">{actions}</div>}
        </aside>
        <main className="app-shell__main">{children}</main>
      </div>
    )
  }

  return (
    <div className="app-shell app-shell--public">
      <header className="app-shell__header">
        <Brand subtitle="Software Developer" />
        {nav}
        {actions && <div className="app-shell__header-actions">{actions}</div>}
      </header>
      <main className="app-shell__main">{children}</main>
      {footer && <footer className="app-shell__footer">{footer}</footer>}
    </div>
  )
}
