import { CircleAlert, PackageSearch, Search, RefreshCw } from 'lucide-react'
import '../styles/storefront-state.css'

export default function StorefrontState({ kind = 'empty', title, description, action, onAction, href, linkLabel, compact = false }) {
  const Icon = kind === 'error' ? CircleAlert : kind === 'search' ? Search : PackageSearch
  return <section className={`storefront-state storefront-state--${kind}${compact ? ' storefront-state--compact' : ''}`} role={kind === 'error' ? 'alert' : 'status'}>
    <span className="storefront-state__icon"><Icon size={24} strokeWidth={1.6} aria-hidden="true" /></span>
    <strong>{title}</strong>
    {description && <p>{description}</p>}
    {(action && onAction || href && linkLabel) && <div className="storefront-state__actions">
      {action && onAction && <button type="button" onClick={onAction}>{kind === 'error' && <RefreshCw size={15} aria-hidden="true" />}{action}</button>}
      {href && linkLabel && <a href={href}>{linkLabel}</a>}
    </div>}
  </section>
}
