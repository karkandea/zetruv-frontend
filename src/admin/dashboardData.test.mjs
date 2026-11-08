import test from 'node:test'
import assert from 'node:assert/strict'
import { getDashboardCounts, getRecentOrders } from './dashboardData.js'

test('shows only metrics backed by available API responses', () => {
  const result = getDashboardCounts({ products: [], orders: { totalItems: 0, items: [] } })
  assert.equal(result.totalOrders, 0)
  assert.equal(result.totalProducts, 0)
  assert.equal(result.totalBanners, null)
  assert.equal(result.failedPayments, null)
})

test('counts promotions active within their schedule', () => {
  const date = Date.parse('2026-11-08T08:00:00Z')
  const result = getDashboardCounts({ promotions: [
    { isActive: true, startsAt: '2026-11-07T00:00:00Z', endsAt: '2026-11-09T00:00:00Z' },
    { isActive: true, startsAt: '2026-12-01T00:00:00Z' },
    { isActive: false },
    { isActive: true },
  ] }, date)
  assert.equal(result.activePromotions, 2)
})

test('orders are sorted by created date without mutating the response', () => {
  const items = [
    { id: 'a', createdAt: '2026-11-01' },
    { id: 'b', createdAt: '2026-11-05' },
  ]
  assert.deepEqual(getRecentOrders({ items }).map((item) => item.id), ['b', 'a'])
  assert.equal(items[0].id, 'a')
  assert.equal(getRecentOrders({}), null)
})
