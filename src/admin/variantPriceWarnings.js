function amountFromName(name) {
  const match = String(name || '').trim().match(/^(\d+(?:[.,]\d+)?)\s+([\p{L}]+)$/u)
  if (!match) return null
  const amount = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(amount) || amount <= 0) return null
  return { amount, unit: match[2].toLocaleLowerCase('id').replace(/s$/, '') }
}

// An advisory only: never auto-adjust prices or block an intentional promotion.
export function variantPriceWarning(candidate, siblings = []) {
  const parsed = amountFromName(candidate?.name)
  const price = Number(candidate?.price)
  if (!parsed || !Number.isFinite(price) || price <= 0) return ''
  const group = String(candidate.groupName || '').trim().toLocaleLowerCase('id')

  for (const other of siblings) {
    if (other.id && candidate.id && other.id === candidate.id) continue
    const reference = amountFromName(other.name)
    const otherPrice = Number(other.price)
    if (!reference || !Number.isFinite(otherPrice) || otherPrice <= 0) continue
    if (reference.unit !== parsed.unit || reference.amount === parsed.amount) continue
    if (String(other.groupName || '').trim().toLocaleLowerCase('id') !== group) continue
    if ((parsed.amount > reference.amount && price <= otherPrice) ||
        (parsed.amount < reference.amount && price >= otherPrice)) {
      return 'Harga ' + candidate.name + ' (' + new Intl.NumberFormat('id-ID').format(price) +
        ') terlihat tidak konsisten dengan ' + other.name + ' (' +
        new Intl.NumberFormat('id-ID').format(otherPrice) + '). Periksa nominal dan harga sebelum menyimpan.'
    }
  }
  return ''
}
