import { Search } from 'lucide-react'
import CategoryIcon from './CategoryIcon'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'

const tabs = [
  { kind: 'TopUpGame', label: 'topUpById', href: '/search' },
  { kind: 'TopUpLogin', label: 'topUpByLogin', href: '/search?kind=TopUpLogin' },
  { kind: 'Joki', label: 'gameBoosting', href: '/search?kind=Joki' },
  { kind: 'GameAccount', label: 'gameAccounts', href: '/game-accounts' },
  { kind: 'GameVoucher', label: 'gameVouchers', href: '/search?kind=GameVoucher' },
  { kind: 'GameItem', label: 'gameItems', href: '/search?kind=GameItem' },
  { kind: 'Merchandise', label: 'merchandise', href: '/merchandise' },
]

export default function BrowseMobileControls({ activeKind, query, onQueryChange, onSubmit, onCategoryChange, showSearch = true, tabletSearchAction }) {
  const copy = useStorefrontCopy()

  return (
    <div className="browse-mobile-controls">
      {showSearch && <div className="browse-mobile-search-row"><form className="catalog-search browse-mobile-search" onSubmit={onSubmit} role="search" aria-label={copy.searchTheCatalog}>
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.searchGamesOrProducts}
          aria-label={copy.searchGamesOrProducts}
        />
      </form>{tabletSearchAction && <div className="browse-tablet-search-action">{tabletSearchAction}</div>}</div>}
      <nav className="browse-mobile-tabs" aria-label={copy.productCategories2}>
        {tabs.map(({ kind, label, href }) => {
          const active = kind === activeKind
          const className = `browse-mobile-tab${active ? ' is-active' : ''}`
          const content = <><span className="browse-mobile-tab__icon"><CategoryIcon kind={kind} /></span><span>{copy[label]}</span></>

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
