import test from 'node:test'
import assert from 'node:assert/strict'
import { nextFulfillmentStatuses } from './digitalPurchaseRules.js'

test('no fulfillment action before payment confirmation', () => {
  for (const state of ['Pending', 'Processing', 'Failed', 'Completed', 'Cancelled']) {
    assert.deepEqual(nextFulfillmentStatuses(state, 'Pending'), [])
    assert.deepEqual(nextFulfillmentStatuses(state, 'Failed'), [])
  }
})
test('only backend-supported paid item transitions are selectable', () => {
  assert.deepEqual(nextFulfillmentStatuses('Pending', 'Paid'), ['Processing'])
  assert.deepEqual(nextFulfillmentStatuses('Processing', 'Paid'), ['Completed', 'Failed'])
  assert.deepEqual(nextFulfillmentStatuses('Failed', 'Paid'), ['Processing'])
  assert.deepEqual(nextFulfillmentStatuses('Completed', 'Paid'), [])
  assert.deepEqual(nextFulfillmentStatuses('Cancelled', 'Paid'), [])
})
