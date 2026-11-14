import { formatCopy, storefrontCopy } from './storefrontCopy.js'

const clean = (value) => String(value ?? '').trim()

/** Only backend-provided account-validation fields are accepted. */
export function accountRequirements(product) {
  const configured = Array.isArray(product?.inputFields)
    ? product.inputFields.filter(field => field.scope === 'AccountValidation') : []
  return configured.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((field, index) => ({
      key: field.key,
      slot: index === 0 ? 'userId' : index === 1 ? 'zone' : null,
      label: field.label || (index === 0 ? 'User ID' : 'Zona / Server'),
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      required: Boolean(field.isRequired),
      type: field.type || 'Text',
      maxLength: Number(field.maxLength) || 200,
    })).filter(field => field.slot)
}

/** A catalog lookup in flight is not a failed account validation. */
export function isCartCatalogPending(item, catalogProducts = {}, catalogErrors = {}) {
  if (!['AUTO_ID', 'MANUAL_LOGIN'].includes(item?.fulfillmentMethod)) return false
  const slug = item?.productSlug
  if (!slug) return false
  return !Object.prototype.hasOwnProperty.call(catalogProducts, slug) &&
    !Object.prototype.hasOwnProperty.call(catalogErrors, slug)
}

export function checkCartDestination(item, requirements, copy = storefrontCopy.id) {
  if (item.fulfillmentMethod !== 'AUTO_ID') return { valid: true, message: '' }
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return { valid: false, message: copy.accountDetailsCouldnTBeVerifiedReload }
  }
  for (const field of requirements) {
    const value = clean(item.accountFields?.[field.slot])
    if (field.required && !value) return { valid: false, message: formatCopy(copy.enter, { field: field.label }) }
    if (value.length > field.maxLength) return { valid: false, message: formatCopy(copy.mustHaveNoMoreThanCharacters, { field: field.label, max: field.maxLength }) }
    if (field.type === 'Number' && value && !/^\d+$/.test(value)) {
      return { valid: false, message: formatCopy(copy.mustContainOnlyNumbers, { field: field.label }) }
    }
  }
  return { valid: true, message: '' }
}

export function getCartItemProblem(item, requirementMap, copy = storefrontCopy.id) {
  if (!item?.variantId) return copy.theProductOptionIsInvalid
  if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) return copy.theProductPriceIsInvalid
  const qty = Number(item.quantity)
  if (!Number.isInteger(qty) || qty < 1 || qty > 99 ||
      (item.maxQuantity != null && qty > Number(item.maxQuantity))) {
    return copy.theQuantityExceedsTheAllowedLimit
  }
  const productRequirements = requirementMap?.[item.productSlug]
  return checkCartDestination(item, productRequirements, copy).message
}
