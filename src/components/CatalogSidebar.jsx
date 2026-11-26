import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import CategoryIcon from './CategoryIcon'

const categories = [
  { kind: 'TopUpGame', label: 'topUpById', href: '/search' },
  { kind: 'TopUpLogin', label: 'topUpByLogin', href: '/search?kind=TopUpLogin' },
  { kind: 'Joki', label: 'gameBoosting', href: '/search?kind=Joki' },
  { kind: 'GameAccount', label: 'gameAccounts', href: '/game-accounts' },
  { kind: 'GameVoucher', label: 'gameVouchers', href: '/search?kind=GameVoucher' },
  { kind: 'GameItem', label: 'gameItems', href: '/search?kind=GameItem' },
  { kind: 'Merchandise', label: 'merchandise', href: '/merchandise' },
]

export default function CatalogSidebar({ activeKind, definitions, loginMode = false, onCategoryChange, onSupport }) {
  const copy = useStorefrontCopy()

  return (
    <aside className={loginMode ? 'search-sidebar' : 'search-sidebar search-sidebar--browse'} aria-label={copy.productCategories2}>
      <h2 className="catalog-heading">{loginMode ? copy.categories3 : copy.categories2}</h2>
      <nav className="search-category-list">
        {categories.map(({ kind, label, href }) => {
          const definition = definitions?.find((item) => item.kind === kind)
          const active = kind === activeKind
          const className = active ? 'search-category active' : 'search-category'
          const content = <>
            <span className="search-category__icon"><CategoryIcon kind={kind} /></span>
            <span>{definition?.label || copy[label]}</span>
            {active && <i aria-hidden="true" />}
          </>
          return onCategoryChange && kind !== 'Merchandise' && kind !== 'GameAccount'
            ? <button key={kind} type="button" className={className} aria-pressed={active} onClick={() => onCategoryChange(kind)}>{content}</button>
            : <a key={kind} className={className} href={href} aria-current={active ? 'page' : undefined}>{content}</a>
        })}
      </nav>
      <button className="search-help-card" type="button" onClick={onSupport}>
        <strong>{loginMode ? copy.customerSupport : copy.needHelp}</strong>
        <span>{loginMode ? copy.chatWithSupportIfYouNeedHelp : copy.chatWithOurSupportTeam}</span>
      </button>
    </aside>
  )
}
