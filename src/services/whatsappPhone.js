import { parsePhoneNumberFromString, getCountryCallingCode, isSupportedCountry } from 'libphonenumber-js'
export function parseWhatsAppInput(input, country = 'ID') {
  const raw = String(input ?? '').trim().replace(/[\s().-]/g, '')
  if (!/^\+?\d+$/.test(raw) || !isSupportedCountry(country)) return null
  // Preserve local Indonesian input compatibility, including a pasted 62 prefix.
  const text = country === 'ID' && raw.startsWith('62') ? '+' + raw : raw
  return parsePhoneNumberFromString(text, {defaultCountry: country, extract: false}) || null
}
export function normalizeWhatsApp(input, country = 'ID') {
  const parsed = parseWhatsAppInput(input, country)
  return parsed?.isValid() && !parsed.ext && /^\+[1-9]\d{7,14}$/.test(parsed.number) ? parsed.number : ''
}
export { getCountryCallingCode }
