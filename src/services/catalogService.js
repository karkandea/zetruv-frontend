import { apiRequest } from '../api/httpClient'

export async function getCatalogCategories() {
  return apiRequest('/catalog/categories')
}

export async function getCatalogProducts({
  kind,
  search = '',
  page = 1,
  pageSize = 50,
} = {}) {
  const params = new URLSearchParams()

  if (kind) params.set('kind', kind)
  if (search.trim()) params.set('q', search.trim())
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))

  return apiRequest(`/catalog/products?${params.toString()}`)
}
