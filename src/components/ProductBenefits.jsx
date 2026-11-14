import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { Globe2, Headphones, Zap } from 'lucide-react'
import '../styles/product-benefits-gif.css'

// Original animated Figma image fills from node 3870:11276.
// Keep paths local: temporary Figma MCP asset URLs expire.
const benefits = [
  { label: 'fastProcessing', image: '/assets/product-benefits/fast.gif', key: 'fast', Icon: Zap },
  { label: 'label247ChatSupport', image: '/assets/product-benefits/support.gif', key: 'support', Icon: Headphones },
  { label: 'globalAvailability', image: '/assets/product-benefits/global.gif', key: 'global', Icon: Globe2 },
]

export default function ProductBenefits({ className = 'product-benefits' }) {
  const copy = useStorefrontCopy()
  return (
    <div className={className} aria-label={copy.serviceBenefits}>
      {benefits.map(({ label, image, key, Icon }) => (
        <span key={key}>
          <span className={`pdp-benefit-gif-slot pdp-benefit-gif-slot--${key}`} aria-hidden="true">
            <img className="pdp-benefit-gif" src={image} alt="" decoding="async" />
          </span>
          <Icon className="pdp-benefit-motion-fallback" size={16} strokeWidth={2} aria-hidden="true" />
          {copy[label]}
        </span>
      ))}
    </div>
  )
}
