import { useState } from 'react'
import { ChevronDown, QrCode, Wallet, Landmark, Store, CreditCard, CalendarClock } from 'lucide-react'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import '../styles/payment-channel-picker.css'

const logos = {
  MIDTRANS_GOPAY:'gopay',MIDTRANS_DANA:'dana',MIDTRANS_OVO:'ovo',MIDTRANS_SHOPEEPAY:'shopeepay',
  MIDTRANS_BCA_VA:'bca',MIDTRANS_BNI_VA:'bni',MIDTRANS_BRI_VA:'bri',MIDTRANS_DANAMON_VA:'danamon',
}
const groups = [
  ['qris','QRIS','QRIS','QRIS',QrCode],
  ['wallet','E-Wallet','E-Wallet','E-Dompet',Wallet],
  ['bank','Transfer Bank / Virtual Account','Bank Transfer / Virtual Account','Pindahan Bank / Akaun Maya',Landmark],
  ['retail','Gerai Retail','Retail Outlets','Kedai Runcit',Store],
  ['card','Kartu Kredit / Debit','Credit / Debit Card','Kad Kredit / Debit',CreditCard],
  ['paylater','PayLater','PayLater','PayLater',CalendarClock],
]
export default function PaymentChannelPicker({methods,selected,onSelect,disabled}) {
  const language = useNavbarLanguage()
  const [expanded,setExpanded]=useState({})
  return <div className="payment-channel-picker">
    {groups.map(([key,id,en,my,Icon])=>{
      const rows=methods.filter(m=>m.group===key)
      if(!rows.length)return null
      const active=rows.find(m=>m.code===selected)
      const open=Boolean(expanded[key])
      const title=language==='id'?id:language==='my'?my:en
      if(rows.length===1){
        const m=rows[0]
        const label=key==='qris'||key==='card'?title:m.name
        return <section className="payment-channel-group" key={key}>
          <button type="button" className={'payment-channel-option payment-channel-option--single'+(active?' is-active':'')}
            aria-pressed={Boolean(active)} disabled={disabled||m.paymentFee==null} onClick={()=>onSelect(m.code)}>
            {logos[m.code] ? <img className="payment-channel-logo" src={'/assets/footer/payment-'+logos[m.code]+'.png'} alt=""/> : <Icon size={18} aria-hidden="true"/>}
            <strong className="payment-channel-name">{label}</strong><span className="payment-channel-radio" aria-hidden="true"/>
          </button>
        </section>
      }
      return <section className="payment-channel-group" key={key}>
        <button type="button" className="payment-channel-group__toggle" aria-expanded={open}
          onClick={()=>setExpanded(old=>({...old,[key]:!old[key]}))} >
          <Icon size={18} aria-hidden="true"/><strong>{title}{active && !open ? <span className="payment-channel-selected-name"> · {active.name}</span> : null}</strong><ChevronDown size={16} className={open?'is-open':''} aria-hidden="true"/>
        </button>
        {open && <div className="payment-channel-group__rows" role="group" aria-label={title}>
          {rows.map(m=><button type="button" key={m.code} className={'payment-channel-option'+(selected===m.code?' is-active':'')} aria-pressed={selected===m.code} disabled={disabled||m.paymentFee==null}
            onClick={()=>onSelect(m.code)}>
            {logos[m.code] ? <img className="payment-channel-logo" src={'/assets/footer/payment-'+logos[m.code]+'.png'} alt=""/> : <Icon className="payment-channel-icon" size={18} aria-hidden="true"/>}<span className="payment-channel-name">{m.name}</span><span className="payment-channel-radio" aria-hidden="true"/>
          </button>)}
        </div>}
      </section>
    })}
  </div>
}
