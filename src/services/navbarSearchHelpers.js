// Search suggestions are always real, publicly visible catalog records.
// Local presentation metadata changes labels/links, never invents products.
const categoryMeta = {
  TopUpGame: { badge: 'TOP UP', subtitle: 'Top Up · Player ID', fallbackImage: '/assets/search/category-topup.webp' },
  TopUpLogin: { badge: 'LOGIN', subtitle: 'Top Up · Account Login', fallbackImage: '/assets/search/category-topup.webp' },
  GameVoucher: { badge: 'VOUCHER', subtitle: 'Game Voucher · Digital Code', fallbackImage: '/assets/search/category-voucher.webp' },
  Joki: { badge: 'JOKI', subtitle: 'Game Boosting · Service', fallbackImage: '/assets/search/category-joki.webp' },
  GameAccount: { badge: 'ACCOUNT', subtitle: 'Game Account · Marketplace', fallbackImage: '/assets/search/category-account.webp' },
  Merchandise: { badge: 'MERCH', subtitle: 'Merchandise · Physical Product', fallbackImage: '/assets/search/category-merchandise.webp' },
}

export function searchProductMeta(product) {
  return categoryMeta[product?.kind] || { badge: 'PRODUCT', subtitle: 'Game Product', fallbackImage: '/assets/search/category-topup.webp' }
}

export function searchProductHref(product) {
  if (!product || !product.slug) return '/search'
  const slug = encodeURIComponent(product.slug)
  switch (product.kind) {
    case 'TopUpGame': return `/product/${slug}`
    case 'TopUpLogin': return `/product/${slug}/login`
    case 'GameVoucher': return `/product/voucher/${slug}`
    case 'Joki': return `/product/joki/${slug}`
    case 'GameAccount':
      return product.gameSlug
        ? `/game-accounts/${encodeURIComponent(product.gameSlug)}/${slug}`
        : '/game-accounts'
    case 'Merchandise': return `/merchandise/${slug}`
    default: return '/search'
  }
}

function relevance(product, term) {
  const name = (product.name || '').toLocaleLowerCase()
  const gameName = (product.gameName || '').toLocaleLowerCase()
  const slug = (product.slug || '').toLocaleLowerCase()
  let score = 0
  if (name === term || gameName === term) score += 120
  if (name.startsWith(term)) score += 90
  if (gameName.startsWith(term)) score += 65
  if (name.includes(` ${term}`) || name.includes(`- ${term}`)) score += 45
  if (name.includes(term)) score += 25
  if (gameName.includes(term)) score += 18
  if (slug.includes(term)) score += 12
  if (product.isFeatured) score += 3
  return score
}

export function groupSearchProducts(items, query) {
  const term = String(query || '').trim().toLocaleLowerCase()
  if (!Array.isArray(items) || term.length < 3) return { best: [], suggestions: [] }
  const unique = new Set()
  const ranked = items
    .filter(item => item?.id && item?.name && item?.slug && item?.kind)
    .filter(item => {
      const key = String(item.id)
      if (unique.has(key)) return false
      unique.add(key)
      return true
    })
    .map((product, index) => ({ product, index, score: relevance(product, term) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ product }) => product)
  return { best: ranked.slice(0, 2), suggestions: ranked.slice(2, 7) }
}
