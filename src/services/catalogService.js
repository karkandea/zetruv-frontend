import { apiRequest } from '../api/httpClient'

export async function getCatalogGames() {
  return apiRequest('/catalog/games')
}

export async function getCatalogCategories() {
  return apiRequest('/catalog/categories')
}

export async function getCatalogProducts({
  kind,
  game,
  search = '',
  page = 1,
  pageSize = 50,
} = {}) {
  const params = new URLSearchParams()

  if (kind) params.set('kind', kind)
  if (game) params.set('game', game)
  if (search.trim()) params.set('q', search.trim())
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))

  return apiRequest(`/catalog/products?${params.toString()}`)
}

export async function getCatalogProduct(slug) {
  return apiRequest(`/catalog/products/${encodeURIComponent(slug)}`)
}
