import { useState } from 'react'
import { Search } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import BrowseMobileControls from './BrowseMobileControls'
import CatalogSidebar from './CatalogSidebar'
import Navbar from './Navbar'
import SupportChat from './SupportChat'
import { searchAssets } from '../data/searchAssets'

export function CatalogSearch({ query, onQueryChange, onSubmit, label, browse = false }) {
  const copy = useStorefrontCopy()

  return (
    <form className="catalog-search catalog-search--desktop" role="search" aria-label={label} onSubmit={onSubmit}>
      {browse ? <img src={searchAssets.searchIcon} alt="" /> : <Search size={18} aria-hidden="true" />}
      <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={label} aria-label={label} />
      <button type="submit">{browse ? copy.search2 : copy.search3}</button>
    </form>
  )
}

export default function CatalogPage({ activeKind, query, onQueryChange, onSubmit, children, className = '', browseLanding = false, tabletSearchAction }) {
  const [supportOpen, setSupportOpen] = useState(false)
  const copy = useStorefrontCopy()

  if (browseLanding) return (
    <div className="search-site-shell catalog-shell catalog-shell--browse-landing">
      <Navbar homepageMobileMenu showMobileCart />
      <main className="search-page search-page--browse">
        <div className="search-page__container">
          <p className="search-breadcrumb"><a href="/">{copy.home2}</a> {copy.categories}</p>
          <h1 className="catalog-title"><span className="browse-title--desktop">{copy.browseCategories}</span><span className="browse-title--mobile">{copy.browse}</span></h1>
          <p className="search-page__intro catalog-subtitle">{copy.findTheGameTopUpMethodOr}</p>
          <section className="search-catalog search-catalog--browse" aria-label={copy.browseZetruvCategories}>
            <BrowseMobileControls activeKind={activeKind} query={query} onQueryChange={onQueryChange} onSubmit={onSubmit} tabletSearchAction={tabletSearchAction} />
            <CatalogSidebar activeKind={activeKind} onSupport={() => setSupportOpen(true)} />
            <div className="search-catalog__content search-catalog__content--browse catalog-content">{children}</div>
          </section>
        </div>
      </main>
      <SupportChat open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )

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
