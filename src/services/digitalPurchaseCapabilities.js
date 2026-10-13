import { apiRequest } from '../api/httpClient'

export async function getManualLoginReadiness(productId) {
  if (!productId) throw new Error('Product ID is required to check the service.')
  return apiRequest(`/checkout/manual-login/readiness/${encodeURIComponent(productId)}`, {
    method: 'GET', cache: 'no-store',
  })
}

export async function verifyTopUpIdDestination(productId, fields) {
  return apiRequest('/game-account/validate', {
    method: 'POST',
    body: JSON.stringify({ productId, fields }),
  })
}
