import test from 'node:test'
import assert from 'node:assert/strict'
import { groupSearchProducts, searchProductHref, searchProductMeta } from './navbarSearchHelpers.js'

const product = (id, name, kind = 'TopUpGame') => ({ id, name, slug: `slug-${id}`, kind })
test('search dropdown waits for at least three characters', () => {
  assert.deepEqual(groupSearchProducts([product('1', 'Mobile Legends')], 'mo'), { best: [], suggestions: [] })
  assert.deepEqual(groupSearchProducts([], 'mobile'), { best: [], suggestions: [] })
})

test('sort best matches, deduplicate backend records, cap suggestions', () => {
  const items = [
    product('1', 'Other Mobile account', 'GameAccount'),
    product('2', 'Mobile Legends'),
    product('2', 'Mobile Legends'),
    ...Array.from({ length: 12 }, (_, i) => product(String(i + 3), `Mobile Item ${i}`)),
  ]
  const { best, suggestions } = groupSearchProducts(items, 'mobile')
  assert.equal(best[0].id, '2')
  assert.equal(best.length, 2)
  assert.equal(suggestions.length, 5)
  assert.equal(new Set([...best, ...suggestions].map(item => item.id)).size, 7)
})

test('real catalog product kinds resolve to existing storefront paths', () => {
  const examples = {
    TopUpGame: '/product/slug',
    TopUpLogin: '/product/slug/login',
    GameVoucher: '/product/voucher/slug',
    Joki: '/product/joki/slug',
    Merchandise: '/merchandise/slug',
    GameAccount: '/game-accounts/dota-2/slug',
  }
  for (const [kind, href] of Object.entries(examples)) {
    assert.equal(searchProductHref({ kind, slug: 'slug', gameSlug: 'dota-2' }), href)
    assert.ok(searchProductMeta({ kind }).badge)
  }
  assert.equal(searchProductHref({ kind: 'GameAccount', slug: 'slug' }), '/game-accounts')
})
