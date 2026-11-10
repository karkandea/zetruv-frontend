import test from 'node:test'
import assert from 'node:assert/strict'
import { activePaymentSession, canCancelOrder, hasOrderIssue, inDateRange, needsProcessing, orderAdvice, orderTimeline, paymentState, quickMatch } from './orderOperations.js'

test('unpaid pending is never an admin processing queue item', () => {
  const order = { status: 'Pending', paymentStatus: 'Pending', hasFulfillmentIssue: false }
  assert.equal(needsProcessing(order), false)
  assert.equal(quickMatch(order, 'waiting'), true)
  assert.equal(quickMatch(order, 'attention'), false)
  assert.match(orderAdvice(order).detail, /tidak boleh diproses/)
})

test('expired attempt is excluded from waiting, remains retryable order, and has clear CMS copy', () => {
  const order = { status: 'Pending', paymentStatus: 'Pending', paymentState: 'Expired', transactions: [
    { type: 'Payment', status: 'Expired', expiresAt: '2026-09-16T11:50:00Z' },
  ] }
  assert.equal(paymentState(order), 'Expired')
  assert.equal(quickMatch(order, 'waiting'), false)
  assert.equal(quickMatch(order, 'expired'), true)
  assert.equal(quickMatch(order, 'issues'), false)
  assert.equal(activePaymentSession(order), undefined)
  assert.match(orderAdvice(order).title, /Kedaluwarsa/)
  assert.match(orderAdvice(order).detail, /belum otomatis gagal/)
})

test('new attempt takes precedence over old expired attempt', () => {
  const order = { status: 'Pending', paymentStatus: 'Pending', paymentState: 'Pending', transactions: [
    { type: 'Payment', status: 'Pending', expiresAt: '2026-11-10T12:00:00Z' },
    { type: 'Payment', status: 'Expired', expiresAt: '2026-09-16T11:50:00Z' },
  ] }
  assert.ok(activePaymentSession(order, Date.parse('2026-11-10T11:00:00Z')))
  assert.equal(quickMatch(order, 'waiting'), true)
  assert.equal(quickMatch(order, 'expired'), false)
})

test('not started is distinct from active payment session', () => {
  const order = { status: 'Pending', paymentStatus: 'Pending', paymentState: 'NotStarted', transactions: [] }
  assert.equal(quickMatch(order, 'not-started'), true)
  assert.equal(quickMatch(order, 'waiting'), false)
  assert.match(orderAdvice(order).title, /Belum Dimulai/)
})

test('paid pending and paid failed fulfillment require attention', () => {
  assert.equal(needsProcessing({ status: 'Pending', paymentStatus: 'Paid' }), true)
  assert.equal(needsProcessing({ status: 'Processing', paymentStatus: 'Paid', hasFulfillmentIssue: true }), true)
  assert.equal(needsProcessing({ status: 'Processing', paymentStatus: 'Paid', hasPendingFulfillment: true }), true)
  assert.equal(needsProcessing({ status: 'Processing', paymentStatus: 'Paid', items: [{ fulfillmentStatus: 'Completed' }, { fulfillmentStatus: 'Pending' }] }), true)
  assert.equal(needsProcessing({ status: 'Processing', paymentStatus: 'Paid', hasFulfillmentIssue: false }), false)
  assert.equal(needsProcessing({ status: 'Completed', paymentStatus: 'Paid' }), false)
})

test('failed payment and paid cancellation are issues, not payments to process', () => {
  assert.equal(hasOrderIssue({ status: 'Pending', paymentStatus: 'Failed' }), true)
  assert.equal(hasOrderIssue({ status: 'Cancelled', paymentStatus: 'Paid' }), true)
  assert.equal(needsProcessing({ status: 'Cancelled', paymentStatus: 'Paid' }), false)
})

test('cancellation respects completed items and shipped orders', () => {
  assert.equal(canCancelOrder({ status: 'Pending', items: [{ fulfillmentStatus: 'Pending' }] }), true)
  assert.equal(canCancelOrder({ status: 'Processing', items: [{ fulfillmentStatus: 'Completed' }] }), false)
  assert.equal(canCancelOrder({ status: 'Pending', shipment: { status: 'Shipped' } }), false)
  assert.equal(canCancelOrder({ status: 'Completed' }), false)
})

test('history contains only real dated events, never inferred pending history', () => {
  const history = orderTimeline({ createdAt: '2026-11-09T10:00:00Z', status: 'Pending', paymentStatus: 'Pending', transactions: [] })
  assert.deepEqual(history.map((entry) => entry.kind), ['created'])
  const withPayment = orderTimeline({ createdAt: '2026-11-09T10:00:00Z', paidAt: '2026-11-09T11:00:00Z', transactions: [{ id: 1, type: 'Payment', status: 'Succeeded', createdAt: '2026-11-09T10:30:00Z' }] })
  assert.deepEqual(withPayment.map((entry) => entry.kind), ['created', 'transaction', 'paid'])
})

test('period bounds are inclusive', () => {
  assert.equal(inDateRange('2026-11-09T08:00:00Z', '2026-11-09', '2026-11-09'), true)
  assert.equal(inDateRange('2026-11-08T08:00:00Z', '2026-11-09', ''), false)
  assert.equal(inDateRange('2026-11-08T19:00:00Z', '2026-11-09', '2026-11-09'), true)
})

test('refund is distinct from cancellation, and multi-item completed fulfillment blocks cancellation', () => {
  assert.equal(orderAdvice({ status: 'Cancelled', paymentStatus: 'Paid' }).detail.includes('tidak otomatis'), true)
  assert.equal(orderAdvice({ status: 'Cancelled', paymentStatus: 'Refunded' }).title, 'Pesanan Dibatalkan')
  assert.equal(canCancelOrder({ status: 'Processing', items: [
    { fulfillmentStatus: 'Pending' }, { fulfillmentStatus: 'Completed' },
  ] }), false)
  assert.equal(canCancelOrder({ status: 'Processing', items: [
    { fulfillmentStatus: 'Pending' }, { fulfillmentStatus: 'Failed' },
  ] }), true)
})
