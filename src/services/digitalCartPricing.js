/** Mirror the current digital checkout API pricing contract.
 * API order totals do NOT apply a digital service fee: only shipping, if quoted.
 * Product variants may already include an active sale price. Voucher discounts
 * require a server evaluation at checkout and are not estimated in the cart.
 */
export function getDigitalPricing(items = []) {
  const entries = Array.isArray(items) ? items : []
  const subtotal = entries.reduce((sum, item) => {
    const qty = Math.max(1, Number(item.quantity) || 1)
    return sum + Number(item.regularPrice ?? item.unitPrice ?? 0) * qty
  }, 0)
  const discount = entries.reduce((sum, item) => {
    const qty = Math.max(1, Number(item.quantity) || 1)
    return sum + Math.max(0, Number(item.regularPrice ?? item.unitPrice ?? 0) - Number(item.unitPrice ?? 0)) * qty
  }, 0)
  const serviceFee = 0 // No digital service-fee pricing in current backend checkout contract.
  return { subtotal, discount, serviceFee, total: Math.max(0, subtotal - discount + serviceFee) }
}
