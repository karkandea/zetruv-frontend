import test from 'node:test'
import assert from 'node:assert/strict'
import { variantPriceWarning } from './variantPriceWarnings.js'

test('warns if a larger diamond pack costs less', () => {
  const items = [{ id: 'a', name: '50 Diamond', price: 10234 }, { id: 'b', name: '100 Diamonds', price: 3234 }]
  assert.match(variantPriceWarning(items[1], items), /tidak konsisten/)
})

test('warns for same price on different quantities', () => {
  assert.ok(variantPriceWarning({ name: '500 Diamond', price: 3234 }, [{ name: '100 Diamond', price: 3234 }]))
})

test('does not flag legitimate monotonic prices or mixed units', () => {
  assert.equal(variantPriceWarning({ name: '100 Diamond', price: 10000 }, [{ name: '50 Diamonds', price: 5000 }]), '')
  assert.equal(variantPriceWarning({ name: '100 UC', price: 10000 }, [{ name: '50 Diamond', price: 12000 }]), '')
  assert.equal(variantPriceWarning({ name: '86 Diamond + Bonus', price: 8000 }, [{ name: '100 Diamond', price: 7000 }]), '')
})

test('does not compare variants from unrelated groups', () => {
  assert.equal(variantPriceWarning({ name: '100 Diamond', price: 1000, groupName: 'Promo' }, [{ name: '50 Diamond', price: 2000, groupName: 'Normal' }]), '')
})
