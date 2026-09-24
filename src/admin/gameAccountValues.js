export const ACCOUNT_ATTRIBUTE_TYPES = ['Text', 'Number', 'Boolean', 'Select', 'MultiSelect']

export const isChoiceType = (type) => type === 'Select' || type === 'MultiSelect'

export function parseAccountOptions(value) {
  return String(value || '').split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
}

export function accountDefinitionPayload(form) {
  return {
    key: String(form.key || '').trim(),
    label: String(form.label || '').trim(),
    type: form.type,
    options: isChoiceType(form.type) ? parseAccountOptions(form.optionsText) : [],
    isRequired: Boolean(form.isRequired),
    isActive: Boolean(form.isActive),
    showOnCard: Boolean(form.showOnCard),
    sortOrder: Number(form.sortOrder || 0),
  }
}

export function accountListingPayload(schema, rawValues) {
  const attributes = {}
  for (const field of schema.filter((item) => item.isActive)) {
    const value = rawValues[field.key]
    if (field.type === 'Boolean') {
      if (value === true || value === false) attributes[field.key] = value
    } else if (field.type === 'MultiSelect') {
      if (Array.isArray(value) && value.length) attributes[field.key] = value
    } else if (field.type === 'Number') {
      if (value !== '' && value !== undefined && value !== null) attributes[field.key] = Number(value)
    } else if (typeof value === 'string' && value.trim()) {
      attributes[field.key] = value.trim()
    }
  }
  return { attributes }
}
