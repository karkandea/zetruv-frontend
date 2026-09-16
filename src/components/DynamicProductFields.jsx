function sortedFields(fields = []) {
  return [...fields].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label))
}

export function fieldsForScope(product, scope) {
  return sortedFields((product?.inputFields || []).filter((field) => field.scope === scope))
}

export function buildInputPayload(fields, values = {}) {
  const payload = {}
  for (const field of sortedFields(fields)) {
    const raw = values[field.key] ?? ''
    const value = field.isSensitive ? String(raw) : String(raw).trim()
    if (!value) {
      if (field.isRequired) return { payload: null, error: `${field.label} wajib diisi.` }
      continue
    }
    payload[field.key] = value
  }
  return { payload, error: null }
}

export function inputPayloadKey(fields, payload = {}) {
  return sortedFields(fields).map((field) => `${field.key}=${payload[field.key] ?? ''}`).join('|') || 'default'
}

export function inputPayloadLabel(fields, payload = {}) {
  return sortedFields(fields)
    .filter((field) => !field.isSensitive && payload[field.key])
    .slice(0, 2)
    .map((field) => payload[field.key])
    .join(' · ')
}

export default function DynamicProductFields({ fields = [], values = {}, onChange, className = 'checkout-fields', disabled = false }) {
  const ordered = sortedFields(fields)
  if (!ordered.length) return null

  return <div className={className}>{ordered.map((field) => {
    const common = {
      value: values[field.key] ?? '',
      onChange: (event) => onChange(field.key, event.target.value),
      placeholder: field.placeholder || '',
      required: Boolean(field.isRequired),
      maxLength: field.maxLength || undefined,
      disabled,
    }
    const type = field.type === 'Password' ? 'password' : field.type === 'Email' ? 'email' : field.type === 'Number' ? 'number' : 'text'
    return <label key={field.id || field.key}>
      <span>{field.label}{field.isRequired ? ' *' : ''}</span>
      {field.type === 'Select'
        ? <select {...common}><option value="">Pilih {field.label}</option>{(field.options || []).map((option) => <option value={option} key={option}>{option}</option>)}</select>
        : <input {...common} type={type} autoComplete={field.isSensitive ? 'new-password' : 'off'} />}
      {field.helpText && <small>{field.helpText}</small>}
    </label>
  })}</div>
}
