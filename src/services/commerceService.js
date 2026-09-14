import { apiRequest } from '../api/httpClient'

export function validateGameAccount(productId, fields) {
  return apiRequest('/game-account/validate', {
    method: 'POST',
    body: JSON.stringify({ productId, fields }),
  })
}

export function createCheckoutOrder(payload) {
  return apiRequest('/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function initiatePayment(orderId, orderAccessToken) {
  return apiRequest(`/checkout/orders/${orderId}/payment`, {
    method: 'POST',
    headers: { 'X-Order-Access-Token': orderAccessToken },
  })
}

export function lookupOrder(payload) {
  return apiRequest('/orders/lookup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
