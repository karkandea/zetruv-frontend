import test from 'node:test'
import assert from 'node:assert/strict'
import { getDigitalPricing } from './digitalCartPricing.js'
import { accountRequirements, checkCartDestination } from './digitalCartValidation.js'
import { addCartItem, readCart, removeCartItem, restoreCartItem, updateCartAccount, updateCartQuantity, supportsCartQuantity, cartCount, setAuthenticatedCart, leaveAuthenticatedCart, readGuestCart, clearGuestCart, awaitCartPersistence } from './cartService.js'

const storage = new Map()
const listeners = new Map()
globalThis.window = {
  localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
  addEventListener: (name, fn) => { listeners.set(name, [...(listeners.get(name) || []), fn]) },
  removeEventListener: () => {},
  dispatchEvent: (event) => { (listeners.get(event.type) || []).forEach(fn => fn(event)) },
}
if (!globalThis.CustomEvent) globalThis.CustomEvent = class { constructor(type, opt) { this.type = type; this.detail = opt?.detail } }
const item = (userId, zone, id = 'v1') => ({
  productId: 'p1', productSlug: 'mobile-legends', productKind: 'TopUpGame',
  fulfillmentMethod: 'AUTO_ID', variantId: id, variantName: '5 Diamond',
  unitPrice: 1234, regularPrice: 1500, quantity: 1, maxQuantity: 99,
  accountFields: { userId, zone },
})
test('real effective sale price and service fee 0 match backend pricing contract', () => {
  assert.deepEqual(getDigitalPricing([item('123','42')]), {subtotal:1500,discount:266,serviceFee:0,total:1234})
})
test('SKU + same destination merges, other targets remain separate', () => {
  storage.clear()
  addCartItem(item(' 123 ', ' 42 '))
  addCartItem(item('123','42'))
  addCartItem(item('123','99'))
  addCartItem(item('123','42','v2'))
  assert.equal(readCart().length,3)
  assert.equal(readCart()[0].quantity,2)
  assert.equal(cartCount(),4)
})
test('editing only the selected destination merges matching keys', () => {
  const rows=readCart()
  const second=rows.find(x=>x.accountFields.zone==='99')
  updateCartAccount(second.cartKey,{userId:'123',zone:'42'})
  assert.equal(readCart().length,2)
  assert.equal(readCart().find(x=>x.variantId==='v1').quantity,3)
})
test('quantity cannot fall below one and Undo restores removed item', () => {
  const original=readCart()[0]
  updateCartQuantity(original.cartKey,0)
  assert.equal(readCart()[0].quantity,1)
  const removedSnapshot = readCart()[0]
  removeCartItem(original.cartKey)
  assert.equal(readCart().length,1)
  restoreCartItem(removedSnapshot,0)
  assert.equal(readCart().length,2)
  assert.equal(readCart()[0].quantity,1)
})
test('Top Up Via ID does not show quantity stepper', () => {
  assert.equal(supportsCartQuantity(item('123','42')),false)
  assert.equal(supportsCartQuantity({...item('123','42'),productKind:'GameVoucher',fulfillmentMethod:'VOUCHER_CODE'}),true)
})
test('backend input definitions drive destination validation', () => {
  const fields=accountRequirements({inputFields:[
    {key:'userid',label:'User ID',scope:'AccountValidation',isRequired:true,type:'Number',sortOrder:0,maxLength:14},
    {key:'zoneid',label:'Zona',scope:'AccountValidation',isRequired:true,type:'Number',sortOrder:1,maxLength:8},
  ]})
  assert.equal(checkCartDestination(item('abc','42'),fields).valid,false)
  assert.equal(checkCartDestination(item('123',''),fields).valid,false)
  assert.equal(checkCartDestination(item('123','42'),fields).valid,true)
  assert.equal(checkCartDestination(item('123','42'),undefined).valid,false)
})

test('authenticated remote cart never leaks to anonymous localStorage on logout', async()=>{
  storage.clear()
  addCartItem(item('guest','10'))
  let persisted=null
  setAuthenticatedCart([item('account','20')],async rows=>{persisted=rows})
  assert.equal(readCart()[0].accountFields.userId,'account')
  updateCartQuantity(readCart()[0].cartKey,2)
  await awaitCartPersistence()
  assert.equal(persisted[0].quantity,2)
  assert.equal(readGuestCart()[0].accountFields.userId,'guest')
  leaveAuthenticatedCart()
  assert.equal(readCart()[0].accountFields.userId,'guest')
  clearGuestCart()
  assert.equal(readCart().length,0)
})
