import test from 'node:test'
import assert from 'node:assert/strict'
import { productLoginErrors, variantLoginErrors, catalogServerField } from './catalogLoginValidation.js'
import { groupLoginVariants } from '../services/groupLoginVariants.js'
const categories = [{ id: 'c', kind: 'TopUpLogin' }], games = [{ id: 'g' }]
const product = { name: 'Genshin Impact', categoryId: 'c', kind: 'TopUpLogin', gameId: 'g', shortDescription: 'Top up melalui login resmi.', description: '' }
const variant = { name: '60 Genesis Crystals', sku: 'GI-LOGIN-60', price: '15000', compareAtPrice: '', stockQuantity: '', groupName: '' }
test('required fields and whitespace', () => {
  assert.deepEqual(productLoginErrors(product, categories, games), {})
  assert.deepEqual(Object.keys(productLoginErrors({ ...product, name: ' ', categoryId: '', gameId: '', shortDescription: '' }, categories, games)), ['name','categoryId','gameId','shortDescription'])
})
test('length limits', () => {
  assert.deepEqual(Object.keys(productLoginErrors({ ...product, name: 'a'.repeat(81), shortDescription: 'a'.repeat(161), description: 'a'.repeat(2001) }, categories, games)), ['name','shortDescription','description'])
})
test('valid variant and optional stock', () => {
  assert.deepEqual(variantLoginErrors(variant), {})
  assert.deepEqual(variantLoginErrors({ ...variant, compareAtPrice: '20000', stockQuantity: '0' }), {})
})
test('invalid price, compare, stock, SKU', () => {
  assert.deepEqual(Object.keys(variantLoginErrors({ ...variant, name: ' ', sku: 'bad sku', price: '', compareAtPrice: '-1', stockQuantity: '1.2' })), ['name','sku','price','compareAtPrice','stockQuantity'])
  assert.ok(variantLoginErrors({ ...variant, price: '0' }).price)
  assert.ok(variantLoginErrors({ ...variant, price: '1.2' }).price)
  assert.ok(variantLoginErrors({ ...variant, compareAtPrice: '15000' }).compareAtPrice)
  assert.ok(variantLoginErrors({ ...variant, stockQuantity: '2147483648' }).stockQuantity)
})
test('duplicate SKU case insensitive; self excluded', () => {
  const siblings = [{ id: '1', sku: 'gi-login-60' }]
  assert.ok(variantLoginErrors(variant, siblings).sku)
  assert.deepEqual(variantLoginErrors(variant, siblings, '1'), {})
  assert.equal(catalogServerField('SKU already exists.'), 'sku')
})
test('package group preserves variant indexes and ungrouped fallback', () => {
  const result = groupLoginVariants([{ groupName:'Coins' }, {}, { groupName:'Coins' }])
  assert.deepEqual(result.map(g => [g.label, g.items.map(x=>x.index)]), [['Coins',[0,2]],['__ungrouped__',[1]]])
  assert.equal(groupLoginVariants([{}])[0].label, '')
})
