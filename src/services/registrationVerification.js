const PENDING_KEY = 'zetruv-pending-registration-v1'
const DEFAULT_LIFETIME_HOURS = 24

function browserSessionStorage() {
  try { return globalThis.window?.sessionStorage ?? null } catch { return null }
}

export function validCustomerEmail(email) {
  return typeof email === 'string'
    && email.length <= 320
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function readPendingRegistration(storage = browserSessionStorage()) {
  if (!storage) return null
  try {
    const item = JSON.parse(storage.getItem(PENDING_KEY) || 'null')
    if (!validCustomerEmail(item?.email) || !Number.isFinite(item?.expiresAt)
        || item.expiresAt <= Date.now()) {
      storage.removeItem(PENDING_KEY)
      return null
    }
    return { email: item.email, token: typeof item.token === 'string' ? item.token : '' }
  } catch {
    return null
  }
}

export function savePendingRegistration(email, token, lifetimeHours = DEFAULT_LIFETIME_HOURS,
  storage = browserSessionStorage()) {
  if (!storage || !validCustomerEmail(email)) return
  const hours = Math.max(1, Math.min(168, Number(lifetimeHours) || DEFAULT_LIFETIME_HOURS))
  try {
    storage.setItem(PENDING_KEY, JSON.stringify({
      email: email.trim(),
      token: typeof token === 'string' ? token : '',
      expiresAt: Date.now() + hours * 60 * 60 * 1000,
    }))
  } catch {
    // Private browsing may prevent session storage. The active modal still works.
  }
}

export function clearPendingRegistration(storage = browserSessionStorage()) {
  try { storage?.removeItem(PENDING_KEY) } catch { /* storage may be unavailable */ }
}
