import { useEffect, useMemo, useRef, useState } from 'react'
import { assets } from '../data/assets'
import { getFlashSalePages } from './flashSaleLayout'

const rupiah = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`

function getColumns() {
  if (typeof window === 'undefined') return 3
  if (window.matchMedia('(max-width: 700px)').matches) return 1
  if (window.matchMedia('(max-width: 980px)').matches) return 2
  return 3
}

function FlashSaleItem({ item }) {
  return (
    <article className="sale-item">
      <div className="sale-item__image">
        <img src={item.image || assets.flashMobileLegends} alt={item.name || 'Produk Flash Sale'} loading="lazy" decoding="async" />
      </div>
      <div className="sale-item__body">
        <div className="sale-item__info">
          <h3>{item.name}</h3>
          <div className="price-row">
            <strong>{rupiah(item.price)}</strong>
            <del>{rupiah(item.originalPrice)}</del>
          </div>
        </div>
        <span className="diamond-pill"><img src={assets.diamond} alt="" />{item.item}</span>
      </div>
    </article>
  )
}

export default function FlashSale({ items = [], countdown = '01:04:35' }) {
  const [columns, setColumns] = useState(getColumns)
  const [currentPage, setCurrentPage] = useState(0)
  const touchStart = useRef(null)
  const products = Array.isArray(items) ? items : []

  useEffect(() => {
    const onResize = () => setColumns((current) => {
      const next = getColumns()
      return next === current ? current : next
    })
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setCurrentPage(0)
  }, [columns, products.length])

  const pages = useMemo(() => getFlashSalePages(products, columns), [products, columns])
  const hasCarousel = pages.length > 1
  const safePage = Math.min(currentPage, Math.max(0, pages.length - 1))

  if (products.length === 0) return null

  function changePage(delta) {
    setCurrentPage((page) => (Math.min(page, pages.length - 1) + delta + pages.length) % pages.length)
  }

  function handleTouchStart(event) {
    if (!hasCarousel) return
    const touch = event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  function handleTouchEnd(event) {
    if (!hasCarousel || !touchStart.current) return
    const touch = event.changedTouches[0]
    const start = touchStart.current
    touchStart.current = null
    if (!touch) return

    const distanceX = touch.clientX - start.x
    const distanceY = touch.clientY - start.y
    if (Math.abs(distanceX) < 45 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.2) return
    changePage(distanceX < 0 ? 1 : -1)
  }

  return (
    <section className="flash-section" aria-labelledby="flash-title">
      <div className="flash-card">
        <img className="flash-decor flash-decor--left" src={assets.flashDecor} alt="" loading="lazy" decoding="async" />
        <img className="flash-decor flash-decor--right" src={assets.flashDecor} alt="" loading="lazy" decoding="async" />

        <div className="flash-heading">
          <div className="flash-heading__title">
            <img src={assets.fire} alt="" loading="lazy" decoding="async" />
            <h2 id="flash-title">Flash Sale</h2>
          </div>
          <div className="countdown-line"><strong>{countdown || '01:04:35'}</strong></div>
        </div>

        <div className={`flash-carousel flash-carousel--adaptive${hasCarousel ? '' : ' flash-carousel--static'}`} style={{ '--flash-columns': columns }}>
          {hasCarousel && (
            <button className="carousel-arrow carousel-arrow--left" type="button" aria-label="Flash Sale sebelumnya" onClick={() => changePage(-1)}>
              <img src={assets.expandLeft} alt="" />
            </button>
          )}

          <div
            className="flash-carousel__viewport"
            role={hasCarousel ? 'region' : undefined}
            aria-roledescription={hasCarousel ? 'carousel' : undefined}
            aria-label={hasCarousel ? 'Produk Flash Sale' : undefined}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => { touchStart.current = null }}
          >
            <div className="flash-carousel__track" style={{ transform: `translate3d(-${safePage * 100}%, 0, 0)` }}>
              {pages.map((pageItems, pageIndex) => (
                <div
                  className="flash-grid flash-grid--adaptive"
                  key={`flash-page-${pageIndex}`}
                  role={hasCarousel ? 'group' : undefined}
                  aria-roledescription={hasCarousel ? 'slide' : undefined}
                  aria-label={hasCarousel ? `Halaman ${pageIndex + 1} dari ${pages.length}` : undefined}
                  aria-hidden={hasCarousel ? pageIndex !== safePage : undefined}
                >
                  {pageItems.map((item, itemIndex) => (
                    <FlashSaleItem key={item.id ?? `${pageIndex}-${itemIndex}`} item={item} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {hasCarousel && (
            <button className="carousel-arrow carousel-arrow--right" type="button" aria-label="Flash Sale berikutnya" onClick={() => changePage(1)}>
              <img src={assets.expandLeft} alt="" />
            </button>
          )}
        </div>

        {hasCarousel && (
          <div className="carousel-dots flash-carousel__dots" aria-label="Halaman Flash Sale">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`flash-carousel__dot${index === safePage ? ' is-active' : ''}`}
                aria-label={`Tampilkan halaman Flash Sale ${index + 1} dari ${pages.length}`}
                aria-current={index === safePage ? 'true' : undefined}
                onClick={() => setCurrentPage(index)}
              />
            ))}
          </div>
        )}
        {hasCarousel && <span className="flash-carousel__sr-only" role="status">Halaman {safePage + 1} dari {pages.length}</span>}
      </div>
    </section>
  )
}
