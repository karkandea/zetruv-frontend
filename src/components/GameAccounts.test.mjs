import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('homepage renders real Game Account cards and truthful empty state', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
  try {
    const { default: GameAccounts } = await vite.ssrLoadModule('/src/components/GameAccounts.jsx')
    const items = [
      { id: 'ml-1', slug: 'real-ml', gameSlug: 'mobile-legends', name: 'ML Listing',
        minPrice: 1850000, isAvailable: true,
        accountDetails: { attributes: [
          { key: 'rank', label: 'Rank', type: 'Select', value: 'Mythic', showOnCard: true, sortOrder: 0 },
          { key: 'starlight', label: 'Starlight', type: 'Boolean', value: false, showOnCard: true, sortOrder: 1 },
          { key: 'privateDetail', label: 'Hidden detail', type: 'Text', value: 'Secret', showOnCard: false, sortOrder: 2 },
        ] } },
      { id: 'dota-1', slug: 'real-dota', gameSlug: 'dota-2', name: 'Dota Listing',
        minPrice: null, isAvailable: false,
        accountDetails: { attributes: [
          { key: 'mmr', label: 'MMR', type: 'Number', value: 6200, showOnCard: true, sortOrder: 0 },
        ] } },
    ]
    const html = renderToStaticMarkup(createElement(GameAccounts, { items }))
    assert.match(html, /ML Listing/)
    assert.match(html, /Rank: Mythic/)
    assert.match(html, /Starlight: Tidak/)
    assert.doesNotMatch(html, /Hidden detail/)
    assert.match(html, /MMR: 6\.200/)
    assert.match(html, /TIDAK TERSEDIA/)
    assert.match(html, /Harga belum tersedia/)
    assert.match(html, /game-accounts\/mobile-legends\/real-ml/)
    assert.match(html, /game-accounts\/dota-2\/real-dota/)
    assert.doesNotMatch(html, /account-3|Mythical Glory|Global Region/)
    const empty = renderToStaticMarkup(createElement(GameAccounts, { items: [] }))
    assert.match(empty, /Belum ada akun game/)
    assert.doesNotMatch(empty, /TERSEDIA/)
  } finally {
    await vite.close()
  }
})
