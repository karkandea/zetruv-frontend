const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const baseUrl = configuredBaseUrl || (import.meta.env.PROD ? '/api/v1' : '')

export const hasBackend = Boolean(baseUrl)

export async function apiRequest(path, options = {}) {
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    let details = {}
    try { details = JSON.parse(raw) || {} } catch { /* plain text response */ }
    const error = new Error(details.message || raw || `Request failed with status ${response.status}`)
    error.status = response.status
    error.code = details.code
    error.priceChanges = details.priceChanges
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}
