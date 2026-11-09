/** Keep the underlying catalog SKU identity when navigating from a promo card. */
export function flashSaleProductHref(item) {
  const slug = String(item?.productSlug || '').trim()
  const variantId = String(item?.variantId || '').trim()
  if (!slug || !variantId) return null
  return `/product/${encodeURIComponent(slug)}?variant=${encodeURIComponent(variantId)}`
}

/** Invalid/deactivated deep links fall back to a purchasable SKU, never another silent selection. */
export function selectLinkedVariant(variants = [], requestedId = '') {
  const available = (variant) => variant?.isAvailable !== false &&
    (variant?.stockQuantity == null || Number(variant.stockQuantity) > 0)
  const wanted = requestedId ? variants.find((variant) => String(variant.id) === String(requestedId)) : null
  return {
    variant: wanted && available(wanted) ? wanted : (variants.find(available) || variants[0] || null),
    invalidSelection: Boolean(requestedId && (!wanted || !available(wanted))),
  }
}

/** Non-blocking merchandising warning; prices are never rewritten by this check. */
export function suspiciousCatalogPrice(variant, candidates = []) {
  const measure = (name) => {
    const match = String(name || '').trim().match(/^(\d+)(?:\+\d+)?\s+(.+)$/i)
    return match ? { amount: Number(match[1]), unit: match[2].toLowerCase() } : null
  }
  const current = measure(variant?.name)
  if (!current || !variant?.productId || !(Number(variant.price) > 0)) return ''
  const conflict = candidates.find((other) => {
    if (other.id === variant.id || other.productId !== variant.productId || !(Number(other.price) > 0)) return false
    const compare = measure(other.name)
    if (!compare || compare.unit !== current.unit || compare.amount === current.amount) return false
    return compare.amount > current.amount
      ? Number(other.price) <= Number(variant.price)
      : Number(other.price) >= Number(variant.price)
  })
  return conflict ? `Harga katalog perlu ditinjau: ${variant.name} (${formatRupiah(variant.price)}) dibanding ${conflict.name} (${formatRupiah(conflict.price)}).` : ''
}

function formatRupiah(price) {
  return `Rp${new Intl.NumberFormat('id-ID').format(Number(price))}`
}
