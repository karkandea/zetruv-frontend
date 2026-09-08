import { useRef } from 'react'
import { assets } from '../data/assets'

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const fallbackItems = Array.from({ length: 8 }, (_, index) => ({
  id: `jersey-${index + 1}`,
  name: 'Zetruv Gaming Jersey',
  variant: 'Black · Size S–XL',
  price: 249000,
  sold: 128,
  rating: 4.9,
  image: assets.jersey,
}))

export default function Merchandise({ items = [] }) {
  const viewportRef = useRef(null)
  const displayItems = fallbackItems.map((fallback, index) => ({ ...fallback, ...(items[index] || {}) }))

  function slide(direction) {
    viewportRef.current?.scrollBy({
      left: direction * 226,
      behavior: 'smooth',
    })
  }

  return (
    <section className="merchandise" id="merch" aria-labelledby="merchandise-title">
      <img className="merchandise__arc merchandise__arc--left" src={assets.merchStadiumLeft} alt="" />
      <img className="merchandise__arc merchandise__arc--right" src={assets.merchStadiumRight} alt="" />

      <div className="merchandise__header">
        <div>
          <h2 id="merchandise-title">Merchandise</h2>
          <p>Jersey, keychain, dan fan gear pilihan untuk dukung tim favoritmu.</p>
        </div>
        <button className="merchandise__view-all" type="button">Lihat Semua</button>
      </div>

      <div className="merchandise__panel">
        <button
          className="carousel-arrow carousel-arrow--left merchandise__arrow merchandise__arrow--left"
          type="button"
          aria-label="Merchandise sebelumnya"
          onClick={() => slide(-1)}
        >
          <img src={assets.expandLeft} alt="" />
        </button>

        <div className="merchandise__viewport" ref={viewportRef}>
          <div className="merchandise__track">
            {displayItems.map((item) => (
              <article className="merch-card" key={item.id}>
                <div className="merch-card__image">
                  <img src={item.image || assets.jersey} alt={item.name} />
                  <span className="merch-card__chip">JERSEY</span>
                </div>
                <div className="merch-card__body">
                  <div className="merch-card__copy">
                    <h3>{item.name}</h3>
                    <p>{item.variant || 'Black · Size S–XL'}</p>
                    <strong>{rupiah(item.price ?? 249000)}</strong>
                  </div>
                  <div className="merch-card__meta">
                    <span>{item.sold ?? 128} terjual</span>
                    <span className="merch-rating">{item.rating ?? 4.9}<img src={assets.star} alt="" /></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button
          className="carousel-arrow carousel-arrow--right merchandise__arrow merchandise__arrow--right"
          type="button"
          aria-label="Merchandise berikutnya"
          onClick={() => slide(1)}
        >
          <img src={assets.expandLeft} alt="" />
        </button>
      </div>
    </section>
  )
}
