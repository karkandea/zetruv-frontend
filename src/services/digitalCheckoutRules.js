const forbiddenCredential = /(^|[_\s-])(otp|2fa|mfa|recovery|verification|security.code|backup.code)([_\s-]|$)/i
const trim = (v) => String(v ?? '').trim()

/** Normalize Indonesian mobile to the +62 E.164 presentation used by checkout. */
export function normalizeIndonesianWhatsApp(input) {
  const raw = trim(input).replace(/[\s().-]/g, '')
  if (!/^\+?\d+$/.test(raw)) return ''
  const digits = raw.replace(/^\+/, '')
  const canonical = digits.startsWith('0') ? '62' + digits.slice(1)
    : digits.startsWith('8') ? '62' + digits : digits
  if (!/^628\d{7,11}$/.test(canonical)) return ''
  return '+' + canonical
}

export function checkoutFields(product, scope) {
  return (product?.inputFields || [])
    .filter((f) => f.scope === scope)
    .slice().sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((field, index) => ({
      key: field.key,
      slot: scope === 'AccountValidation' ? index === 0 ? 'userId' : 'zone' : field.key,
      label: field.label || field.key || 'Informasi akun',
      type: field.type || 'Text',
      required: Boolean(field.isRequired),
      maxLength: Number(field.maxLength) || 200,
      options: Array.isArray(field.options) ? field.options : [],
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      prohibited: forbiddenCredential.test(field.key || '') || forbiddenCredential.test(field.label || ''),
    }))
}

export function validateCheckoutField(field, raw) {
  if (field.prohibited) return 'Kode OTP, 2FA, dan pemulihan tidak boleh diminta.'
  const value = trim(raw)
  if (!value) return field.required ? `Lengkapi ${field.label}.` : ''
  if (value.length > field.maxLength) return `${field.label} maksimal ${field.maxLength} karakter.`
  if (field.type === 'Number' && !/^\d+$/.test(value)) return `${field.label} harus berupa angka.`
  if (field.type === 'Select' && field.options.length && !field.options.includes(value)) {
    return `Pilih ${field.label} dari daftar tersedia.`
  }
  // A 'Text' field may explicitly accept username OR email; never enforce
  // email syntax on it without a distinct backend Email schema type.
  if (field.type === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Format email tidak valid.'
  }
  return ''
}

export function validateCheckoutAccount(fields, values) {
  if (!fields?.length) return 'Definisi field akun belum tersedia dari katalog.'
  for (const field of fields) {
    const message = validateCheckoutField(field, values?.[field.slot])
    if (message) return message
  }
  return ''
}

/** Share credentials only for the exact same product when user opts in. */
export function matchingAccountSource(items, item, shares) {
  const sourceKey = shares?.[item.cartKey]
  if (!sourceKey) return item.cartKey
  const source = items.find(x => x.cartKey === sourceKey)
  if (!source || source.fulfillmentMethod !== 'MANUAL_LOGIN' ||
      source.productId !== item.productId || source.cartKey === item.cartKey) return item.cartKey
  return source.cartKey
}

export function currentCatalogDifferences(items, catalogBySlug) {
  const changes = []
  const problems = []
  for (const item of items) {
    const product = catalogBySlug?.[item.productSlug]
    if (!product) { problems.push({key:item.cartKey,message:'Produk belum terverifikasi dari katalog.'}); continue }
    const variant = product.variants?.find(v => v.id === item.variantId)
    if (!product.isAvailable || !variant || !variant.isAvailable ||
        (variant.stockQuantity != null && Number(variant.stockQuantity) < Number(item.quantity || 1))) {
      problems.push({key:item.cartKey,message:`${item.variantName} sedang tidak tersedia atau stok tidak cukup.`})
      continue
    }
    const price = Number(variant.effectivePrice ?? variant.price)
    if (!Number.isFinite(price) || price <= 0) {
      problems.push({key:item.cartKey,message:`Harga ${item.variantName} belum valid.`})
      continue
    }
    if (price !== Number(item.unitPrice)) {
      changes.push({key:item.cartKey,slug:item.productSlug,variantName:item.variantName,
        oldPrice:Number(item.unitPrice),newPrice:price,regularPrice:Number(variant.price ?? price)})
    }
  }
  return {changes,problems}
}

export function paymentSelectionAllowed(readiness, code) {
  return Boolean(readiness?.canAcceptLivePayments && code &&
    readiness.availableMethods?.some(m => m.code === code))
}
