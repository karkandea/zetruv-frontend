import { apiRequest } from '../api/httpClient'

const SESSION_KEY = 'zetruv.admin.session'

function parseError(error) {
  const raw = error instanceof Error ? error.message : String(error)
  try {
    const parsed = JSON.parse(raw)
    return parsed.message || parsed.detail || parsed.title || raw
  } catch {
    return raw
  }
}

export function getAdminSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (!session?.accessToken || !session?.expiresAt) return null
    if (Date.parse(session.expiresAt) <= Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export async function loginAdmin(email, password) {
  try {
    const session = await apiRequest('/cms/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  } catch (error) {
    throw new Error(parseError(error))
  }
}

export function logoutAdmin() {
  localStorage.removeItem(SESSION_KEY)
}

export async function cmsRequest(path, options = {}) {
  const session = getAdminSession()
  if (!session) throw new Error('Your admin session has expired. Please sign in again.')

  try {
    return await apiRequest(`/cms${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    const message = parseError(error)
    if (/401|unauthorized|expired/i.test(message)) {
      logoutAdmin()
    }
    throw new Error(message)
  }
}
