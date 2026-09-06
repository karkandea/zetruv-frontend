import { assets } from '../data/assets'

const fallbackAccounts = [
  {
    id: 'account-1',
    image: assets.accountPreviewOne,
    title: 'Mythic · 119 Skin',
    meta: 'Indonesia/Jawa Barat · Level 61',
    price: 'Rp1.850.000',
  },
  {
    id: 'account-2',
    image: assets.accountPreviewTwo,
    title: 'Mythical Glory · 212 Skin',
    meta: 'Indonesia/Jawa Barat · Level 80',
    price: 'Rp2.750.000',
  },
  {
    id: 'account-3',
    image: assets.accountPreviewOne,
    title: 'Mythic · 71 Skin',
    meta: 'Indonesia/Sumatera Utara · Level 44',
    price: 'Rp1.450.000',
  },
]

function normalizeAccount(item, index) {
  const fallback = fallbackAccounts[index]
  if (!item) return fallback
  const numericPrice = item.price ?? item.minPrice
  return {
    ...fallback,
    id: item.id ?? fallback.id,
    image: item.thumbnailUrl || item.imageUrl || item.image || fallback.image,
    title: item.title || item.name || fallback.title,
    meta: item.description || item.region || fallback.meta,
    price: numericPrice != null
      ? `Rp${new Intl.NumberFormat('id-ID').format(numericPrice)}`
      : fallback.price,
  }
}

export default function GameAccounts({ items = [] }) {
  const cards = fallbackAccounts.map((_, index) => normalizeAccount(items[index], index))

  return (
    <section className="homepage-accounts" id="game-accounts" aria-labelledby="homepage-accounts-title">
      <div className="homepage-accounts__header">
        <div>
          <h2 id="homepage-accounts-title">Akun Game Pilihan</h2>
          <p>Temukan akun sesuai rank, region, dan koleksi yang kamu cari.</p>
        </div>
        <a href="/search?q=account">Lihat Semua Akun Game</a>
      </div>

      <div className="homepage-accounts__row">
        {cards.map((account) => (
          <article className="homepage-account-card" key={account.id}>
            <img className="homepage-account-card__preview" src={account.image} alt={account.title} />
            <span className="homepage-account-card__status">TERSEDIA</span>
            <div className="homepage-account-card__info">
              <strong>{account.title}</strong>
              <span>{account.meta}</span>
            </div>
            <div className="homepage-account-card__bottom">
              <strong>{account.price}</strong>
              <a href="/search?q=account">Lihat Detail</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
