import { Bone, SkeletonItems } from './Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { assets } from '../data/assets'

import CategoryIcon from './CategoryIcon'

const kindPresentation = {
  TopUpGame: { image: assets.homepageCategoryTopUp, href: '/search?kind=TopUpGame' },
  TopUpLogin: { image: assets.homepageCategoryTopUp, href: '/search?kind=TopUpLogin' },
  GameItem: { href: '/search?kind=GameItem' },
  GameVoucher: { image: assets.homepageCategoryVoucher, href: '/search?kind=GameVoucher' },
  Joki: { image: assets.homepageCategoryJockey, href: '/search?kind=Joki' },
  Merchandise: { image: assets.homepageCategoryMerch, href: '/merchandise' },
  GameAccount: { image: assets.homepageCategoryAccount, href: '/game-accounts' },
}

const categoryOrder = ['TopUpGame', 'TopUpLogin', 'Joki', 'GameAccount', 'GameVoucher', 'GameItem', 'Merchandise']
const categoryLabels = { TopUpGame: 'topUpById', TopUpLogin: 'topUpByLogin', Joki: 'gameBoosting', GameAccount: 'gameAccounts', GameVoucher: 'gameVouchers', GameItem: 'gameItems', Merchandise: 'merchandise' }

export default function ServiceCategories({ items = [], loading = false }) {
  const copy = useStorefrontCopy()
  return (
    <section className="service-categories service-categories--homepage-final" id="product" aria-label={copy.productCategories}>
      <div className="service-categories__inner">
        {loading ? <SkeletonItems className="service-category" count={6}>
          <Bone variant="circle" className="service-category__icon" />
          <strong><Bone width="75%" /></strong>
          <small><Bone width="52%" /></small>
        </SkeletonItems> : [...items].sort((a, b) => categoryOrder.indexOf(a.kind) - categoryOrder.indexOf(b.kind)).map((item) => {
          const presentation = kindPresentation[item.kind]
          if (!presentation) return null
          return <a className="service-category" href={presentation.href} key={item.id}>
            <span className="service-category__icon">
              <img className="service-category__ring" src={assets.homepageCategoryRing} alt="" decoding="async" />
              <CategoryIcon kind={item.kind} className="service-category__image" />
            </span>
            <strong>{['TopUpGame', 'GameItem'].includes(item.kind) ? copy[categoryLabels[item.kind]] : item.label || copy[categoryLabels[item.kind]]}</strong>
            <small>{item.kind === 'Merchandise' ? copy.physicalProduct : copy.digitalProduct}</small>
          </a>
        })}
        {!loading && items.length === 0 && <p role="status">{copy.categoriesAreCurrentlyUnavailable}</p>}
      </div>
    </section>
  )
}
