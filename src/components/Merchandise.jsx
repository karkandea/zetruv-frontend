import MerchandiseCard, { MerchandiseCardSkeletons } from './MerchandiseCard'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useRef, useState } from 'react'
import { assets } from '../data/assets'

export default function Merchandise({ items = [], loading = false }) {
  const copy = useStorefrontCopy()
  const viewportRef = useRef(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const displayItems = items.filter((item) => item?.slug && item?.id)

  useEffect(() => {
    const viewport = viewportRef.current
    const update = () => setHasOverflow(viewport.scrollWidth > viewport.clientWidth + 1)
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    update()
    return () => observer.disconnect()
  }, [loading, displayItems.length])

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
        {hasOverflow && <button
          className="carousel-arrow carousel-arrow--left merchandise__arrow merchandise__arrow--left"
          type="button"
          aria-label={copy.previousMerchandise}
          onClick={() => slide(-1)}
        >
          <img src={assets.expandLeft} alt="" />
        </button>}

        <div className="merchandise__viewport" ref={viewportRef}>
          {loading ? <MerchandiseCardSkeletons count={5} /> : displayItems.map((product) => (
            <MerchandiseCard key={product.id} product={product} />
          ))}
          {!loading && displayItems.length === 0 && <p role="status">{copy.thereIsNoMerchandiseInTheCatalog}</p>}
        </div>

        {hasOverflow && <button
          className="carousel-arrow carousel-arrow--right merchandise__arrow merchandise__arrow--right"
          type="button"
          aria-label={copy.nextMerchandise}
          onClick={() => slide(1)}
        >
          <img src={assets.expandLeft} alt="" />
        </button>}
      </div>
    </section>
  )
}
