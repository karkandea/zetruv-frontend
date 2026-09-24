import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accountPrice, accountProductHref, formatAccountValue, getAccountAttributes, summarizeAccountAttributes } from './gameAccountPresentation.js'

const ml = { gameId: 'ml', attributes: [
  { key: 'level', label: 'Level', type: 'Number', value: 61, showOnCard: false, sortOrder: 30 },
  { key: 'skinCount', label: 'Jumlah Skin', type: 'Number', value: 119, showOnCard: true, sortOrder: 10 },
  { key: 'rank', label: 'Rank', type: 'Select', value: 'Mythic', showOnCard: true, sortOrder: 0 },
  { key: 'starlight', label: 'Starlight', type: 'Boolean', value: false, showOnCard: true, sortOrder: 20 },
  { key: 'missing', label: 'Kosong', type: 'Text', value: null, showOnCard: true, sortOrder: 40 },
] }

test('renders only real CMS-defined fields in order, preserves false and zero', () => {
  assert.deepEqual(getAccountAttributes(ml, { cardOnly: true }).map(({ key, value }) => [key, value]),
    [['rank', 'Mythic'], ['skinCount', '119'], ['starlight', 'Tidak']])
  assert.equal(getAccountAttributes(ml).length, 4)
  assert.equal(summarizeAccountAttributes(ml, { cardOnly: true, limit: 2 }),
    'Rank: Mythic · Jumlah Skin: 119')
  assert.equal(formatAccountValue('Number', 0), '0')
  assert.equal(formatAccountValue('Boolean', false), 'Tidak')
})

test('Dota attributes do not assume Mobile Legends fields', () => {
  const dota = { attributes: [
    { key: 'mmr', label: 'MMR', type: 'Number', value: 6200, showOnCard: true },
    { key: 'medal', label: 'Medal', type: 'Select', value: 'Immortal', showOnCard: true },
    { key: 'arcana', label: 'Arcana', type: 'Number', value: 3, showOnCard: false },
  ] }
  assert.equal(summarizeAccountAttributes(dota, { cardOnly: true }), 'MMR: 6.200 · Medal: Immortal')
  assert.equal(getAccountAttributes(dota).length, 3)
  assert.equal(formatAccountValue('MultiSelect', ['Miya', 'Layla']), 'Miya, Layla')
  assert.deepEqual(getAccountAttributes(null), [])
  assert.deepEqual(getAccountAttributes({ attributes: [{ key: 'bad', label: 'Bad', type: 'Text', value: {} }] }), [])
})

test('links and prices require real product data', () => {
  assert.equal(accountProductHref({ slug: 'mythic-account', gameSlug: 'mobile-legends' }), '/game-accounts/mobile-legends/mythic-account')
  assert.equal(accountProductHref({ slug: 'mythic-account' }), '/game-accounts/account/mythic-account')
  assert.equal(accountProductHref({ slug: 'akun game' }), '/game-accounts/account/akun%20game')
  assert.equal(accountProductHref({}), null)
  assert.equal(accountPrice(null), null)
  assert.equal(accountPrice(1850000), 'Rp1.850.000')
})
