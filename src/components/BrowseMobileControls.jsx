import { Search } from 'lucide-react'
import { searchAssets } from '../data/searchAssets'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'

const tabs = [
  { kind: 'TopUpGame', label: 'topUpById', href: '/search', icon: searchAssets.categoryPlayerId },
  { kind: 'TopUpLogin', label: 'topUpByLogin', href: '/search?kind=TopUpLogin', icon: searchAssets.categoryLogin },
  { kind: 'Joki', label: 'gameBoosting', href: '/search?kind=Joki', icon: searchAssets.categoryJoki || searchAssets.categoryItems },
  { kind: 'GameAccount', label: 'gameAccounts', href: '/game-accounts', icon: searchAssets.categoryAccounts },
  { kind: 'GameVoucher', label: 'gameVouchers', href: '/search?kind=GameVoucher', icon: searchAssets.categoryItems },
  { kind: 'GameItem', label: 'gameItems', href: '/search?kind=GameItem', icon: searchAssets.categoryItems },
  { kind: 'Merchandise', label: 'merchandise', href: '/merchandise', icon: searchAssets.categoryMerchandise },
]

export default function BrowseMobileControls({ activeKind, query, onQueryChange, onSubmit, onCategoryChange, showSearch = true }) {
  const copy = useStorefrontCopy()

  return (
    <div className="browse-mobile-controls">
      {showSearch && <form className="catalog-search browse-mobile-search" onSubmit={onSubmit} role="search" aria-label={copy.searchTheCatalog}>
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.searchGamesOrProducts}
          aria-label={copy.searchGamesOrProducts}
        />
      </form>}
      <nav className="browse-mobile-tabs" aria-label={copy.productCategories2}>
        {tabs.map(({ kind, label, href, icon }) => {
          const active = kind === activeKind
          const className = `browse-mobile-tab${active ? ' is-active' : ''}`
          const content = <><span className="browse-mobile-tab__icon"><img src={icon} alt="" /></span><span>{copy[label]}</span></>

          return onCategoryChange && kind !== 'Merchandise' && kind !== 'GameAccount' ? (
            <button type="button" className={className} aria-pressed={active} key={kind} onClick={() => onCategoryChange(kind)}>
              {content}
            </button>
          ) : (
            <a className={className} href={href} aria-current={active ? 'page' : undefined} key={kind}>
              {content}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
