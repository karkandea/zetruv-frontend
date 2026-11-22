import { Box } from 'lucide-react'
import { Bone, SkeletonItems } from './Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { assets } from '../data/assets'

const kindPresentation = {
  TopUpGame: { image: assets.homepageCategoryTopUp, href: '/search?kind=TopUpGame' },
  TopUpLogin: { image: assets.homepageCategoryTopUp, href: '/search?kind=TopUpLogin' },
  GameItem: { href: '/search?kind=GameItem' },
  GameVoucher: { image: assets.homepageCategoryVoucher, href: '/search?kind=GameVoucher' },
  Joki: { image: assets.homepageCategoryJockey, href: '/search?kind=Joki' },
  Merchandise: { image: assets.homepageCategoryMerch, href: '/merchandise' },
  GameAccount: { image: assets.homepageCategoryAccount, href: '/game-accounts' },
}

export default function ServiceCategories({ items = [], loading = false }) {
  const copy = useStorefrontCopy()
  return (
    <section className="service-categories service-categories--homepage-final" id="product" aria-label={copy.productCategories}>
      <div className="service-categories__inner">
        {loading ? <SkeletonItems className="service-category" count={6}>
          <Bone variant="circle" className="service-category__icon" />
          <strong><Bone width="75%" /></strong>
          <small><Bone width="52%" /></small>
        </SkeletonItems> : items.map((item) => {
          const presentation = kindPresentation[item.kind]
          if (!presentation) return null
          return <a className="service-category" href={presentation.href} key={item.id}>
            <span className="service-category__icon">
              <img className="service-category__ring" src={assets.homepageCategoryRing} alt="" decoding="async" />
              {item.kind === 'GameItem' && !item.image
                ? <Box className="service-category__image service-category__game-item-icon" aria-hidden="true" />
                : <img className="service-category__image" src={item.image || presentation.image} alt="" decoding="async" />}
            </span>
            <strong>{item.kind === 'GameItem' ? copy.gameItems : item.kind === 'TopUpGame' ? copy.topUpViaId : item.label}</strong>
            <small>{item.kind === 'Merchandise' ? copy.physicalProduct : copy.digitalProduct}</small>
          </a>
        })}
        {!loading && items.length === 0 && <p role="status">{copy.categoriesAreCurrentlyUnavailable}</p>}
      </div>
    </section>
  )
}
