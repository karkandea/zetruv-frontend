// Frontend persistence for saved products. Replace with the account favorites API when available.
// No seeded/demo items: the list only contains products the current browser explicitly saves.
const KEY = 'zetruv-favorites-v1'
const EVENT = 'zetruv:favorites-changed'

export function readFavorites() {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === 'string' && typeof item.href === 'string') : []
  } catch {
    return []
  }
}

export function isFavorite(id) {
  return Boolean(id) && readFavorites().some((item) => item.id === id)
}

export function setFavorite(product, enabled) {
  if (typeof window === 'undefined' || !product?.id || !product?.href) return readFavorites()
  const existing = readFavorites()
  const next = enabled
    ? [...existing.filter((item) => item.id !== product.id), {
        id: String(product.id), name: String(product.name || 'Produk'),
        type: String(product.type || 'Produk Zetruv'), price: String(product.price || ''),
        href: product.href, image: product.image || '', code: String(product.code || '♥'),
      }]
    : existing.filter((item) => item.id !== product.id)
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // Storage may be unavailable (private mode or browser policy).
  }
  return readFavorites()
}

export function toggleFavorite(product) {
  const nextSaved = !isFavorite(product?.id)
  setFavorite(product, nextSaved)
  return isFavorite(product?.id)
}

export function subscribeFavorites(callback) {
  if (typeof window === 'undefined') return () => {}
  const listener = () => callback(readFavorites())
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
