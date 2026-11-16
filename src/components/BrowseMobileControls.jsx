import { IdCard, LogIn, Search, Shirt, Ticket, Trophy, UserRound } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'

const tabs = [
  { kind: 'TopUpGame', label: 'topUpById', href: '/search', Icon: IdCard },
  { kind: 'TopUpLogin', label: 'topUpByLogin', href: '/search?kind=TopUpLogin', Icon: LogIn },
  { kind: 'Joki', label: 'gameBoosting', href: '/search?kind=Joki', Icon: Trophy },
  { kind: 'GameAccount', label: 'gameAccounts', href: '/game-accounts', Icon: UserRound },
  { kind: 'GameVoucher', label: 'gameVouchers', href: '/search?kind=GameVoucher', Icon: Ticket },
  { kind: 'Merchandise', label: 'merchandise', href: '/merchandise', Icon: Shirt },
]

export default function BrowseMobileControls({ activeKind, query, onQueryChange, onSubmit, onCategoryChange }) {
  const copy = useStorefrontCopy()

  return (
    <div className="browse-mobile-controls">
      <form className="catalog-search browse-mobile-search" onSubmit={onSubmit} role="search" aria-label={copy.searchTheCatalog}>
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.searchGamesOrProducts}
          aria-label={copy.searchGamesOrProducts}
        />
      </form>
      <nav className="browse-mobile-tabs" aria-label={copy.productCategories2}>
        {tabs.map(({ kind, label, href, Icon }) => {
          const active = kind === activeKind
          const className = `browse-mobile-tab${active ? ' is-active' : ''}`
          const content = <><Icon size={20} aria-hidden="true" /><span>{copy[label]}</span></>

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
