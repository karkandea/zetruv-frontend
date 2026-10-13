import { apiRequest } from '../api/httpClient'

export const getCheckoutPaymentOptions = () =>
  apiRequest('/checkout/payment-options', { method: 'GET', cache: 'no-store' })

export const previewCheckoutVoucher = ({ code, items, phone, email }, signal) =>
  apiRequest('/checkout/vouchers/preview', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      code, items: items.map(item => ({
        productVariantId: item.variantId,
        quantity: Number(item.quantity || 1),
      })),
      customerPhone: phone || undefined,
      customerEmail: email || undefined,
    }),
  })

export const authenticateCheckoutCustomer = (email, password) =>
  apiRequest('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })

export const createVerifiedCheckoutOrder = (body, accessToken, idempotencyKey) =>
  apiRequest('/checkout/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })

export const startOrderPayment = (order, methodCode) =>
  apiRequest(`/checkout/orders/${encodeURIComponent(order.id)}/payment?methodCode=${encodeURIComponent(methodCode)}`, {
    method: 'POST',
    headers: { 'X-Order-Access-Token': order.orderAccessToken },
    body: JSON.stringify({}),
  })

export const getOrderPaymentStatus = (order) =>
  apiRequest(`/checkout/orders/${encodeURIComponent(order.id)}/payment`, {
    method: 'GET',
    cache: 'no-store',
    headers: { 'X-Order-Access-Token': order.orderAccessToken },
  })

/** Recover only an existing order owned by the authenticated customer. */
export const recoverVerifiedCheckoutOrder = (accessToken, idempotencyKey) =>
  apiRequest('/checkout/orders/recovery', {
    method:'GET', cache:'no-store',
    headers:{ Authorization:`Bearer ${accessToken}`, 'Idempotency-Key':idempotencyKey },
  })
