import test from 'node:test'
import assert from 'node:assert/strict'
import {
  toWibInput, wibInputToIso, flashState, overlappingFlashSales,
  discountPercent, validateFlashDraft, flashPayload,
} from './flashSaleAdminUtils.js'

const example = {
  name: 'DEV Gaming Week Flash Sale', slug: '', isActive: true,
  startsAt: '2026-11-02T17:00', endsAt: '2026-11-10T16:59',
  items: [{ productVariantId: 'v1', salePrice: 1300 }],
}
const variants = new Map([['v1', { id: 'v1', price: 1500, isActive: true, productActive: true, gameActive: true }]])

test('WIB edit converts UTC once, and save never shifts seven hours', () => {
  const utc = '2026-11-02T10:00:00+00:00'
  assert.equal(toWibInput(utc), '2026-11-02T17:00')
  assert.equal(wibInputToIso(toWibInput(utc)), '2026-11-02T10:00:00.000Z')
  assert.equal(flashPayload(example).endsAt, '2026-11-10T09:59:00.000Z')
  assert.equal(toWibInput(flashPayload(example).endsAt), example.endsAt)
})

test('reject invalid local date instead of silently rolling a calendar day', () => {
  assert.equal(wibInputToIso('2026-02-30T12:00'), null)
  assert.equal(wibInputToIso('2026-11-02T25:00'), null)
})

test('status is derived from activation and schedule', () => {
  const promo = { isActive: true, startsAt: '2026-11-02T10:00:00Z', endsAt: '2026-11-10T09:59:00Z' }
  assert.equal(flashState(promo, Date.parse('2026-11-01T00:00:00Z')), 'scheduled')
  assert.equal(flashState(promo, Date.parse('2026-11-09T00:00:00Z')), 'running')
  assert.equal(flashState(promo, Date.parse('2026-11-11T00:00:00Z')), 'ended')
  assert.equal(flashState({ ...promo, isActive: false }, Date.parse('2026-11-09T00:00:00Z')), 'inactive')
  assert.equal(flashState({ isActive: true, startsAt: '', endsAt: '' }), 'unscheduled')
})

test('colliding active Flash Sales are rejected; disabled ones do not block', () => {
  const current = { id: 'current', isFlashSale: true, isActive: true, startsAt: '2026-11-02T10:00:00Z', endsAt: '2026-11-10T09:59:00Z' }
  const candidate = { isActive: true, startsAt: '2026-11-05T00:00:00Z', endsAt: '2026-11-06T00:00:00Z' }
  assert.equal(overlappingFlashSales([current], candidate, 'different').length, 1)
  assert.equal(overlappingFlashSales([current], candidate, 'current').length, 0)
  assert.equal(overlappingFlashSales([{ ...current, isActive: false }], candidate, null).length, 0)
  assert.equal(overlappingFlashSales([current], { ...candidate, isActive: false }, null).length, 0)
})

test('price discount and backend order are deterministic', () => {
  assert.equal(discountPercent(1500, 1300), 13)
  assert.equal(discountPercent(16500, 14900), 10)
  assert.deepEqual(flashPayload({ ...example, items: [{ productVariantId: 'v1', salePrice: 1300 }, { productVariantId: 'v2', salePrice: 2000 }] }).items.map((i) => i.sortOrder), [0, 1])
})

test('prevent duplicate, inactive and above-normal variants, schedule errors', () => {
  assert.deepEqual(validateFlashDraft(example, variants, [], null), [])
  const duplicate = { ...example, items: [...example.items, ...example.items] }
  assert.ok(validateFlashDraft(duplicate, variants, [], null).some((x) => x.includes('duplikat')))
  const excessive = { ...example, items: [{ productVariantId: 'v1', salePrice: 1500 }] }
  assert.ok(validateFlashDraft(excessive, variants, [], null).some((x) => x.includes('lebih rendah')))
  const inactive = new Map([['v1', { ...variants.get('v1'), isActive: false }]])
  assert.ok(validateFlashDraft(example, inactive, [], null).some((x) => x.includes('nonaktif')))
  const reversed = { ...example, startsAt: '2026-11-11T10:00' }
  assert.ok(validateFlashDraft(reversed, variants, [], null).some((x) => x.includes('Jadwal selesai')))
})
