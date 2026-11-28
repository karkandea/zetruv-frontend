export function groupLoginVariants(variants = []) {
  const entries = variants.map((variant, index) => ({ variant, index }))
  if (!entries.some(({ variant }) => variant.groupName?.trim())) return [{ label: '', items: entries }]
  const groups = new Map()
  for (const entry of entries) {
    const label = entry.variant.groupName?.trim() || '__ungrouped__'
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(entry)
  }
  return Array.from(groups, ([label, items]) => ({ label, items }))
}
