export const PRODUCT_EDITOR_FIELDS = {
  information: ['name', 'categoryId', 'gameId', 'kind', 'shortDescription', 'description'],
  images: ['thumbnailUrl'],
  publishing: ['isActive', 'isFeatured', 'sortOrder'],
}

export function mergeProductTab(saved, draft, tab) {
  const updates = Object.fromEntries((PRODUCT_EDITOR_FIELDS[tab] || []).map((key) => [key, draft[key]]))
  return { ...saved, ...updates }
}

export function isProductTabDirty(saved, draft, tab) {
  return (PRODUCT_EDITOR_FIELDS[tab] || []).some((key) => JSON.stringify(saved[key]) !== JSON.stringify(draft[key]))
}
