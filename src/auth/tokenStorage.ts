const STORAGE_KEY = 'okansakarya.admin-session'

type StoredSession = {
  token: string
  expiresAt: number
}

export function readSession(): StoredSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const session = JSON.parse(raw) as StoredSession
    if (typeof session.token === 'string' && session.expiresAt > Date.now()) {
      return session
    }
  } catch {
    // Corrupted value: fall through and clear it.
  }
  sessionStorage.removeItem(STORAGE_KEY)
  return null
}

export function writeSession(token: string, expiresInSeconds: number): StoredSession {
  const session = { token, expiresAt: Date.now() + expiresInSeconds * 1000 }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}
