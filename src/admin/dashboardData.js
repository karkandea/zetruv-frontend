// Counts only come from successful CMS responses. Unknown is different from zero.
const arrayCount = (value) => Array.isArray(value) ? value.length : null
const resultCount = (value) => Number.isInteger(value?.totalItems) && value.totalItems >= 0
  ? value.totalItems : null

export function getDashboardCounts(data, now = Date.now()) {
  const promotions = data.promotions
  return {
    totalOrders: resultCount(data.orders),
    totalProducts: arrayCount(data.products),
    totalBanners: arrayCount(data.heroes),
    activePromotions: Array.isArray(promotions) ? promotions.filter((promo) => {
      if (!promo.isActive) return false
      const start = promo.startsAt ? Date.parse(promo.startsAt) : null
      const end = promo.endsAt ? Date.parse(promo.endsAt) : null
      return (start === null || (Number.isFinite(start) && start <= now))
        && (end === null || (Number.isFinite(end) && end >= now))
    }).length : null,
    processingOrders: resultCount(data.processing),
    paidPendingOrders: resultCount(data.paidPending),
    failedPayments: resultCount(data.paymentFailed),
  }
}

export function getRecentOrders(response) {
  if (!Array.isArray(response?.items)) return null
  return [...response.items]
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
    .slice(0, 5)
}
