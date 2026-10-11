/**
 * Build balanced Flash Sale pages. The final page overlaps previous items
 * instead of leaving empty slots when the product count isn't divisible.
 */
export function getFlashSalePages(items, perPage = 3) {
  if (!Array.isArray(items) || items.length === 0) return []

  const size = Math.max(1, Math.floor(Number(perPage) || 1))
  if (items.length <= size) return [items]

  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => {
    const start = Math.min(index * size, items.length - size)
    return items.slice(start, start + size)
  })
}
