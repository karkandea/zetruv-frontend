import { useState } from 'react'
import { ChevronDown, QrCode, Wallet, Landmark, Store, CreditCard, CalendarClock } from 'lucide-react'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import '../styles/payment-channel-picker.css'

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
  const [expanded,setExpanded]=useState({qris:true,wallet:true,bank:false,retail:false,card:false,paylater:false})
  return <div className="payment-channel-picker">
    {groups.map(([key,id,en,my,Icon])=>{
      const rows=methods.filter(m=>m.group===key)
      if(!rows.length)return null
      const active=rows.find(m=>m.code===selected)
      const open=expanded[key] || Boolean(active)
      const title=language==='id'?id:language==='my'?my:en
      return <section className="payment-channel-group" key={key}>
        <button type="button" className="payment-channel-group__toggle" aria-expanded={open}
          onClick={()=>setExpanded(old=>({...old,[key]:!old[key]}))} disabled={Boolean(active)}>
          <Icon size={18} aria-hidden="true"/><strong>{title}</strong><small>{rows.length}</small><ChevronDown size={16} className={open?'is-open':''} aria-hidden="true"/>
        </button>
        {open && <div className="payment-channel-group__rows" role="group" aria-label={title}>
          {rows.map(m=><button type="button" key={m.code} className={'payment-channel-option'+(selected===m.code?' is-active':'')} aria-pressed={selected===m.code} disabled={disabled||m.paymentFee==null}
            onClick={()=>onSelect(m.code)}>
            <span>{m.name}</span><span className="payment-channel-radio" aria-hidden="true"/>
          </button>)}
        </div>}
      </section>
    })}
  </div>
}
