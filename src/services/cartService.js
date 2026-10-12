const CART_KEY = 'zetruv-cart-v1'
const CART_EVENT = 'zetruv-cart-change'
const SINGLE_QUANTITY_KINDS = new Set(['TopUpGame', 'Joki', 'GameAccount'])
const CREDENTIAL_METHODS = new Set(['MANUAL_LOGIN', 'JOKI_MANUAL'])

function safeParse(raw) {
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const clean = (value) => String(value ?? '').trim()

export function supportsCartQuantity(item) {
  if (!item || SINGLE_QUANTITY_KINDS.has(item.productKind)) return false
  // Account-unique products are never bulk-incrementable.
  if (item.productKind === 'GameAccount' || Number(item.maxQuantity) === 1) return false
  return item.productKind === 'GameVoucher' || item.productKind === 'TopUpLogin' ||
    item.fulfillmentMethod === 'VOUCHER_CODE' || item.fulfillmentMethod === 'MANUAL_LOGIN'
}

export function cartItemLimit(item) {
  const value = Number(item?.maxQuantity)
  const cap = Number.isFinite(value) && value > 0 ? Math.floor(value) : 99
  return Math.min(99, Math.max(1, cap))
}

export function cartIdentity(item) {
  const sku = clean(item?.variantId || item?.variantSku || item?.productSlug || item?.productId)
  const product = clean(item?.productId || item?.productSlug)
  const target = item?.fulfillmentMethod === 'AUTO_ID'
    ? `${clean(item?.accountFields?.userId)}:${clean(item?.accountFields?.zone)}`
    : clean(item?.accountKey || 'checkout-required')
  return `${product}:${sku}:${target}`
}

function normalizeEntry(item) {
  const quantity = Math.max(1, Math.min(cartItemLimit(item), Math.floor(Number(item.quantity) || 1)))
  return { ...item, cartKey: cartIdentity(item), quantity,
    accountKey: item.fulfillmentMethod === 'AUTO_ID'
      ? `${clean(item.accountFields?.userId)}:${clean(item.accountFields?.zone)}`
      : item.accountKey }
}

function mergeEntries(items) {
  const merged = []
  const indexByKey = new Map()
  for (const item of items) {
    const next = normalizeEntry(item)
    const idx = indexByKey.get(next.cartKey)
    if (idx === undefined) {
      indexByKey.set(next.cartKey, merged.length)
      merged.push(next)
    } else {
      const old = merged[idx]
      merged[idx] = { ...old, quantity: Math.min(cartItemLimit(old), old.quantity + next.quantity) }
    }
  }
  return merged
}

export function readCart() {
  if (typeof window === 'undefined') return []
  return mergeEntries(safeParse(window.localStorage.getItem(CART_KEY)))
}

function writeCart(items) {
  const normalized = mergeEntries(items)
  window.localStorage.setItem(CART_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: normalized }))
  return normalized
}

export function addCartItem(item) {
  return writeCart([...readCart(), item])
}

export function updateCartQuantity(cartKey, quantity) {
  const items = readCart().map((item) => item.cartKey === cartKey
    ? { ...item, quantity: Math.max(1, Math.min(cartItemLimit(item), Math.floor(Number(quantity) || 1))) }
    : item)
  return writeCart(items)
}

/** Atomic target edit. Re-key and merge only when SKU and account destination match. */
export function updateCartAccount(cartKey, { userId, zone }, labels = {}) {
  const items = readCart()
  const current = items.find((item) => item.cartKey === cartKey)
  if (!current || current.fulfillmentMethod !== 'AUTO_ID') return items
  const fields = { userId: clean(userId), zone: clean(zone) }
  const updated = {
    ...current,
    accountFields: fields,
    accountKey: `${fields.userId}:${fields.zone}`,
    accountLabel: `${labels.first || 'User ID'}: ${fields.userId}${fields.zone ? ` / ${fields.zone}` : ''}`,
  }
  return writeCart(items.map((item) => item.cartKey === cartKey ? updated : item))
}

export function removeCartItem(cartKey) {
  return writeCart(readCart().filter((item) => item.cartKey !== cartKey))
}

export function restoreCartItem(item, index) {
  const items = readCart()
  items.splice(Math.max(0, Math.min(index, items.length)), 0, item)
  return writeCart(items)
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
