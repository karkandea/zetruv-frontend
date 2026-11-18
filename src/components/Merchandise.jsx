import { Bone, SkeletonItems, SkeletonLines } from './Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useRef } from 'react'
import { assets } from '../data/assets'

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

export default function Merchandise({ items = [], loading = false }) {
  const copy = useStorefrontCopy()
  const viewportRef = useRef(null)
  const displayItems = items.filter((item) => item?.slug && item?.id)

  function slide(direction) {
    const viewport = viewportRef.current
    const [first, second] = viewport.children
    if (second) viewport.scrollBy({ left: direction * (second.offsetLeft - first.offsetLeft) })
  }

  return (
    <section className="merchandise" id="merch" aria-labelledby="merchandise-title">
      <span className="merchandise__arc merchandise__arc--left" aria-hidden="true" />
      <span className="merchandise__arc merchandise__arc--right" aria-hidden="true" />

      <div className="merchandise__header">
        <div>
          <h2 id="merchandise-title">{copy.merchandise}</h2>
          <p>{copy.jerseysKeychainsAndFanGearForYour}</p>
        </div>
        <a className="merchandise__view-all" href="/merchandise">{copy.viewAll}</a>
      </div>

      <div className="merchandise__panel">
        <button
          className="carousel-arrow carousel-arrow--left merchandise__arrow merchandise__arrow--left"
          type="button"
          aria-label={copy.previousMerchandise}
          onClick={() => slide(-1)}
        >
          <img src={assets.expandLeft} alt="" />
        </button>

        <div className="merchandise__viewport" ref={viewportRef}>
          {loading ? <SkeletonItems className="merch-card" count={5}>
            <div className="merch-card__image"><Bone variant="media" /></div>
            <div className="merch-card__body"><SkeletonLines /></div>
          </SkeletonItems> : displayItems.map((item) => (
            <a className="merch-card" key={item.id} href={`/merchandise/${encodeURIComponent(item.slug)}`}>
              <div className="merch-card__image">
                <img src={item.image || assets.jersey} alt={item.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.jersey }} />
                <span className="merch-card__chip">{copy.merchandise2}</span>
              </div>
              <div className="merch-card__body">
                <div className="merch-card__copy">
                  <h3>{item.name}</h3>
                  <p>{item.variant}</p>
                  <strong>{item.price != null ? rupiah(item.price) : copy.priceUnavailable}</strong>
                </div>
                <div className="merch-card__meta">
                  <span>{item.sold ?? 0} {copy.sold}</span>
                  {item.rating != null && <span className="merch-rating">{item.rating}<img src={assets.star} alt="" /></span>}
                </div>
              </div>
            </a>
          ))}
          {!loading && displayItems.length === 0 && <p role="status">{copy.thereIsNoMerchandiseInTheCatalog}</p>}
        </div>

        <button
          className="carousel-arrow carousel-arrow--right merchandise__arrow merchandise__arrow--right"
          type="button"
          aria-label={copy.nextMerchandise}
          onClick={() => slide(1)}
        >
          <img src={assets.expandLeft} alt="" />
        </button>
      </div>
    </section>
  )
}
