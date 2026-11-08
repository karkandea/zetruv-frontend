import test from 'node:test'
import assert from 'node:assert/strict'
import { bannerPayload, bannerState, shiftItem, validateBanner } from './bannerUtils.js'

test('status uses active flag and scheduled date boundaries', () => {
  const now = Date.parse('2026-11-08T10:00:00Z')
  assert.equal(bannerState({ isActive: false }, now), 'Nonaktif')
  assert.equal(bannerState({ isActive: true, startsAt: '2026-11-09T00:00:00Z' }, now), 'Terjadwal')
  assert.equal(bannerState({ isActive: true, endsAt: '2026-11-07T00:00:00Z' }, now), 'Selesai')
  assert.equal(bannerState({ isActive: true, startsAt: '2026-11-07T00:00:00Z', endsAt: '2026-11-09T00:00:00Z' }, now), 'Aktif')
})

test('reorder keeps identity and leaves invalid positions unchanged', () => {
  const initial = ['a', 'b', 'c']
  assert.deepEqual(shiftItem(initial, 0, 2), ['b', 'c', 'a'])
  assert.deepEqual(shiftItem(initial, -1, 2), initial)
  assert.deepEqual(initial, ['a', 'b', 'c'])
})

const ready = {
  title: 'Promo', subtitle: 'Deskripsi', imageUrl: 'https://api.example.com/media/banners/2026/11/example.webp',
  primaryCtaLabel: '', primaryCtaUrl: '', secondaryCtaLabel: '', secondaryCtaUrl: '',
  isActive: true, scheduled: false, startsAt: '', endsAt: '',
}

test('publishing fails with broken image or mismatched button destination', () => {
  assert.match(validateBanner(ready, false), /Gambar tidak dapat dimuat/)
  assert.equal(validateBanner(ready, true), '')
  assert.match(validateBanner({ ...ready, primaryCtaLabel: 'Beli' }, true), /harus diisi bersama/)
  assert.match(validateBanner({ ...ready, scheduled: true, startsAt: '2026-11-10T08:00', endsAt: '2026-11-10T07:00' }, true), /harus setelah/)
})

test('inactive draft retains data, and payload preserves API contract', () => {
  assert.equal(validateBanner({ ...ready, isActive: false }, false), '')
  const payload = bannerPayload({ ...ready, primaryCtaLabel: 'Belanja', primaryCtaUrl: '/search' }, 30)
  assert.equal(payload.sortOrder, 30)
  assert.equal(payload.primaryCtaUrl, '/search')
  assert.equal(payload.startsAt, null)
  assert.ok(!Object.hasOwn(payload, 'scheduled'))
})
