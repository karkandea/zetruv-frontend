const CART_KEY = 'zetruv-cart-v1'
const CART_EVENT = 'zetruv-cart-change'

function safeParse(raw) {
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function readCart() {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(CART_KEY))
}

function writeCart(items) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }))
  return items
}

export function addCartItem(item) {
  const items = readCart()
  const key = item.cartKey || `${item.variantId}:${item.accountKey || 'default'}`
  const index = items.findIndex((entry) => entry.cartKey === key)
  const next = { ...item, cartKey: key }
  if (index >= 0) {
    const current = items[index]
    items[index] = {
      ...current,
      ...next,
      quantity: Math.min(next.maxQuantity || 99, current.quantity + next.quantity),
    }
  } else {
    items.push(next)
  }
  return writeCart(items)
}

export function updateCartQuantity(cartKey, quantity) {
  const items = readCart().map((item) => item.cartKey === cartKey
    ? { ...item, quantity: Math.max(1, Math.min(item.maxQuantity || 99, quantity)) }
    : item)
  return writeCart(items)
}

export function removeCartItem(cartKey) {
  return writeCart(readCart().filter((item) => item.cartKey !== cartKey))
}

export function clearCartGroup(fulfillmentMethod) {
  return writeCart(readCart().filter((item) => item.fulfillmentMethod !== fulfillmentMethod))
}

export function cartCount(items = readCart()) {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0)
}

export function onCartChange(callback) {
  const handler = (event) => callback(event.detail || readCart())
  const storageHandler = (event) => {
    if (event.key === CART_KEY) callback(readCart())
  }
  window.addEventListener(CART_EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(CART_EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}
