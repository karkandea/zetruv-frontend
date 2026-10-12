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

export function checkCartDestination(item, requirements) {
  if (item.fulfillmentMethod !== 'AUTO_ID') return { valid: true, message: '' }
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return { valid: false, message: 'Data akun belum dapat diverifikasi. Muat ulang katalog untuk melanjutkan.' }
  }
  for (const field of requirements) {
    const value = clean(item.accountFields?.[field.slot])
    if (field.required && !value) return { valid: false, message: `Lengkapi ${field.label}.` }
    if (value.length > field.maxLength) return { valid: false, message: `${field.label} maksimal ${field.maxLength} karakter.` }
    if (field.type === 'Number' && value && !/^\d+$/.test(value)) {
      return { valid: false, message: `${field.label} harus berupa angka.` }
    }
  }
  return { valid: true, message: '' }
}

export function getCartItemProblem(item, requirementMap) {
  if (!item?.variantId) return 'Varian produk tidak valid.'
  if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) return 'Harga produk tidak valid.'
  const qty = Number(item.quantity)
  if (!Number.isInteger(qty) || qty < 1 || qty > 99 ||
      (item.maxQuantity != null && qty > Number(item.maxQuantity))) {
    return 'Jumlah produk melebihi batas yang diizinkan.'
  }
  const productRequirements = requirementMap?.[item.productSlug]
  return checkCartDestination(item, productRequirements).message
}
