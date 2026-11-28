import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PAYMENT_CONTEXT_KEY, storePaymentContext, readPaymentContext,
  clearPaymentContext, normalizePaymentState, mayInitiatePayment,
  paymentLink, formatPaymentCountdown, isMidtransMethod, midtransPaymentLink, midtransQrisImage, paymentThumbnail, enrichPaymentItems, QRIS_SIMULATOR_URL,
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

test('Midtrans channel redirects stay on exact sandbox Snap origin and path',()=>{
  assert.equal(isMidtransMethod('MIDTRANS_OTHER_QRIS'),true)
  assert.equal(isMidtransMethod('QRIS'),false)
  assert.ok(midtransPaymentLink('https://app.sandbox.midtrans.com/snap/v3/redirection/abc-123'))
  assert.ok(midtransPaymentLink('https://app.sandbox.midtrans.com/snap/v4/redirection/071e0c3d-dade-4148-a1b5-296ee8735b79'))
  assert.equal(midtransPaymentLink('https://app.sandbox.midtrans.com/snap/v4/other/abc'),null)
  assert.ok(midtransPaymentLink('https://app.sandbox.midtrans.com/snap/v2/vtweb/abc-123'))
  for(const url of ['https://app.midtrans.com/snap/v3/redirection/abc','https://app.sandbox.midtrans.com.evil.test/snap/v3/redirection/abc','https://app.sandbox.midtrans.com/other','https://app.sandbox.midtrans.com:444/snap/v3/redirection/abc']) assert.equal(midtransPaymentLink(url),null)
})

test('native QRIS only accepts exact provider image endpoint, never as a redirect',()=>{
  const image='https://api.sandbox.midtrans.com/v2/qris/12345678-1234-4234-8234-123456789012/qr-code'
  assert.equal(midtransQrisImage(image),image)
  assert.equal(midtransPaymentLink(image),null)
  for(const url of [image.replace('api.sandbox.midtrans.com','evil.test'),image.replace('/qr-code','/status'),image+'?x=1',image.replace('api.sandbox.midtrans.com','api.midtrans.com')]) assert.equal(midtransQrisImage(url),null)
})

test('payment summary persists safe display metadata and recovers old snapshots without altering prices',()=>{
 const s=storage()
 storePaymentContext({...order,items:[{...order.items[0],thumbnailUrl:'/assets/game.png',productKind:'Joki'}]},'QRIS',s)
 const item=readPaymentContext(s).items[0]
 assert.equal(item.thumbnailUrl,'/assets/game.png')
 assert.equal(item.kind,'Joki')
 assert.equal(item.lineTotal,16500)
 const [recovered]=enrichPaymentItems(order.items.map(({productName,variantName,quantity,lineTotal})=>({productName,variantName,quantity,lineTotal})),[{...order.items[0],kind:'Joki',thumbnailUrl:'https://example.test/game.png',lineTotal:999}])
 assert.equal(recovered.lineTotal,16500)
 assert.equal(recovered.kind,'Joki')
 assert.equal(recovered.thumbnailUrl,'https://example.test/game.png')
 assert.equal(paymentThumbnail('javascript:alert(1)'),null)
 assert.equal(paymentThumbnail('//example.test/game.png'),null)
 assert.equal(QRIS_SIMULATOR_URL,'https://simulator.sandbox.midtrans.com/v2/qris/index')
})

test('payment summary preserves order rank snapshot and filters unsafe icon URL',()=>{
  const s=storage()
  storePaymentContext({...order,items:[{...order.items[0],productKind:'Joki',rankFrom:'Epic V',rankTo:'Legend V',rankFromIconUrl:'/media/catalog/epic.webp',rankToIconUrl:'javascript:alert(1)'}]},'QRIS',s)
  const item=readPaymentContext(s).items[0]
  assert.equal(item.rankFrom,'Epic V')
  assert.equal(item.rankTo,'Legend V')
  assert.equal(item.rankFromIconUrl,'/media/catalog/epic.webp')
  assert.equal(item.rankToIconUrl,null)
})
