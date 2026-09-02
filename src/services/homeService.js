import { apiRequest, hasBackend } from '../api/httpClient'

async function getDevelopmentHomepageMock() {
  if (!import.meta.env.DEV) {
    throw new Error('Homepage mock data is development-only')
  }

  const { homepageMock } = await import('../data/mockData')
  return homepageMock
}

function formatCountdown(endsAt) {
  if (!endsAt) return undefined
  const remainingSeconds = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
  const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function adaptHomepageResponse(result = {}) {
  const flashSale = result.flashSale

  return {
    hero: result.heroes?.[0] ?? null,
    sections: result.sections ?? [],
    serviceCategories: (result.serviceCategories ?? []).map((item) => ({
      id: item.slug || item.id,
      label: item.name,
      image: item.iconUrl || undefined,
      ring: undefined,
    })),
    popularGames: (result.popularGames ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      image: item.imageUrl || undefined,
    })),
    recentPurchases: (result.recentlyPurchased ?? []).map((item) => ({
      id: item.orderItemId,
      name: item.variantName ? `${item.productName} · ${item.variantName}` : item.productName,
      image: item.thumbnailUrl || undefined,
    })),
    flashSale: (flashSale?.items ?? []).map((item) => ({
      id: item.promotionItemId,
      name: item.gameName || item.productName,
      image: item.thumbnailUrl || undefined,
      price: item.salePrice,
      originalPrice: item.originalPrice,
      item: item.variantName,
    })),
    flashSaleEndsAt: formatCountdown(flashSale?.endsAt),
    jockeyGames: (result.joki ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      publisher: item.gameName || 'Joki Game',
      image: item.thumbnailUrl || undefined,
    })),
    merchandise: (result.merchandise ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      variant: item.gameName || item.categorySlug || '',
      price: item.minPrice ?? item.maxPrice ?? 0,
      sold: null,
      rating: null,
      image: item.thumbnailUrl || undefined,
    })),
    gameAccounts: result.gameAccounts ?? [],
    latestArticles: result.latestArticles ?? [],
  }
}

export async function getHomepageData() {
  if (!hasBackend) {
    return getDevelopmentHomepageMock()
  }

  try {
    const result = await apiRequest('/homepage')
    return adaptHomepageResponse(result)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Homepage API unavailable, using frontend mock data.', error)
      return getDevelopmentHomepageMock()
    }
    throw error
  }
}
