import { useEffect } from 'react'

export const SITE_ORIGIN = 'https://www.okansakarya.dev'
export const SITE_NAME = 'Okan Sakarya'
export const DEFAULT_TITLE = 'Okan Sakarya | Edirne’de Yazılım Geliştirme'
export const DEFAULT_DESCRIPTION =
  'Edirne’de yazılım geliştirme alanında çalışan Okan Sakarya. Flutter ve modern web teknolojileriyle mobil uygulamalar ve web çözümleri geliştiriyorum.'

type PageMeta = {
  title?: string
  description?: string
  path?: string
  index?: boolean
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

export function toMetaDescription(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 160) {
    return normalized
  }
  return `${normalized.slice(0, 157).trimEnd()}...`
}

/** Updates the document head after navigation. The homepage defaults also live in index.html. */
export function usePageMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  index = true,
}: PageMeta = {}) {
  useEffect(() => {
    const url = new URL(path, SITE_ORIGIN).href
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', index ? 'index, follow' : 'noindex, nofollow')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertCanonical(url)
  }, [title, description, path, index])
}
