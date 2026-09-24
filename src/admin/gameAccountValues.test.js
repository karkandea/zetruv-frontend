import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accountDefinitionPayload, accountListingPayload, parseAccountOptions } from './gameAccountValues.js'

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
