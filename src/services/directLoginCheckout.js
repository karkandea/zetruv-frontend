// Buy Now is a single-line draft, never a mutation of guest or server cart.
// Store only product/variant quote and display metadata; no account details.
const KEY = 'zetruv-direct-login-checkout-v1'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function clean(item) {
  if (!item || item.productKind !== 'TopUpLogin' || item.fulfillmentMethod !== 'MANUAL_LOGIN' ||
      !uuid.test(item.productId || '') || !uuid.test(item.variantId || '') ||
      !/^[a-z0-9-]+$/i.test(item.productSlug || '')) return null
  const unitPrice = Number(item.unitPrice), quantity = Number(item.quantity)
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null
  const max = Number(item.maxQuantity)
  const maxQuantity = Number.isFinite(max) && max > 0 ? Math.min(99, Math.floor(max)) : 99
  if(quantity > maxQuantity) return null
  return {
    productId:item.productId, variantId:item.variantId, productSlug:item.productSlug,
    productKind:'TopUpLogin', fulfillmentMethod:'MANUAL_LOGIN',
    productName:String(item.productName || ''), gameName:String(item.gameName || ''),
    variantName:String(item.variantName || ''), variantSku:String(item.variantSku || ''),
    thumbnailUrl:String(item.thumbnailUrl || ''), unitPrice,
    regularPrice:Number(item.regularPrice) > 0 ? Number(item.regularPrice) : unitPrice,
    quantity, maxQuantity, requiresGameAccountValidation:Boolean(item.requiresGameAccountValidation),
    accountKey:'checkout-required', cartKey:'direct-login:'+item.variantId,
  }
}
export function saveDirectLoginCheckout(item, storage=globalThis.sessionStorage) {
  const draft=clean(item)
  if(!draft || !storage) throw Error('Invalid direct checkout draft')
  storage.setItem(KEY, JSON.stringify({item:draft,expiresAt:Date.now()+30*60*1000}))
  return draft
}
export function readDirectLoginCheckout(storage=globalThis.sessionStorage) {
  try {
    const draft=JSON.parse(storage?.getItem(KEY)||'null')
    return draft && draft.expiresAt>Date.now() ? clean(draft.item) : null
  } catch { return null }
}
export function clearDirectLoginCheckout(storage=globalThis.sessionStorage) {
  try {storage?.removeItem(KEY)} catch { /* storage unavailable */ }
}
