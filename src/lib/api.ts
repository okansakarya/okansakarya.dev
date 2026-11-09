const API_URL = import.meta.env.VITE_API_URL
const API_V1 = `${API_URL}/api/v1`

export type AssetKind = 'image' | 'video' | 'apk'

export type Asset = {
  id: string
  kind: AssetKind
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

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
}

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

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ValidationIssue = { loc?: (string | number)[]; msg?: string }

function describeError(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = issue.loc?.filter((part) => part !== 'body').join('.')
        return field ? `${field}: ${issue.msg}` : issue.msg
      })
      .join(' · ')
  }
  return `İstek başarısız oldu (HTTP ${status})`
}

function parseBody(text: string): unknown {
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  token?: string
  json?: unknown
  body?: BodyInit
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers()
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }
  let body = options.body
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  let response: Response
  try {
    response = await fetch(`${API_V1}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) {
      throw error
    }
    throw new ApiError(0, 'Sunucuya ulaşılamadı. API çalışıyor mu?')
  }

  const payload = parseBody(await response.text())
  if (!response.ok) {
    throw new ApiError(response.status, describeError(response.status, payload))
  }
  return payload as T
}

export function getHealth(signal?: AbortSignal) {
  return request<HealthResponse>('/health', { signal })
}

export function login(username: string, password: string) {
  return request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: new URLSearchParams({ username, password }),
  })
}

export function getCurrentAdmin(token: string, signal?: AbortSignal) {
  return request<AdminProfile>('/auth/me', { token, signal })
}

export function listBans(token: string, signal?: AbortSignal) {
  return request<IpBan[]>('/admin/bans', { token, signal })
}

export function createBan(token: string, data: IpBanCreate) {
  return request<IpBan>('/admin/bans', { method: 'POST', token, json: data })
}

export function liftBan(token: string, ipAddress: string) {
  return request<null>(`/admin/bans/${encodeURIComponent(ipAddress)}`, {
    method: 'DELETE',
    token,
  })
}

export function listPublishedProjects(signal?: AbortSignal) {
  return request<Project[]>('/projects', { signal })
}

export function getPublishedProject(slug: string, signal?: AbortSignal) {
  return request<Project>(`/projects/${encodeURIComponent(slug)}`, { signal })
}

export function listAdminProjects(token: string, signal?: AbortSignal) {
  return request<Project[]>('/admin/projects', { token, signal })
}

export function getAdminProject(token: string, projectId: string, signal?: AbortSignal) {
  return request<Project>(`/admin/projects/${encodeURIComponent(projectId)}`, { token, signal })
}

export function createProject(token: string, data: ProjectCreate) {
  return request<Project>('/admin/projects', { method: 'POST', token, json: data })
}

export function updateProject(token: string, projectId: string, data: ProjectUpdate) {
  return request<Project>(`/admin/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    token,
    json: data,
  })
}

export function deleteProject(token: string, projectId: string) {
  return request<null>(`/admin/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    token,
  })
}

export function deleteAsset(token: string, projectId: string, assetId: string) {
  return request<null>(
    `/admin/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`,
    { method: 'DELETE', token },
  )
}

/** Uses XMLHttpRequest because fetch cannot report upload progress. */
export function uploadAsset(
  token: string,
  projectId: string,
  kind: AssetKind,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<Asset> {
  const form = new FormData()
  form.append('kind', kind)
  form.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_V1}/admin/projects/${encodeURIComponent(projectId)}/assets`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded / event.total)
      }
    }
    xhr.onload = () => {
      const payload = parseBody(xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as Asset)
      } else {
        reject(new ApiError(xhr.status, describeError(xhr.status, payload)))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, 'Dosya yüklenirken bağlantı koptu.'))
    xhr.send(form)
  })
}
