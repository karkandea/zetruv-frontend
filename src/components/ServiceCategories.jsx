import { assets } from '../data/assets'

const fallbackCategories = [
  { id: 'topup-id', label: 'Top Up Games', subtitle: 'Via ID', image: assets.homepageCategoryTopUp, href: '/search' },
  { id: 'topup-login', label: 'Top Up Login', subtitle: 'Via ID', image: assets.homepageCategoryTopUp, href: '/search/login' },
  { id: 'voucher', label: 'Voucher Game', subtitle: 'Via ID', image: assets.homepageCategoryVoucher, href: '/search?q=voucher' },
  { id: 'jockey', label: 'Joki Game', subtitle: 'Via ID', image: assets.homepageCategoryJockey, href: '#jockey' },
  { id: 'merch', label: 'Merchandise', subtitle: 'Via ID', image: assets.homepageCategoryMerch, href: '#merchandise' },
  { id: 'game-account', label: 'Game Account', subtitle: 'Via ID', image: assets.homepageCategoryAccount, href: '/search?q=account' },
]

function normalizeCategories(items) {
  if (!items?.length) return fallbackCategories

  return fallbackCategories.map((fallback, index) => {
    const incoming = items[index]
    if (!incoming) return fallback
    return {
      ...fallback,
      ...incoming,
      subtitle: incoming.subtitle || fallback.subtitle,
      image: incoming.image || fallback.image,
      href: incoming.href || fallback.href,
    }
  })
}

export default function ServiceCategories({ items = [] }) {
  const displayItems = normalizeCategories(items)

  return (
    <section className="service-categories service-categories--homepage-final" id="product" aria-label="Product categories">
      <div className="service-categories__inner">
        {displayItems.map((item) => (
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
