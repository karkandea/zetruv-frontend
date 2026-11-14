import { formatCopy, storefrontCopy } from './storefrontCopy.js'

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

export function validateCheckoutField(field, raw, copy = storefrontCopy.id) {
  if (field.prohibited) return copy.prohibitedCredential
  const value = trim(raw)
  if (!value) return field.required ? formatCopy(copy.enter, { field: field.label }) : ''
  if (value.length > field.maxLength) return formatCopy(copy.mustHaveNoMoreThanCharacters, { field: field.label, max: field.maxLength })
  if (field.type === 'Number' && !/^\d+$/.test(value)) return formatCopy(copy.mustContainOnlyNumbers, { field: field.label })
  if (field.type === 'Select' && field.options.length && !field.options.includes(value)) {
    return formatCopy(copy.chooseFieldOption, { field: field.label })
  }
  // A 'Text' field may explicitly accept username OR email; never enforce
  // email syntax on it without a distinct backend Email schema type.
  if (field.type === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return copy.invalidEmail
  }
  return ''
}

export function validateCheckoutAccount(fields, values, copy = storefrontCopy.id) {
  if (!fields?.length) return copy.accountSchemaUnavailable
  for (const field of fields) {
    const message = validateCheckoutField(field, values?.[field.slot], copy)
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

export function currentCatalogDifferences(items, catalogBySlug, copy = storefrontCopy.id) {
  const changes = []
  const problems = []
  for (const item of items) {
    const product = catalogBySlug?.[item.productSlug]
    if (!product) { problems.push({key:item.cartKey,message:copy.unverifiedProduct}); continue }
    const variant = product.variants?.find(v => v.id === item.variantId)
    if (!product.isAvailable || !variant || !variant.isAvailable ||
        (variant.stockQuantity != null && Number(variant.stockQuantity) < Number(item.quantity || 1))) {
      problems.push({key:item.cartKey,message:formatCopy(copy.variantStockUnavailable, { variant: item.variantName })})
      continue
    }
    const price = Number(variant.effectivePrice ?? variant.price)
    if (!Number.isFinite(price) || price <= 0) {
      problems.push({key:item.cartKey,message:formatCopy(copy.invalidVariantPrice, { variant: item.variantName })})
      continue
    }
    if (price !== Number(item.unitPrice)) {
      changes.push({key:item.cartKey,slug:item.productSlug,variantName:item.variantName,
        oldPrice:Number(item.unitPrice),newPrice:price,regularPrice:Number(variant.price ?? price)})
    }
  }
  return {changes,problems}
}

/** Describe repricing before the customer explicitly accepts a new quote. */
export function priceChangeExplanation(change, copy = storefrontCopy.id) {
  const name = String(change.variantName || copy.product.toLowerCase())
  const oldPrice = Number(change.oldPrice)
  const newPrice = Number(change.newPrice)
  const regularPrice = Number(change.regularPrice)
  const money = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
  const prices = { name, oldPrice: money(oldPrice), newPrice: money(newPrice) }
  if (Number.isFinite(regularPrice) && oldPrice < regularPrice && newPrice === regularPrice && newPrice > oldPrice) {
    return formatCopy(copy.promoPriceChanged, prices)
  }
  return formatCopy(copy.priceChanged, prices)
}

export function paymentSelectionAllowed(readiness, code) {
  return Boolean(readiness?.canAcceptLivePayments && code &&
    readiness.availableMethods?.some(m => m.code === code))
}
