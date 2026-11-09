import type { Asset, AssetKind } from './api'

const MEGABYTE = 1024 * 1024

export const ASSET_RULES: Record<AssetKind, { label: string; icon: string; maxBytes: number }> = {
  image: { label: 'Görsel', icon: 'image', maxBytes: 10 * MEGABYTE },
  video: { label: 'Video', icon: 'smart_display', maxBytes: 100 * MEGABYTE },
  apk: { label: 'APK', icon: 'android', maxBytes: 200 * MEGABYTE },
}

export const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,.apk'

export function detectAssetKind(file: File): AssetKind | null {
  if (file.name.toLowerCase().endsWith('.apk')) {
    return 'apk'
  }
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'image'
  }
  if (['video/mp4', 'video/webm'].includes(file.type)) {
    return 'video'
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < MEGABYTE) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / MEGABYTE).toFixed(1)} MB`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(iso))
}

export function assetsOfKind(assets: Asset[], kind: AssetKind): Asset[] {
  return assets.filter((asset) => asset.kind === kind)
}
