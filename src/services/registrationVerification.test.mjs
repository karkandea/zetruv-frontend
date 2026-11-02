import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  clearPendingRegistration,
  readPendingRegistration,
  savePendingRegistration,
  validCustomerEmail,
} from './registrationVerification.js'

function fakeStorage() {
  const items = new Map()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  }
}

test('validates registration and resend email formats', () => {
  assert.equal(validCustomerEmail('test@example.com'), true)
  assert.equal(validCustomerEmail('not-an-email'), false)
  assert.equal(validCustomerEmail('test@example.com\nCc:attacker@example.com'), false)
  assert.equal(validCustomerEmail('a'.repeat(321) + '@example.com'), false)
})

test('stores the pending email and editable registration token only for this session', () => {
  const storage = fakeStorage()
  savePendingRegistration('test@example.com', 'secret-token', 24, storage)
  assert.deepEqual(readPendingRegistration(storage), { email: 'test@example.com', token: 'secret-token' })
  clearPendingRegistration(storage)
  assert.equal(readPendingRegistration(storage), null)
})

test('expired registration edits are not reused', () => {
  const storage = fakeStorage()
  const oldNow = Date.now
  try {
    Date.now = () => 100_000
    savePendingRegistration('test@example.com', 'old-token', 1, storage)
    Date.now = () => 100_000 + 61 * 60 * 1000
    assert.equal(readPendingRegistration(storage), null)
  } finally {
    Date.now = oldNow
  }
})

test('missing or forbidden storage does not prevent registration', () => {
  const storage = { getItem: () => { throw Error('blocked') }, removeItem: () => {}, setItem: () => { throw Error('blocked') } }
  assert.equal(readPendingRegistration(storage), null)
  assert.doesNotThrow(() => savePendingRegistration('test@example.com', 'token', 24, storage))
  assert.doesNotThrow(() => clearPendingRegistration(storage))
})
