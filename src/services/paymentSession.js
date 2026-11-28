/**
 * The payment hand-off stores only a short-lived order access capability and
 * non-sensitive receipt data. Never persist customer login or game credentials.
 * This is tab-scoped: no localStorage, URL tokens, or synthetic transactions.
 */
export const PAYMENT_CONTEXT_KEY = 'zetruv-payment-session-v1'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_STATES = new Set(['NotStarted','Pending','Paid','Failed','Expired','Refunded','Cancelled'])

export function readPaymentContext(storage = globalThis.sessionStorage) {
  if (!storage) return null
  try {
    const value = JSON.parse(storage.getItem(PAYMENT_CONTEXT_KEY) || 'null')
    if (!value || value.version !== 1 || !uuid.test(value.orderId) ||
      typeof value.orderAccessToken !== 'string' || !value.orderAccessToken ||
      !value.orderNumber || !value.methodCode ||
      !Number.isFinite(Number(value.grandTotal)) ||
      (value.orderAccessTokenExpiresAt && Date.parse(value.orderAccessTokenExpiresAt) <= Date.now())) return null
    return value
  } catch {
    return null
  }
}

export function storePaymentContext(order, methodCode, storage = globalThis.sessionStorage) {
  if (!storage || !uuid.test(order?.id || '') || !order?.orderAccessToken ||
      !order?.orderNumber || !methodCode) throw new Error('Sesi order belum valid.')
  const context = {
    version: 1,
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderAccessToken: order.orderAccessToken,
    orderAccessTokenExpiresAt: order.orderAccessTokenExpiresAt || null,
    methodCode,
    currency: order.currency || 'IDR',
    grandTotal: Number(order.grandTotal),
    // Backend order items never include raw credentials. Copy display-only fields.
    items: (Array.isArray(order.items) ? order.items : []).map(item => ({
      productName: String(item.productName || ''),
      variantName: String(item.variantName || ''),
      productSlug: String(item.productSlug || ''),
      variantIconUrl: paymentThumbnail(item.variantIconUrl),
      rankFrom: item.rankFrom || null, rankTo: item.rankTo || null,
      rankFromIconUrl: paymentThumbnail(item.rankFromIconUrl), rankToIconUrl: paymentThumbnail(item.rankToIconUrl),
      thumbnailUrl: paymentThumbnail(item.thumbnailUrl),
      kind: String(item.productKind || item.kind || ''),
      quantity: Number(item.quantity || 1),
      lineTotal: Number(item.lineTotal || 0),
    })),
  }
  if (!Number.isFinite(context.grandTotal) || context.grandTotal <= 0)
    throw new Error('Total order tidak valid.')
  try {
    storage.setItem(PAYMENT_CONTEXT_KEY, JSON.stringify(context))
  } catch {
    throw new Error('Sesi order tidak dapat disimpan. Aktifkan penyimpanan sesi browser.')
  }
  return context
}

export function clearPaymentContext(storage = globalThis.sessionStorage) {
  try { storage?.removeItem(PAYMENT_CONTEXT_KEY) } catch { /* unavailable storage */ }
}

export function normalizePaymentState(data, orderId) {
  if (!data || data.orderId !== orderId || !VALID_STATES.has(data.state)) {
    throw new Error('Respons status pembayaran tidak valid.')
  }
  return data
}

export function mayInitiatePayment(status) {
  return Boolean(status?.canRetry && !status?.hasActivePaymentSession &&
    ['NotStarted','Failed','Expired'].includes(status.state))
}

export function paymentLink(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

export function formatPaymentCountdown(expiresAt, now = Date.now()) {
  const time = Date.parse(expiresAt || '')
  if (!Number.isFinite(time)) return null
  const seconds = Math.max(0, Math.ceil((time - now) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h,m,s].map(v => String(v).padStart(2,'0')).join(':')
}

export function isMidtransMethod(code) {
  return typeof code === 'string' && /^MIDTRANS_[A-Z0-9_]+$/.test(code)
}
export function midtransPaymentLink(url) {
  try {
    const parsed = new URL(url)
    return parsed.origin === 'https://app.sandbox.midtrans.com' &&
      !parsed.username && !parsed.password &&
      /^\/snap\/(?:v[34]\/redirection|v2\/vtweb)\/[A-Za-z0-9_-]+\/?$/.test(parsed.pathname)
      ? parsed.href : null
  } catch { return null }
}

export function midtransQrisImage(url) {
  try {
    const parsed = new URL(url)
    return parsed.origin === 'https://api.sandbox.midtrans.com' &&
      !parsed.username && !parsed.password && !parsed.search && !parsed.hash &&
      /^\/v2\/(?:qris|gopay)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/qr-code$/i.test(parsed.pathname)
      ? parsed.href : null
  } catch { return null }
}

export const QRIS_SIMULATOR_URL = 'https://simulator.sandbox.midtrans.com/v2/qris/index'

export function paymentThumbnail(value) {
  if(typeof value !== 'string' || !value) return null
  if(value.startsWith('/') && !value.startsWith('//') && !value.includes(String.fromCharCode(92))) return value
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password ? u.href : null } catch { return null }
}
export function enrichPaymentItems(items, detailItems) {
  if(!Array.isArray(detailItems)) return items
  return items.map(item => {
    const match=detailItems.find(other=>other.productName===item.productName && other.variantName===item.variantName && Number(other.quantity)===Number(item.quantity))
    return {...item, productSlug:item.productSlug||match?.productSlug, variantIconUrl:paymentThumbnail(item.variantIconUrl)||paymentThumbnail(match?.variantIconUrl), rankFrom:item.rankFrom||match?.rankFrom, rankTo:item.rankTo||match?.rankTo, rankFromIconUrl:paymentThumbnail(item.rankFromIconUrl)||paymentThumbnail(match?.rankFromIconUrl), rankToIconUrl:paymentThumbnail(item.rankToIconUrl)||paymentThumbnail(match?.rankToIconUrl), thumbnailUrl:paymentThumbnail(item.thumbnailUrl)||paymentThumbnail(match?.thumbnailUrl), kind:item.kind||String(match?.kind||match?.productKind||'')}
  })
}
