import { getStoredSession } from './auth'

const API_BASE_URL = (import.meta.env.VITE_LARAVEL_API || '').replace(/\/+$/, '')

function getHeaders() {
  const session = getStoredSession()
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  }
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const firstValidationError = data?.errors
      ? Object.values(data.errors).flat().find(Boolean)
      : null
    const error = new Error(firstValidationError || data?.message || 'Request failed.')
    error.status = response.status
    error.details = data?.errors || null
    throw error
  }
  return data
}

function getRawToken() {
  return getStoredSession()?.token || ''
}

export function getStorageOrigin() {
  return API_BASE_URL.replace(/\/api$/i, '')
}

export function buildStorageUrl(storagePath) {
  if (!storagePath) return null
  const normalizedPath = String(storagePath).replace(/^\/+/, '')
  const origin = getStorageOrigin()
  if (!origin) return null
  return `${origin}/storage/${normalizedPath}`
}

/** Prefer resolving from path + VITE_LARAVEL_API origin so branding works if the API still has a wrong APP_URL. */
export function publicStorageUrlFromPaths(storagePath, apiAbsoluteUrlFallback) {
  if (storagePath) {
    const fromPath = buildStorageUrl(storagePath)
    if (fromPath) return fromPath
  }
  return apiAbsoluteUrlFallback || null
}

export async function changeMyPassword(payload) {
  const response = await fetch(`${API_BASE_URL}/user/password`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function getPublicSystemSettings() {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
  return handleResponse(response)
}

export async function updateSystemSettings(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function uploadSystemLogo(file, slot = 'legacy') {
  const formData = new FormData()
  formData.append('logo', file)
  formData.append('slot', slot)
  const response = await fetch(`${API_BASE_URL}/admin/settings/logo`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(getRawToken() ? { Authorization: `Bearer ${getRawToken()}` } : {}),
    },
    body: formData,
  })
  return handleResponse(response)
}

export async function removeSystemLogo(slot) {
  const response = await fetch(`${API_BASE_URL}/admin/settings/logo/${encodeURIComponent(slot)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

export async function uploadAuthBackground(file) {
  const formData = new FormData()
  formData.append('background', file)
  const response = await fetch(`${API_BASE_URL}/admin/settings/auth-background`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(getRawToken() ? { Authorization: `Bearer ${getRawToken()}` } : {}),
    },
    body: formData,
  })
  return handleResponse(response)
}

export async function getBackupSchedule() {
  const response = await fetch(`${API_BASE_URL}/admin/backup/schedule`, { headers: getHeaders() })
  return handleResponse(response)
}

export async function updateBackupSchedule(payload) {
  const response = await fetch(`${API_BASE_URL}/admin/backup/schedule`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function getBackupList() {
  const response = await fetch(`${API_BASE_URL}/admin/backup/list`, { headers: getHeaders() })
  return handleResponse(response)
}

export async function downloadBackup(urlPath) {
  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    method: 'GET',
    headers: {
      Accept: 'application/sql, application/octet-stream, */*',
      ...(getRawToken() ? { Authorization: `Bearer ${getRawToken()}` } : {}),
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data?.message || 'Backup request failed.')
    error.status = response.status
    throw error
  }
  return response
}

export async function listUsers() {
  const response = await fetch(`${API_BASE_URL}/users`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function createUser(payload) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function updateUser(id, payload) {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function deleteUser(id) {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

export async function listPrograms() {
  const response = await fetch(`${API_BASE_URL}/programs`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function createProgram(payload) {
  const response = await fetch(`${API_BASE_URL}/programs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function updateProgram(id, payload) {
  const response = await fetch(`${API_BASE_URL}/programs/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function deleteProgram(id) {
  const response = await fetch(`${API_BASE_URL}/programs/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

export async function listActivityLogs() {
  const response = await fetch(`${API_BASE_URL}/activity-logs`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function listBeneficiaries() {
  const response = await fetch(`${API_BASE_URL}/beneficiaries`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function createBeneficiary(payload) {
  const formData = new FormData()
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value == null || value === '') return
    if (key === 'profile_photo' && value instanceof File) {
      formData.append('profile_photo', value)
      return
    }
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
      return
    }
    formData.append(key, value)
  })

  const response = await fetch(`${API_BASE_URL}/beneficiaries`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(getRawToken() ? { Authorization: `Bearer ${getRawToken()}` } : {}),
    },
    body: formData,
  })
  const data = await handleResponse(response)
  return data.data
}

export async function updateBeneficiary(id, payload) {
  const formData = new FormData()
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value == null || value === '') return
    if (key === 'profile_photo' && value instanceof File) {
      formData.append('profile_photo', value)
      return
    }
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
      return
    }
    formData.append(key, value)
  })
  formData.append('_method', 'PUT')

  const response = await fetch(`${API_BASE_URL}/beneficiaries/${id}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(getRawToken() ? { Authorization: `Bearer ${getRawToken()}` } : {}),
    },
    body: formData,
  })
  const data = await handleResponse(response)
  return data.data
}

export async function deleteBeneficiary(id) {
  const response = await fetch(`${API_BASE_URL}/beneficiaries/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

export async function listEnrollments(params = {}) {
  const query = new URLSearchParams()
  if (params.beneficiary_id != null && params.beneficiary_id !== '') {
    query.set('beneficiary_id', String(params.beneficiary_id))
  }
  if (params.program_id != null && params.program_id !== '') {
    query.set('program_id', String(params.program_id))
  }
  const qs = query.toString()
  const response = await fetch(`${API_BASE_URL}/enrollments${qs ? `?${qs}` : ''}`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function createEnrollment(payload) {
  const response = await fetch(`${API_BASE_URL}/enrollments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function updateEnrollment(id, payload) {
  const response = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function deleteEnrollment(id) {
  const response = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

export async function listProgramUpdates(params = {}) {
  const query = new URLSearchParams()
  if (params.beneficiary_id != null && params.beneficiary_id !== '') {
    query.set('beneficiary_id', String(params.beneficiary_id))
  }
  if (params.program_id != null && params.program_id !== '') {
    query.set('program_id', String(params.program_id))
  }
  if (params.program_enrollment_id != null && params.program_enrollment_id !== '') {
    query.set('program_enrollment_id', String(params.program_enrollment_id))
  }
  const qs = query.toString()
  const response = await fetch(`${API_BASE_URL}/program-updates${qs ? `?${qs}` : ''}`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function createProgramUpdate(payload) {
  const response = await fetch(`${API_BASE_URL}/program-updates`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function deleteProgramUpdate(id) {
  const response = await fetch(`${API_BASE_URL}/program-updates/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

export async function listNotifications() {
  const response = await fetch(`${API_BASE_URL}/notifications`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function markNotificationRead(id) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'POST',
    headers: getHeaders(),
  })
  const data = await handleResponse(response)
  return data.data
}

export async function deleteNotification(id) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  return handleResponse(response)
}

/** Fired after due notifications are marked read so shell UI (e.g. sidebar badge) can refresh. */
export const DUE_NOTIFICATIONS_CHANGED_EVENT = 'oipsms:due-notifications-changed'

export function notifyDueNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DUE_NOTIFICATIONS_CHANGED_EVENT))
  }
}

export async function listStatusOptions() {
  const response = await fetch(`${API_BASE_URL}/metadata/status-options`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function listFieldTemplates() {
  const response = await fetch(`${API_BASE_URL}/metadata/field-templates`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || []
}

export async function getDashboardData() {
  const response = await fetch(`${API_BASE_URL}/dashboard`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || { stats: {}, upcoming_notifications: [] }
}

export async function getReportSummary(params = {}) {
  const query = new URLSearchParams()
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  const queryString = query.toString()
  const response = await fetch(`${API_BASE_URL}/reports/summary${queryString ? `?${queryString}` : ''}`, { headers: getHeaders() })
  const data = await handleResponse(response)
  return data.data || { enrollments_by_program: [], updates_by_status: [] }
}
