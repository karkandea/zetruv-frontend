import { assets } from '../data/assets'

const homepageCategories = [
  { id: 'topup-id', label: 'Top Up Games Via ID', subtitle: 'Digital Product', image: assets.homepageCategoryTopUp, href: '/search' },
  { id: 'topup-login', label: 'Top Up Games Via Login', subtitle: 'Digital Product', image: assets.homepageCategoryTopUp, href: '/search/login' },
  { id: 'voucher', label: 'Voucher Game', subtitle: 'Digital Product', image: assets.homepageCategoryVoucher, href: '/search?q=voucher' },
  { id: 'jockey', label: 'Joki Game', subtitle: 'Digital Product', image: assets.homepageCategoryJockey, href: '#jockey' },
  { id: 'merch', label: 'Merchandise', subtitle: 'Physical Product', image: assets.homepageCategoryMerch, href: '#merch' },
  { id: 'game-account', label: 'Game Account', subtitle: 'Digital Product', image: assets.homepageCategoryAccount, href: '#game-accounts' },
]

export default function ServiceCategories() {
  return (
    <section className="service-categories service-categories--homepage-final" id="product" aria-label="Product categories">
      <div className="service-categories__inner">
        {homepageCategories.map((item) => (
          <a className="service-category" href={item.href} key={item.id}>
            <span className="service-category__icon">
              <img className="service-category__ring" src={assets.homepageCategoryRing} alt="" />
              <img className="service-category__image" src={item.image} alt="" />
            </span>
            <strong>{item.label}</strong>
            <small>{item.subtitle}</small>
          </a>
        ))}
      </div>
    </section>
  )
}
