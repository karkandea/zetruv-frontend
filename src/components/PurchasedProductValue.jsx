import { useState } from 'react'
import { ArrowRight, Shield, Coins, Gem, Package, Ticket } from 'lucide-react'
import { getTopUpCurrencyArt } from '../data/topUpCurrencyAssets'
import { paymentThumbnail } from '../services/paymentSession'
import '../styles/purchased-product-value.css'

function ValueIcon({ url, bundledArt, fallback: Icon }) {
  const safe = paymentThumbnail(url)
  // Bundled art is a trusted import (Vite may inline an SVG data URI).
  // Never accept a data URI from an API or stored cart.
  const [failed, setFailed] = useState([])
  const image = safe && !failed.includes(safe) ? safe : bundledArt && !failed.includes(bundledArt) ? bundledArt : null
  return image
    ? <img className="purchased-value__icon" src={image} alt="" loading="lazy" decoding="async" onError={() => setFailed(old => [...old, image])} />
    : <Icon className="purchased-value__icon purchased-value__fallback" aria-hidden="true" strokeWidth={1.7} />
}

export default function PurchasedProductValue({ item, variant }) {
  const kind = item.productKind || item.kind
  const label = item.variantName || variant?.name || ''
  // Catalog enrichment applies to current carts, not historical orders.
  const source = (key) => item[key] || variant?.[key]
  const legacy = kind === 'Joki' ? label.split('→').map(s => s.trim()) : []
  const from = source('rankFrom') || (legacy.length === 2 ? legacy[0] : '')
  const to = source('rankTo') || (legacy.length === 2 ? legacy[1] : '')
  if (kind === 'Joki' && from && to) {
    return <span className="purchased-value purchased-value--journey">
      <span className="purchased-value__rank"><ValueIcon url={source('rankFromIconUrl')} fallback={Shield} />{from}</span>
      <ArrowRight size={16} strokeWidth={1.8} className="purchased-value__arrow" aria-hidden="true" />
      <span className="purchased-value__rank"><ValueIcon url={source('rankToIconUrl')} fallback={Shield} />{to}</span>
    </span>
  }
  if (!label) return null
  const topup = ['TopUpGame','TopUpId','TopUpLogin'].includes(kind)
  const artwork = topup ? getTopUpCurrencyArt(item.productSlug, {name:label}) : null
  const url = item.variantIconUrl || variant?.iconUrl
  const fallback = topup ? (/diamond/i.test(label) ? Gem : Coins) : kind === 'GameVoucher' ? Ticket : kind === 'Joki' ? Shield : Package
  return <span className="purchased-value"><ValueIcon url={url} bundledArt={artwork?.image} fallback={fallback}/><span className="purchased-value__label">{label}</span></span>
}
