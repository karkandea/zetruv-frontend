import test from 'node:test'
import assert from 'node:assert/strict'
import { accountRequirements, checkCartDestination, isCartCatalogPending } from './digitalCartValidation.js'

const topUp = { fulfillmentMethod: 'AUTO_ID', productSlug: 'mobile-legends' }
const viaLogin = { fulfillmentMethod: 'MANUAL_LOGIN', productSlug: 'genshin-impact' }

test('a catalog fetch in flight is pending, not failed validation', () => {
  assert.equal(isCartCatalogPending(topUp), true)
  assert.equal(isCartCatalogPending(viaLogin), true)
  assert.equal(isCartCatalogPending({ fulfillmentMethod: 'VOUCHER_CODE', productSlug: 'voucher' }), false)
  assert.equal(isCartCatalogPending({ fulfillmentMethod: 'AUTO_ID' }), false)
})

test('catalog completion and failure both end loading while keeping validation strict', () => {
  assert.equal(isCartCatalogPending(topUp, { 'mobile-legends': { id: 'server-id' } }), false)
  assert.equal(isCartCatalogPending(topUp, { 'mobile-legends': null }, { 'mobile-legends': 'Error 503' }), false)
  assert.equal(isCartCatalogPending(topUp, {}, { 'mobile-legends': 'Error 503' }), false)
  assert.match(checkCartDestination(topUp, []).message, /belum dapat diverifikasi/)
  const fields = accountRequirements({ inputFields: [{ scope: 'AccountValidation', isRequired: true, key: 'uid', label: 'User ID' }] })
  assert.equal(checkCartDestination({ ...topUp, accountFields: { userId: '12345' } }, fields).valid, true)
  assert.equal(checkCartDestination({ ...topUp, accountFields: { userId: '' } }, fields).valid, false)
})
