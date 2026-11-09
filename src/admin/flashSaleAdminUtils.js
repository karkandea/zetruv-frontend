export const WIB_ZONE = 'Asia/Jakarta'

const wibParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: WIB_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export function toWibInput(instant) {
  if (!instant) return ''
  const value = new Date(instant)
  if (!Number.isFinite(value.getTime())) return ''
  const parts = Object.fromEntries(wibParts.formatToParts(value).map(({ type, value: text }) => [type, text]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function wibInputToIso(input) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(input))) return null
  const parsed = new Date(`${input}:00+07:00`)
  if (!Number.isFinite(parsed.getTime()) || toWibInput(parsed) !== input) return null
  return parsed.toISOString()
}

export function flashState(promo, now = Date.now()) {
  if (!promo?.isActive) return 'inactive'
  const start = promo.startsAt ? new Date(promo.startsAt).getTime() : NaN
  const end = promo.endsAt ? new Date(promo.endsAt).getTime() : NaN
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'unscheduled'
  if (end <= now) return 'ended'
  if (start > now) return 'scheduled'
  return 'running'
}

export const FLASH_STATUS = {
  running: 'Sedang Berjalan', scheduled: 'Terjadwal', ended: 'Selesai', inactive: 'Nonaktif', unscheduled: 'Belum Dijadwalkan',
}

export function overlappingFlashSales(promotions, draft, selfId) {
  if (!draft?.isActive) return []
  const start = Date.parse(draft.startsAt)
  const end = Date.parse(draft.endsAt)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return []
  return (promotions || []).filter((other) => other.id !== selfId && other.isFlashSale && other.isActive &&
    start <= Date.parse(other.endsAt) && end >= Date.parse(other.startsAt))
}

export function discountPercent(normal, sale) {
  if (!(Number(normal) > 0) || !Number.isFinite(Number(sale))) return null
  return Math.round((1 - Number(sale) / Number(normal)) * 100)
}

export function validateFlashDraft(draft, variantById, promotions, selfId) {
  const errors = []
  if (!draft.name?.trim()) errors.push('Isi nama Flash Sale.')
  const startsAt = wibInputToIso(draft.startsAt)
  const endsAt = wibInputToIso(draft.endsAt)
  if (!startsAt || !endsAt) errors.push('Isi jadwal mulai dan selesai dalam WIB.')
  else if (Date.parse(endsAt) <= Date.parse(startsAt)) errors.push('Jadwal selesai harus setelah jadwal mulai.')
  if (!draft.items?.length) errors.push('Tambahkan setidaknya satu varian.')
  const seen = new Set()
  for (const [index, item] of (draft.items || []).entries()) {
    const variant = variantById.get(item.productVariantId)
    if (!variant) { errors.push(`Baris ${index + 1}: pilih varian yang tersedia.`); continue }
    if (seen.has(item.productVariantId)) errors.push(`Baris ${index + 1}: varian tidak boleh duplikat.`)
    seen.add(item.productVariantId)
    if (!variant.isActive || !variant.productActive || !variant.gameActive) errors.push(`Baris ${index + 1}: varian atau produk nonaktif tidak bisa ditayangkan.`)
    if (!Number.isFinite(Number(item.salePrice)) || Number(item.salePrice) <= 0 || Number(item.salePrice) >= Number(variant.price)) {
      errors.push(`Baris ${index + 1}: harga promo harus lebih dari Rp0 dan lebih rendah dari harga normal.`)
    }
  }
  if (startsAt && endsAt && Date.parse(endsAt) > Date.parse(startsAt) && overlappingFlashSales(promotions, {
    isActive: draft.isActive, startsAt, endsAt,
  }, selfId).length) errors.push('Jadwal bertabrakan dengan Flash Sale aktif lainnya. Ubah jadwal atau nonaktifkan salah satunya.')
  return errors
}

export function flashPayload(draft) {
  const slug = (draft.slug || draft.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    name: draft.name.trim(), slug, isActive: Boolean(draft.isActive), isFlashSale: true,
    startsAt: wibInputToIso(draft.startsAt), endsAt: wibInputToIso(draft.endsAt),
    items: draft.items.map((row, index) => ({ productVariantId: row.productVariantId, salePrice: Number(row.salePrice), sortOrder: index })),
  }
}
