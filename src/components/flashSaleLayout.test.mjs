import test from 'node:test'
import assert from 'node:assert/strict'
import { getFlashSalePages } from './flashSaleLayout.js'

test('zero products returns no pages', () => {
  assert.deepEqual(getFlashSalePages([], 3), [])
  assert.deepEqual(getFlashSalePages(null, 3), [])
})

test('one or two products are never padded or duplicated', () => {
  for (const count of [1, 2]) {
    const items = Array.from({ length: count }, (_, index) => index + 1)
    assert.deepEqual(getFlashSalePages(items, 3), [items])
  }
})

test('three products maintain a single full desktop row', () => {
  assert.deepEqual(getFlashSalePages([1, 2, 3], 3), [[1, 2, 3]])
})

test('four or more products paginate with three visible on desktop', () => {
  assert.deepEqual(getFlashSalePages([1, 2, 3, 4], 3), [[1, 2, 3], [2, 3, 4]])
  assert.deepEqual(getFlashSalePages([1, 2, 3, 4, 5], 3), [[1, 2, 3], [3, 4, 5]])
  assert.deepEqual(getFlashSalePages([1, 2, 3, 4, 5, 6, 7], 3), [[1, 2, 3], [4, 5, 6], [5, 6, 7]])
})

test('mobile renders one product per slide and reaches every product', () => {
  assert.deepEqual(getFlashSalePages([1, 2, 3, 4], 1), [[1], [2], [3], [4]])
})

test('tablet renders two items per page without a sparse last page', () => {
  assert.deepEqual(getFlashSalePages([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [4, 5]])
})

test('every product remains reachable across viewport sizes', () => {
  for (let count = 1; count <= 30; count++) {
    const items = Array.from({ length: count }, (_, index) => index)
    for (const perPage of [1, 2, 3]) {
      const pages = getFlashSalePages(items, perPage)
      assert.equal(pages.length, Math.ceil(count / perPage))
      assert.deepEqual([...new Set(pages.flat())].sort((a, b) => a - b), items)
      assert.ok(pages.every((page) => page.length === Math.min(count, perPage)))
    }
  }
})
