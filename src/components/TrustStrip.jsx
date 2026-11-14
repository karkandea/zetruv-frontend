import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { assets } from '../data/assets'

const trustItems = [
  { label: 'secureTransactions', icon: assets.trustSecurity },
  { label: 'moneyBackGuarantee', icon: assets.trustMoney },
  { label: 'customerSupport', icon: assets.trustSupport },
]

export default function TrustStrip() {
  const copy = useStorefrontCopy()
  return (
    <div className="trust-strip" aria-label={copy.zetruvGuarantees}>
      {trustItems.map((item) => (
        <div className="trust-strip__item" key={item.label}>
          <img src={item.icon} alt="" />
          <span>{copy[item.label]}</span>
        </div>
      ))}
    </div>
  )
}
