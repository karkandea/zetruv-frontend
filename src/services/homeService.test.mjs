import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adaptHomepageResponse } from './homeAdapter.js'
import { identifyHomepageGame } from './homeArtwork.js'

test('empty CMS content stays empty; never synthesizes banners, products or articles', () => {
  const result = adaptHomepageResponse({ heroes: [], serviceCategories: [], merchandise: [], latestArticles: [] })
  assert.deepEqual(result.heroes, [])
  assert.deepEqual(result.serviceCategories, [])
  assert.deepEqual(result.merchandise, [])
  assert.deepEqual(result.latestArticles, [])
  assert.deepEqual(result.recentPurchases, [])
})

test('homepage adapter preserves CMS identifiers, routes, article slugs and real product statistics', () => {
  const hero = { id: 'hero-1', title: 'Live Banner', subtitle: 'Managed by CMS', imageUrl: '/media/banner.jpg' }
  const article = { id: 'article-1', slug: 'live-story', title: 'Live Story', category: { name: 'News' } }
  const data = adaptHomepageResponse({
    heroes: [hero], serviceCategories: [{ id: 'cat-1', slug: 'merchandise', name: 'Gear', kind: 'Merchandise' }],
    merchandise: [{ id: 'product-1', slug: 'real-jersey', name: 'Real Jersey', minPrice: 101000, soldQuantity: 0, rating: null, isAvailable: false }],
    latestArticles: [article],
  })
  assert.deepEqual(data.heroes, [hero])
  assert.equal(data.serviceCategories[0].kind, 'Merchandise')
  assert.equal(data.merchandise[0].slug, 'real-jersey')
  assert.equal(data.merchandise[0].sold, 0)
  assert.equal(data.merchandise[0].rating, null)
  assert.equal(data.merchandise[0].isAvailable, false)
  assert.equal(data.latestArticles[0].slug, 'live-story')
})

test('Flash Sale homepage mapping keeps product route and exact catalog variant', () => {
  const result = adaptHomepageResponse({ flashSale: { items: [{
    promotionItemId: 'promo-row', productSlug: 'mobile-legends', variantId: 'sku-5',
    gameName: 'Mobile Legends', variantName: '5 Diamond', originalPrice: 1500, salePrice: 1300,
  }] } })
  assert.deepEqual(result.flashSale[0], {
    id: 'promo-row', name: 'Mobile Legends', productSlug: 'mobile-legends', variantId: 'sku-5',
    image: undefined, price: 1300, originalPrice: 1500, item: '5 Diamond',
  })
})


test('homepage artwork identifies known games without mislabeling unknown products', () => {
  assert.equal(identifyHomepageGame('Mobile Legends: Bang Bang'), 'mlbb')
  assert.equal(identifyHomepageGame('Joki MLBB — Epic ke Legend'), 'mlbb')
  assert.equal(identifyHomepageGame('Genshin Impact'), 'genshin')
  assert.equal(identifyHomepageGame('PUBG Mobile'), 'pubg')
  assert.equal(identifyHomepageGame('Valorant'), 'valorant')
  assert.equal(identifyHomepageGame('Garena Free Fire'), 'freeFire')
  assert.equal(identifyHomepageGame('Call of Duty Mobile'), 'codm')
  assert.equal(identifyHomepageGame('Keyboard RGB'), null)
  assert.equal(identifyHomepageGame(''), null)
})
