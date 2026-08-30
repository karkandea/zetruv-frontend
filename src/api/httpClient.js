const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

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
    const message = await response.text().catch(() => '')
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}
