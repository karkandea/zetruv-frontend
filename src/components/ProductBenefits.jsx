import { Globe2, Headphones, Zap } from 'lucide-react'
import '../styles/product-benefits-gif.css'

// Original animated Figma image fills from node 3870:11276.
// Keep paths local: temporary Figma MCP asset URLs expire.
const benefits = [
  { label: 'Proses Cepat', image: '/assets/product-benefits/fast.gif', key: 'fast', Icon: Zap },
  { label: 'Dukungan Chat 24/7', image: '/assets/product-benefits/support.gif', key: 'support', Icon: Headphones },
  { label: 'Global Region', image: '/assets/product-benefits/global.gif', key: 'global', Icon: Globe2 },
]

export default function ProductBenefits({ className = 'product-benefits' }) {
  return (
    <div className={className} aria-label="Keunggulan layanan">
      {benefits.map(({ label, image, key, Icon }) => (
        <span key={key}>
          <span className={`pdp-benefit-gif-slot pdp-benefit-gif-slot--${key}`} aria-hidden="true">
            <img className="pdp-benefit-gif" src={image} alt="" decoding="async" />
          </span>
          <Icon className="pdp-benefit-motion-fallback" size={16} strokeWidth={2} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  )
}
