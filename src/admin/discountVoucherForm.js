export const VOUCHER_TYPES = ['Fixed', 'Percentage']

const optionalNumber = (value) => value === '' || value == null ? null : Number(value)

export function toLocalDatetime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function toVoucherPayload(form) {
  return {
    code: String(form.code || '').trim().toUpperCase(),
    type: form.type,
    value: Number(form.value),
    maximumDiscount: form.type === 'Percentage' ? optionalNumber(form.maximumDiscount) : null,
    minimumSpend: Number(form.minimumSpend || 0),
    applicableKind: form.applicableKind || null,
    maxUses: optionalNumber(form.maxUses),
    maxUsesPerCustomer: optionalNumber(form.maxUsesPerCustomer),
    isActive: Boolean(form.isActive),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
  }
}

export function validateVoucherForm(form) {
  if (!/^[A-Z0-9_-]{4,32}$/.test(String(form.code || '').trim().toUpperCase())) return 'Code must be 4–32 characters (A–Z, 0–9, - or _).'
  if (!VOUCHER_TYPES.includes(form.type)) return 'Choose a valid discount type.'
  if (!Number.isFinite(Number(form.value)) || Number(form.value) <= 0) return 'Discount value must be positive.'
  if (form.type === 'Percentage' && Number(form.value) > 100) return 'Percentage cannot exceed 100%.'
  if (form.type === 'Percentage' && form.maximumDiscount !== '' && form.maximumDiscount != null && Number(form.maximumDiscount) <= 0) return 'Maximum discount must be positive.'
  if (!Number.isFinite(Number(form.minimumSpend)) || Number(form.minimumSpend) < 0) return 'Minimum spend cannot be negative.'
  if (['maxUses', 'maxUsesPerCustomer'].some(key => form[key] !== '' && form[key] != null && (!Number.isInteger(Number(form[key])) || Number(form[key]) <= 0))) return 'Usage limits must be positive whole numbers.'
  const from = Date.parse(form.startsAt)
  const until = Date.parse(form.endsAt)
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from) return 'End date must be later than start date.'
  return null
}
