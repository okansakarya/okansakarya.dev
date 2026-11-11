import { FunctionsHttpError } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type AssetKind = 'image' | 'video' | 'apk'

export type Asset = {
  id: string
  kind: AssetKind
  object_key: string
  /** Presigned R2 URL; valid for one hour after the data is loaded. */
  public_url: string
  original_filename: string
  content_type: string
  size_bytes: number
  created_at: string
}

export type Project = {
  id: string
  title: string
  slug: string
  description: string
  is_published: boolean
  created_at: string
  updated_at: string
  assets: Asset[]
}

export type ProjectCreate = {
  title: string
  description: string
  slug?: string
  is_published?: boolean
}

export type ProjectUpdate = Partial<ProjectCreate>

export type HealthResponse = { status: 'ok' }

export type AdminProfile = {
  id: string
  username: string
}

export type IpBan = {
  id: string
  ip_address: string
  reason: string
  expires_at: string
  created_at: string
}

export type IpBanCreate = {
  ip_address: string
  reason: string
  duration_minutes: number
}

export const MAX_BAN_MINUTES = 30 * 24 * 60

const APK_CONTENT_TYPE = 'application/vnd.android.package-archive'
const SIGN_FUNCTION = 'r2-sign'
const ASSET_COLUMNS = 'id, kind, object_key, original_filename, content_type, size_bytes, created_at'
const PROJECT_COLUMNS = `id, title, slug, description, is_published, created_at, updated_at, assets(${ASSET_COLUMNS})`

type AssetRow = Omit<Asset, 'public_url'>
type ProjectRow = Omit<Project, 'assets'> & { assets: AssetRow[] }

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  projects_slug_key: 'Bu slug başka bir projede kullanılıyor.',
  assets_one_apk_per_project_idx: 'Bu projede zaten bir APK var. Yenisi için önce mevcut olanı silin.',
  ip_bans_max_duration: 'Ban süresi 1 dakika ile 30 gün arasında olmalı.',
}

function toApiError(error: PostgrestError): ApiError {
  const constraint = Object.keys(CONSTRAINT_MESSAGES).find((name) => error.message.includes(name))
  if (constraint) {
    return new ApiError(error.code === '23505' ? 409 : 422, CONSTRAINT_MESSAGES[constraint])
  }
  switch (error.code) {
    case 'PGRST116':
      return new ApiError(404, 'Kayıt bulunamadı.')
    case '22P02':
      return new ApiError(422, 'Geçersiz değer. IP adresini kontrol edin.')
    case '23514':
      return new ApiError(422, 'Girilen değerler kurallara uymuyor.')
    case '42501':
    case 'PGRST301':
    case 'PGRST303':
      return new ApiError(401, 'Oturum süresi doldu, lütfen tekrar giriş yapın.')
    default:
      return new ApiError(500, error.message)
  }
}

function unwrap<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    throw toApiError(result.error)
  }
  return result.data as T
}

async function invokeSign<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(SIGN_FUNCTION, { body, signal })
  if (!error) {
    return data as T
  }
  if (signal?.aborted) {
    throw error
  }
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(response.status, payload?.error ?? `İstek başarısız oldu (HTTP ${response.status})`)
  }
  throw new ApiError(0, 'Dosya sunucusuna ulaşılamadı.')
}

async function signDownloads(keys: string[], signal?: AbortSignal): Promise<Record<string, string>> {
  if (keys.length === 0) {
    return {}
  }
  const { urls } = await invokeSign<{ urls: Record<string, string> }>(
    { action: 'sign-download', keys },
    signal,
  )
  return urls
}

async function withSignedUrls(rows: ProjectRow[], signal?: AbortSignal): Promise<Project[]> {
  const urls = await signDownloads(
    rows.flatMap((row) => row.assets.map((asset) => asset.object_key)),
    signal,
  )
  return rows.map((row) => ({
    ...row,
    assets: row.assets
      .map((asset) => ({ ...asset, public_url: urls[asset.object_key] ?? '' }))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }))
}

async function deleteObjects(keys: string[]) {
  if (keys.length > 0) {
    await invokeSign({ action: 'delete-objects', keys })
  }
}

/** The database row is already gone, so a leftover object is unreachable and only costs storage. */
async function removeStoredObjects(keys: string[]) {
  try {
    await deleteObjects(keys)
  } catch (error) {
    console.error('Files could not be removed from storage', keys, error)
  }
}

const TURKISH_CHARS: Record<string, string> = { ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c' }

export function slugify(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[ığüşöç]/g, (char) => TURKISH_CHARS[char])
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
    .replace(/-+$/, '')
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  let query = supabase.from('projects').select('id').limit(1)
  if (signal) query = query.abortSignal(signal)
  unwrap(await query)
  return { status: 'ok' }
}

export async function listPublishedProjects(signal?: AbortSignal) {
  let query = supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  if (signal) query = query.abortSignal(signal)
  return withSignedUrls(unwrap<ProjectRow[]>(await query), signal)
}

export async function getPublishedProject(slug: string, signal?: AbortSignal) {
  let query = supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('slug', slug)
    .eq('is_published', true)
  if (signal) query = query.abortSignal(signal)
  const row = unwrap<ProjectRow>(await query.single())
  const [project] = await withSignedUrls([row], signal)
  return project
}

export async function listAdminProjects(signal?: AbortSignal) {
  let query = supabase.from('projects').select(PROJECT_COLUMNS).order('created_at', { ascending: false })
  if (signal) query = query.abortSignal(signal)
  return withSignedUrls(unwrap<ProjectRow[]>(await query), signal)
}

export async function getAdminProject(projectId: string, signal?: AbortSignal) {
  let query = supabase.from('projects').select(PROJECT_COLUMNS).eq('id', projectId)
  if (signal) query = query.abortSignal(signal)
  const row = unwrap<ProjectRow>(await query.single())
  const [project] = await withSignedUrls([row], signal)
  return project
}

export async function createProject(data: ProjectCreate) {
  const slug = data.slug?.trim() || slugify(data.title)
  if (!slug) {
    throw new ApiError(422, 'Başlıktan slug üretilemedi; lütfen bir slug girin.')
  }
  const row = unwrap<ProjectRow>(
    await supabase
      .from('projects')
      .insert({
        title: data.title.trim(),
        description: data.description,
        slug,
        is_published: data.is_published ?? false,
      })
      .select(PROJECT_COLUMNS)
      .single(),
  )
  const [project] = await withSignedUrls([row])
  return project
}

export async function updateProject(projectId: string, data: ProjectUpdate) {
  const row = unwrap<ProjectRow>(
    await supabase.from('projects').update(data).eq('id', projectId).select(PROJECT_COLUMNS).single(),
  )
  const [project] = await withSignedUrls([row])
  return project
}

export async function deleteProject(projectId: string) {
  const assets = unwrap<{ object_key: string }[]>(
    await supabase.from('assets').select('object_key').eq('project_id', projectId),
  )
  const deleted = unwrap<{ id: string }[]>(
    await supabase.from('projects').delete().eq('id', projectId).select('id'),
  )
  if (deleted.length === 0) {
    throw new ApiError(404, 'Proje bulunamadı.')
  }
  await removeStoredObjects(assets.map((asset) => asset.object_key))
}

export async function deleteAsset(projectId: string, assetId: string) {
  const deleted = unwrap<{ object_key: string }[]>(
    await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)
      .eq('project_id', projectId)
      .select('object_key'),
  )
  if (deleted.length === 0) {
    throw new ApiError(404, 'Dosya bulunamadı.')
  }
  await removeStoredObjects(deleted.map((asset) => asset.object_key))
}

function putFile(url: string, file: File, contentType: string, onProgress?: (ratio: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded / event.total)
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new ApiError(xhr.status, `Depolama yüklemeyi reddetti (HTTP ${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, 'Dosya yüklenirken bağlantı koptu.'))
    xhr.send(file)
  })
}

/** Uploads straight to R2 with a presigned PUT, then records the object in Supabase. */
export async function uploadAsset(
  projectId: string,
  kind: AssetKind,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<Asset> {
  const contentType = kind === 'apk' ? APK_CONTENT_TYPE : file.type
  const signed = await invokeSign<{ object_key: string; upload_url: string; download_url: string }>({
    action: 'sign-upload',
    project_id: projectId,
    kind,
    filename: file.name,
    content_type: contentType,
    size_bytes: file.size,
  })

  await putFile(signed.upload_url, file, contentType, onProgress)

  const result = await supabase
    .from('assets')
    .insert({
      project_id: projectId,
      kind,
      object_key: signed.object_key,
      original_filename: file.name.slice(0, 255),
      content_type: contentType,
      size_bytes: file.size,
    })
    .select(ASSET_COLUMNS)
    .single()
  if (result.error) {
    await removeStoredObjects([signed.object_key])
    throw toApiError(result.error)
  }
  return { ...(result.data as AssetRow), public_url: signed.download_url }
}

export async function listBans(signal?: AbortSignal) {
  let query = supabase
    .from('ip_bans')
    .select('id, ip_address, reason, expires_at, created_at')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  if (signal) query = query.abortSignal(signal)
  return unwrap<IpBan[]>(await query)
}

export async function createBan(data: IpBanCreate) {
  return unwrap<IpBan>(
    await supabase
      .rpc('ban_ip', {
        p_ip_address: data.ip_address,
        p_reason: data.reason,
        p_duration_minutes: data.duration_minutes,
      })
      .single(),
  )
}

export async function liftBan(ipAddress: string) {
  const deleted = unwrap<{ id: string }[]>(
    await supabase.from('ip_bans').delete().eq('ip_address', ipAddress).select('id'),
  )
  if (deleted.length === 0) {
    throw new ApiError(404, 'Bu IP için aktif ban bulunamadı.')
  }
}
