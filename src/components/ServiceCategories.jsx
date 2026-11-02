import { assets } from '../data/assets'

const kindPresentation = {
  TopUpGame: { image: assets.homepageCategoryTopUp, href: '/search?kind=TopUpGame' },
  TopUpLogin: { image: assets.homepageCategoryTopUp, href: '/search?kind=TopUpLogin' },
  GameVoucher: { image: assets.homepageCategoryVoucher, href: '/search?kind=GameVoucher' },
  Joki: { image: assets.homepageCategoryJockey, href: '/search?kind=Joki' },
  Merchandise: { image: assets.homepageCategoryMerch, href: '/merchandise' },
  GameAccount: { image: assets.homepageCategoryAccount, href: '/game-accounts' },
}

export default function ServiceCategories({ items = [] }) {
  return (
    <section className="service-categories service-categories--homepage-final" id="product" aria-label="Product categories">
      <div className="service-categories__inner">
        {items.map((item) => {
          const presentation = kindPresentation[item.kind]
          if (!presentation) return null
          return <a className="service-category" href={presentation.href} key={item.id}>
            <span className="service-category__icon">
              <img className="service-category__ring" src={assets.homepageCategoryRing} alt="" decoding="async" />
              <img className="service-category__image" src={item.image || presentation.image} alt="" decoding="async" />
            </span>
            <strong>{item.label}</strong>
            <small>{item.kind === 'Merchandise' ? 'Physical Product' : 'Digital Product'}</small>
          </a>
        })}
        {items.length === 0 && <p role="status">Kategori belum tersedia saat ini.</p>}
      </div>
    </section>
  )
}
