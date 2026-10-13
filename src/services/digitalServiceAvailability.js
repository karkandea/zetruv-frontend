/** Service readiness is not the same as an active SKU in the catalog.
 * Manual-login top-ups may only be sold when both the provider authorization
 * and secure fulfillment capability are explicitly confirmed. The current
 * catalog contract does not expose those approvals; fail closed.
 */
export const VIA_LOGIN_UNAVAILABLE_LABEL = 'Layanan sementara belum tersedia'

export function viaLoginServiceStatus(product, item = {}, readiness) {
  const method = product?.fulfillmentMethod ?? item?.fulfillmentMethod
  if (method !== 'MANUAL_LOGIN' && item?.fulfillmentMethod !== 'MANUAL_LOGIN') {
    return { available: true, reason: '' }
  }
  const eligible = product?.fulfillmentMethod === 'MANUAL_LOGIN' &&
    product?.id === readiness?.productId &&
    readiness?.available === true &&
    readiness?.fulfillmentMode === 'CmsManualAfterPaid'
  if (eligible) return {available: true, reason: ''}
  return {
    available: false,
    reason: 'Top Up via Login untuk game ini belum dapat diproses. Silakan pilih layanan lain.',
  }
}

export function checkoutActionHint({ items = [], blocked = [], phoneValid, phoneTouched,
  formTouched, accountProblem, catalogProblem, methodLoading, methodsReady,
  selectedMethodValid, priceChanged }) {
  // Persistent operational blockers are allowed before field interaction.
  if (blocked.length) return {
    message: `${blocked[0].gameName || blocked[0].productName}: layanan sementara belum tersedia.`,
    type: 'service', cartKey: blocked[0].cartKey, action: 'Hapus produk',
  }
  if (!methodLoading && !methodsReady) return {
    message: 'Metode pembayaran sedang tidak tersedia. Coba kembali nanti.',
    type: 'payment',
  }
  if (!items.length) return { message: 'Keranjang masih kosong.', type: 'cart' }
  if (catalogProblem) return { message: 'Sebagian produk perlu diperiksa kembali.', type: 'cart' }
  if (priceChanged) return { message: 'Harga berubah. Setujui harga terbaru pada daftar produk.', type: 'price' }
  if ((phoneTouched || formTouched) && !phoneValid) return {
    message: 'Lengkapi nomor WhatsApp yang valid untuk melanjutkan.',
    type: 'phone', target: 'checkout-phone',
  }
  if (formTouched && accountProblem) return {
    message: accountProblem.message,
    type: 'account',
    cartKey: accountProblem.cartKey,
  }
  if (!methodLoading && methodsReady && !selectedMethodValid && formTouched) return {
    message: 'Pilih metode pembayaran yang tersedia.', type: 'payment',
  }
  return null
}
