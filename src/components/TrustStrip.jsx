import { assets } from '../data/assets'

const trustItems = [
  { label: 'Transaksi Aman', icon: assets.trustSecurity },
  { label: 'Garansi Uang Kembali', icon: assets.trustMoney },
  { label: 'Admin Support', icon: assets.trustSupport },
]

export default function TrustStrip() {
  return (
    <div className="trust-strip" aria-label="Zetruv guarantees">
      {trustItems.map((item) => (
        <div className="trust-strip__item" key={item.label}>
          <img src={item.icon} alt="" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
