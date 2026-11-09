export function adaptHomepageResponse(result = {}) {
  const flashSale = result.flashSale

  return {
    heroes: result.heroes ?? [],
    sections: result.sections ?? [],
    serviceCategories: (result.serviceCategories ?? []).map((item) => ({
      id: item.id, label: item.name, kind: item.kind,
      slug: item.slug, image: item.iconUrl || undefined,
    })),
    popularGames: (result.popularGames ?? []).map((item) => ({
      id: item.id, name: item.name, image: item.imageUrl || undefined, slug: item.slug,
    })),
    recentPurchases: (result.recentlyPurchased ?? []).map((item) => ({
      id: item.orderItemId,
      name: item.variantName ? `${item.productName} · ${item.variantName}` : item.productName,
      image: item.thumbnailUrl || undefined,
    })),
    flashSale: (flashSale?.items ?? []).map((item) => ({
      id: item.promotionItemId, name: item.gameName || item.productName,
      productSlug: item.productSlug, variantId: item.variantId,
      image: item.thumbnailUrl || undefined, price: item.salePrice,
      originalPrice: item.originalPrice, item: item.variantName,
    })),
    flashSaleEndsAt: flashSale?.endsAt ?? null,
    jockeyGames: (result.joki ?? []).map((item) => ({
      id: item.id, name: item.name, publisher: item.gameName || '',
      image: item.thumbnailUrl || undefined, slug: item.slug,
    })),
    merchandise: (result.merchandise ?? []).map((item) => ({
      id: item.id, name: item.name, slug: item.slug,
      variant: item.gameName || item.categorySlug || '',
      price: item.minPrice ?? item.maxPrice ?? null,
      sold: item.soldQuantity, rating: item.rating,
      reviewCount: item.reviewCount, isAvailable: item.isAvailable,
      image: item.thumbnailUrl || undefined,
    })),
    gameAccounts: result.gameAccounts ?? [],
    latestArticles: result.latestArticles ?? [],
  }
}
