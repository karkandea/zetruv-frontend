const types = new Set(['Text', 'Number', 'Boolean', 'Select', 'MultiSelect'])
const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

export function formatAccountValue(type, value) {
  if (!types.has(type) || value === null || value === undefined) return null
  if (type === 'Boolean') return typeof value === 'boolean' ? (value ? 'Ya' : 'Tidak') : null
  if (type === 'Number') return typeof value === 'number' && Number.isFinite(value)
    ? numberFormatter.format(value) : null
  if (type === 'MultiSelect') {
    if (!Array.isArray(value)) return null
    const selected = value.filter((item) => typeof item === 'string' && item.trim())
    return selected.length ? selected.join(', ') : null
  }
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function getAccountAttributes(details, { cardOnly = false, limit = Infinity } = {}) {
  if (!Array.isArray(details?.attributes)) return []
  return details.attributes
    .filter((field) => field && typeof field.key === 'string' &&
      typeof field.label === 'string' && field.label.trim() &&
      (!cardOnly || field.showOnCard === true))
    .map((field, index) => ({
      key: field.key,
      label: field.label.trim(),
      value: formatAccountValue(field.type, field.value),
      sortOrder: Number.isFinite(field.sortOrder) ? field.sortOrder : index,
      index,
    }))
    .filter((field) => field.value !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.index - b.index)
    .slice(0, limit)
}

export function summarizeAccountAttributes(details, options = {}) {
  return getAccountAttributes(details, options)
    .map((field) => `${field.label}: ${field.value}`).join(' · ')
}

export function accountProductHref(product) {
  return typeof product?.slug === 'string' && product.slug.trim()
    ? `/game-accounts/${encodeURIComponent(product.gameSlug || product.game?.slug || 'account')}/${encodeURIComponent(product.slug)}` : null
}

export function accountPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? `Rp${new Intl.NumberFormat('id-ID').format(value)}` : null
}
