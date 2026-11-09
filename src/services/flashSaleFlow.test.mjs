import test from 'node:test'
import assert from 'node:assert/strict'
import { flashSaleProductHref, selectLinkedVariant, suspiciousCatalogPrice } from './flashSaleFlow.js'

test('Flash Sale cards retain original product slug and SKU ID', () => {
  assert.equal(flashSaleProductHref({ productSlug: 'mobile-legends', variantId: '5-diamond-id' }), '/product/mobile-legends?variant=5-diamond-id')
  assert.equal(flashSaleProductHref({ productSlug: 'game space', variantId: 'a/b' }), '/product/game%20space?variant=a%2Fb')
  assert.equal(flashSaleProductHref({ productSlug: 'mobile-legends' }), null)
})

test('linked variant is selected exactly, falling back visibly if unavailable', () => {
  const variants = [{ id: 'a', isAvailable: true }, { id: 'b', isAvailable: true }, { id: 'c', isAvailable: false }]
  assert.deepEqual(selectLinkedVariant(variants, 'b'), { variant: variants[1], invalidSelection: false })
  assert.deepEqual(selectLinkedVariant(variants, 'c'), { variant: variants[0], invalidSelection: true })
  assert.deepEqual(selectLinkedVariant(variants, 'missing'), { variant: variants[0], invalidSelection: true })
  assert.deepEqual(selectLinkedVariant(variants), { variant: variants[0], invalidSelection: false })
})

test('catalog anomaly warns on impossible denomination price order, without changing prices', () => {
  const variants = [
    { id: '50', productId: 'ml', name: '50 Diamond', price: 10234 },
    { id: '100', productId: 'ml', name: '100 Diamond', price: 3234 },
    { id: '250', productId: 'ml', name: '250 Diamond', price: 3234 },
    { id: 'else', productId: 'cod', name: '100 CP', price: 100 },
  ]
  assert.match(suspiciousCatalogPrice(variants[1], variants), /Harga katalog perlu ditinjau/)
  assert.match(suspiciousCatalogPrice(variants[0], variants), /Harga katalog perlu ditinjau/)
  assert.equal(suspiciousCatalogPrice({ id: 'x', productId: 'other', name: '5 Diamond', price: 1500 }, variants), '')
  assert.equal(variants[1].price, 3234)
})
