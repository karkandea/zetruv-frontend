import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PAYMENT_CONTEXT_KEY, storePaymentContext, readPaymentContext,
  clearPaymentContext, normalizePaymentState, mayInitiatePayment,
  paymentLink, formatPaymentCountdown,
} from './paymentSession.js'

const storage = () => {
  const data = new Map()
  return { getItem:key => data.get(key) ?? null,
    setItem:(key,value)=>data.set(key,value), removeItem:key=>data.delete(key) }
}
const order = {
  id:'f3b928c8-0041-4dd8-8eee-58774d2c4862', orderNumber:'ZTR-TEST',
  orderAccessToken:'short-lived-backend-capability',
  orderAccessTokenExpiresAt:'2099-01-01T00:00:00Z',
  currency:'IDR',grandTotal:16500,
  items:[{productName:'Synthetic Test Game',variantName:'Test SKU',quantity:1,lineTotal:16500,
    loginCredentials:{password:'NEVER_PERSIST_THIS'}}],
}
test('save only safe order snapshot and tab-scoped access token',()=>{
  const s=storage()
  storePaymentContext(order,'QRIS',s)
  const raw=s.getItem(PAYMENT_CONTEXT_KEY)
  assert.ok(raw.includes('ZTR-TEST'))
  assert.ok(!raw.includes('NEVER_PERSIST_THIS'))
  assert.ok(!raw.includes('loginCredentials'))
  assert.equal(readPaymentContext(s).orderId,order.id)
  clearPaymentContext(s)
  assert.equal(readPaymentContext(s),null)
})
test('missing, corrupt, forged, or expired context never becomes an invoice',()=>{
  const s=storage()
  assert.equal(readPaymentContext(s),null)
  s.setItem(PAYMENT_CONTEXT_KEY,'not-json')
  assert.equal(readPaymentContext(s),null)
  s.setItem(PAYMENT_CONTEXT_KEY,JSON.stringify({version:1,orderId:'fake',orderAccessToken:'x'}))
  assert.equal(readPaymentContext(s),null)
  storePaymentContext(order,'QRIS',s)
  const expired={...readPaymentContext(s),orderAccessTokenExpiresAt:'2020-01-01T00:00:00Z'}
  s.setItem(PAYMENT_CONTEXT_KEY,JSON.stringify(expired))
  assert.equal(readPaymentContext(s),null)
})
test('only authenticated backend status is allowed to determine Paid',()=>{
  assert.equal(normalizePaymentState({orderId:order.id,state:'Paid'},order.id).state,'Paid')
  assert.throws(()=>normalizePaymentState({orderId:'other',state:'Paid'},order.id))
  assert.throws(()=>normalizePaymentState({orderId:order.id,state:'success'},order.id))
})
test('refresh and pending states MUST NEVER create another payment automatically',()=>{
  assert.equal(mayInitiatePayment({state:'Pending',canRetry:true,hasActivePaymentSession:true}),false)
  assert.equal(mayInitiatePayment({state:'Paid',canRetry:true,hasActivePaymentSession:false}),false)
  assert.equal(mayInitiatePayment({state:'Expired',canRetry:false,hasActivePaymentSession:false}),false)
  assert.equal(mayInitiatePayment({state:'Expired',canRetry:true,hasActivePaymentSession:false}),true)
  assert.equal(mayInitiatePayment({state:'NotStarted',canRetry:true,hasActivePaymentSession:false}),true)
})
test('redirect must be HTTPS and expiry countdown uses provider timestamp',()=>{
  assert.equal(paymentLink('https://checkout.xendit.co/pay/abc'),'https://checkout.xendit.co/pay/abc')
  assert.equal(paymentLink('javascript:alert(1)'),null)
  assert.equal(paymentLink('http://example.com'),null)
  assert.equal(formatPaymentCountdown('2026-10-13T10:01:05Z',Date.parse('2026-10-13T10:00:00Z')),'00:01:05')
  assert.equal(formatPaymentCountdown('2026-10-13T10:00:00Z',Date.parse('2026-10-13T10:01:00Z')),'00:00:00')
  assert.equal(formatPaymentCountdown(null),null)
})
