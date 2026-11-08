import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accountDefinitionPayload, accountListingPayload, attributeKeyFromLabel, parseAccountOptions } from './gameAccountValues.js'

test('admin label creates a stable internal key, avoiding duplicates and invalid prefixes', () => {
  assert.equal(attributeKeyFromLabel('Jumlah Skin'), 'jumlah_skin')
  assert.equal(attributeKeyFromLabel('Jumlah Skin', ['jumlah_skin']), 'jumlah_skin_2')
  assert.equal(attributeKeyFromLabel('123 Rank'), 'info_123_rank')
  assert.equal(attributeKeyFromLabel('A'), 'info_a')
  assert.match(attributeKeyFromLabel('⭐'), /^[a-z][a-z0-9_]+$/)
})

test('schema choices are trimmed, without accidentally sent options for Number', () => {
  assert.deepEqual(parseAccountOptions(' Mythic, Legend\nEpic '), ['Mythic','Legend','Epic'])
  assert.deepEqual(accountDefinitionPayload({ key: 'starlight', label: 'Starlight', type: 'Boolean', optionsText: 'a,b', isRequired: false, isActive: true, showOnCard: true, sortOrder: '5' }), {
    key:'starlight', label:'Starlight', type:'Boolean', options:[], isRequired:false, isActive:true, showOnCard:true, sortOrder:5,
  })
})

test('listing includes game-specific active values only and preserves false/zero', () => {
  const schema = [
    { key:'rank', type:'Select', isActive:true },
    { key:'skinCount', type:'Number', isActive:true },
    { key:'starlight', type:'Boolean', isActive:true },
    { key:'heroes', type:'MultiSelect', isActive:true },
    { key:'archived', type:'Text', isActive:false },
  ]
  assert.deepEqual(accountListingPayload(schema, { rank:' Mythic ', skinCount:'0', starlight:false, heroes:['Miya'], archived:'secret', mmr:9000 }), {
    attributes: { rank:'Mythic', skinCount:0, starlight:false, heroes:['Miya'] },
  })
  assert.deepEqual(accountListingPayload(schema, {}), { attributes:{} })
})
