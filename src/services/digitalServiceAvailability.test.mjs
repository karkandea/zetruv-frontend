import test from 'node:test'
import assert from 'node:assert/strict'
import { viaLoginServiceStatus, checkoutActionHint } from './digitalServiceAvailability.js'

const entry = {cartKey:'g1',productName:'Genshin Impact',gameName:'Genshin Impact',fulfillmentMethod:'MANUAL_LOGIN'}
test('ACTIVE catalog listing does not imply authorization to collect game passwords', () => {
  assert.equal(viaLoginServiceStatus({fulfillmentMethod:'MANUAL_LOGIN',isAvailable:true},entry).available,false)
})
test('requires explicit provider permission AND fulfillment readiness', () => {
  assert.equal(viaLoginServiceStatus({fulfillmentMethod:'MANUAL_LOGIN',credentialCollectionPermitted:true},entry).available,false)
  assert.equal(viaLoginServiceStatus({fulfillmentMethod:'MANUAL_LOGIN',loginFulfillmentReady:true},entry).available,false)
  assert.equal(viaLoginServiceStatus({fulfillmentMethod:'MANUAL_LOGIN',loginFulfillmentReady:true,credentialCollectionPermitted:true},entry).available,false)
  assert.equal(viaLoginServiceStatus({fulfillmentMethod:'MANUAL_LOGIN',loginFulfillmentReady:true,credentialCollectionPermitted:true},entry,true).available,true)
})
test('Via ID remains unblocked by Via Login service status', () => {
  assert.equal(viaLoginServiceStatus({fulfillmentMethod:'AUTO_ID'},{fulfillmentMethod:'AUTO_ID'}).available,true)
})
test('existing Via Login cart gives an actionable primary blocker before form interaction', () => {
  assert.deepEqual(checkoutActionHint({items:[entry],blocked:[entry],phoneTouched:false,phoneValid:false}),{
    message:'Genshin Impact: layanan sementara belum tersedia.',type:'service',cartKey:'g1',action:'Hapus produk',
  })
})
test('no premature WhatsApp errors; reveal on blur then clear automatically', () => {
  assert.equal(checkoutActionHint({items:[{cartKey:'id'}],phoneTouched:false,phoneValid:false,methodLoading:true}),null)
  assert.equal(checkoutActionHint({items:[{cartKey:'id'}],phoneTouched:true,phoneValid:false,methodLoading:true}).type,'phone')
  assert.equal(checkoutActionHint({items:[{cartKey:'id'}],phoneTouched:true,phoneValid:true,methodLoading:true}),null)
})
test('payment outage prioritizes clear customer-facing wording', () => {
  const h=checkoutActionHint({items:[{cartKey:'id'}],phoneValid:false,phoneTouched:false,methodLoading:false,methodsReady:false})
  assert.equal(h.type,'payment')
  assert.doesNotMatch(h.message,/DEV|gateway|backend|fulfillment/)
})
test('account issue takes user to the correct product after submit', () => {
  const hint=checkoutActionHint({items:[{cartKey:'id'}],phoneValid:true,formTouched:true,accountProblem:{message:'Lengkapi Zona Mobile Legends.',cartKey:'id'},methodLoading:true})
  assert.equal(hint.cartKey,'id')
})
