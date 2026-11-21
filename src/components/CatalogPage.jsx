import { useState } from 'react'
import { Search } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import BrowseMobileControls from './BrowseMobileControls'
import CatalogSidebar from './CatalogSidebar'
import Navbar from './Navbar'
import SupportChat from './SupportChat'

export function CatalogSearch({ query, onQueryChange, onSubmit, label }) {
  const copy = useStorefrontCopy()

  return (
    <form className="catalog-search catalog-search--desktop" role="search" aria-label={label} onSubmit={onSubmit}>
      <Search size={18} aria-hidden="true" />
      <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={label} aria-label={label} />
      <button type="submit">{copy.search3}</button>
    </form>
  )
}

export default function CatalogPage({ activeKind, query, onQueryChange, onSubmit, children, className = '' }) {
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className={`browse-catalog-shell catalog-shell${className ? ` ${className}` : ''}`}>
      <Navbar homepageMobileMenu showMobileCart />
      <main className="catalog-page browse-catalog-page">
        <BrowseMobileControls activeKind={activeKind} query={query} onQueryChange={onQueryChange} onSubmit={onSubmit} />
        <div className="catalog-layout">
          <CatalogSidebar activeKind={activeKind} onSupport={() => setSupportOpen(true)} />
          <div className="catalog-content">{children}</div>
        </div>
      </main>
      <SupportChat open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
