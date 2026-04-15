const API_BASE_URL = (import.meta.env.VITE_LARAVEL_API || '').replace(/\/+$/, '')
const AUTH_STORAGE_KEY = 'oipsms_auth'

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }

  return data
}

function normalizeExpiresAt(data) {
  const fromIso = data?.expires_at ? Date.parse(data.expires_at) : NaN
  if (Number.isFinite(fromIso)) {
    return fromIso
  }

  const expiresInSeconds = Number(data?.expires_in)
  if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
    return Date.now() + expiresInSeconds * 1000
  }

  return Date.now() + 8 * 60 * 60 * 1000
}

export function getStoredSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const normalizedExpiresAt = Number(parsed?.expiresAt)
    if (!parsed?.token || !Number.isFinite(normalizedExpiresAt) || normalizedExpiresAt <= 0) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    if (Date.now() >= normalizedExpiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return { ...parsed, expiresAt: normalizedExpiresAt }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function login({ username, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password }),
  })

  const data = await parseResponse(response)
  return {
    token: data.token,
    expiresAt: normalizeExpiresAt(data),
    user: data.user,
  }
}

export async function fetchCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  })

  const data = await parseResponse(response)
  return data.user
}

export async function logout(token) {
  if (!token) return

  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  })
}
