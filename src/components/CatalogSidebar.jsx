import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { searchAssets } from '../data/searchAssets'

const categories = [
  { kind: 'TopUpGame', label: 'gameTopUpById', icon: searchAssets.categoryPlayerId, href: '/search' },
  { kind: 'TopUpLogin', label: 'gameTopUpByLogin', icon: searchAssets.categoryLogin, href: '/search?kind=TopUpLogin' },
  { kind: 'GameVoucher', label: 'gameVouchers', icon: searchAssets.categoryItems, href: '/search?kind=GameVoucher' },
  { kind: 'Joki', label: 'gameBoosting', icon: searchAssets.categoryJoki || searchAssets.categoryItems, href: '/search?kind=Joki' },
  { kind: 'GameAccount', label: 'gameAccounts', icon: searchAssets.categoryAccounts, href: '/game-accounts' },
  { kind: 'GameItem', label: 'gameItems', icon: searchAssets.categoryItems, href: '/search?kind=GameItem' },
  { kind: 'Merchandise', label: 'merchandise', icon: searchAssets.categoryMerchandise, href: '/merchandise' },
]

export default function CatalogSidebar({ activeKind, definitions, loginMode = false, onCategoryChange, onSupport }) {
  const copy = useStorefrontCopy()

  return (
    <aside className={loginMode ? 'search-sidebar' : 'search-sidebar search-sidebar--browse'} aria-label={copy.productCategories2}>
      <h2 className="catalog-heading">{loginMode ? copy.categories3 : copy.categories2}</h2>
      <nav className="search-category-list">
        {categories.map(({ kind, label, icon, href }) => {
          const definition = definitions?.find((item) => item.kind === kind)
          const active = kind === activeKind
          const className = active ? 'search-category active' : 'search-category'
          const content = <>
            <span className="search-category__icon"><img src={definition?.icon || icon} alt="" /></span>
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
