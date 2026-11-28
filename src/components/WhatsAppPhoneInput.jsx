import { useMemo } from 'react'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { ChevronDown } from 'lucide-react'
import { getCountries } from 'libphonenumber-js'
import * as Flags from 'country-flag-icons/react/3x2'
import { getCountryCallingCode, parseWhatsAppInput } from '../services/whatsappPhone'
import '../styles/whatsapp-phone-input.css'

export default function WhatsAppPhoneInput({ id, country, value, onChange, onBlur, invalid }) {
  const locale = useNavbarLanguage()
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], {type:'region'})
    return getCountries().map(code => ({code, name:names.of(code), dial:getCountryCallingCode(code)}))
      .sort((a,b)=>a.name.localeCompare(b.name,locale))
  }, [locale])
  const Flag = Flags[country]
  const countryLabel = locale === 'en' ? 'Country calling code' : locale === 'ms' ? 'Kod negara' : 'Kode negara'
  function update(raw) {
    // An explicitly pasted international number selects its own country.
    const parsed = /^\s*\+/.test(raw) ? parseWhatsAppInput(raw, country) : null
    if (parsed?.country && parsed.isValid()) onChange(parsed.country, parsed.nationalNumber)
    else onChange(country,raw)
  }
  return <div className="whatsapp-phone-field" data-invalid={Boolean(invalid)}>
    <div className="whatsapp-country">
      <span className="whatsapp-country-display" aria-hidden="true">{Flag && <Flag className="whatsapp-flag"/>}<span>+{getCountryCallingCode(country)}</span><ChevronDown size={15}/></span>
      <select aria-label={countryLabel} value={country} onChange={e=>onChange(e.target.value,'')}>
        {countries.map(c=><option key={c.code} value={c.code}>{c.name} (+{c.dial})</option>)}
      </select>
    </div>
    <input id={id} type="tel" autoComplete="tel-national" inputMode="tel" maxLength={32}
      placeholder={country === 'ID' ? '812 3456 7890' : locale === 'en' ? 'Phone number' : locale === 'ms' ? 'Nombor telefon' : 'Nomor telepon'}
      value={value} aria-invalid={Boolean(invalid)} onBlur={onBlur} onChange={e=>update(e.target.value)}/>
  </div>
}
