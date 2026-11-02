import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { assets } from '../data/assets'
import TrustStrip from './TrustStrip'

const emptyBanner = {
  id: 'no-active-banner', theme: 'welcome', title: 'Jelajahi produk Zetruv',
  description: 'Belum ada banner promosi aktif. Lihat katalog untuk menemukan produk yang tersedia.',
  artwork: assets.homepageHeroArtwork,
  actions: [{ label: 'Jelajahi Produk', href: '/search' }],
}

export function mapCmsHeroes(items = []) {
  return items.filter((item) => item?.id && item?.title).map((item) => ({
    id: item.id, theme: 'welcome', title: item.title, description: item.subtitle,
    artwork: item.imageUrl || null,
    actions: [
      item.primaryCtaLabel && item.primaryCtaUrl && { label: item.primaryCtaLabel, href: item.primaryCtaUrl },
      item.secondaryCtaLabel && item.secondaryCtaUrl && { label: item.secondaryCtaLabel, href: item.secondaryCtaUrl, secondary: true },
    ].filter(Boolean),
  }))
}

export default function Hero({ items = [] }) {
  const cmsBanners = mapCmsHeroes(items)
  const banners = cmsBanners.length ? cmsBanners : [emptyBanner]
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const touchStartX = useRef(null)

  useEffect(() => {
    const updateVisibility = () => setIsVisible(!document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (isHovered || hasFocus || !isVisible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const timer = window.setInterval(() => {
      if (banners.length > 1) setActiveIndex((index) => (index + 1) % banners.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [activeIndex, isHovered, hasFocus, isVisible, banners.length])

  const move = (direction) => setActiveIndex((index) => (index + direction + banners.length) % banners.length)
  const visibleIndex = Math.min(activeIndex, banners.length - 1)

  function onTouchStart(event) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function onTouchEnd(event) {
    const startX = touchStartX.current
    const endX = event.changedTouches[0]?.clientX
    touchStartX.current = null
    if (startX == null || endX == null || Math.abs(endX - startX) < 45) return
    move(endX > startX ? -1 : 1)
  }

  function onCarouselKeyDown(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      move(event.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  return (
    <section className="hero hero--homepage-final" id="home">
      <div
        className="homepage-hero-card"
        role="region"
        aria-roledescription="carousel"
        aria-label="Banner promosi Zetruv"
        tabIndex={0}
        onKeyDown={onCarouselKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setHasFocus(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false)
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="homepage-hero-card__track"
          style={{ transform: `translateX(-${visibleIndex * 100}%)` }}
          aria-live="off"
        >
          {banners.map((banner, index) => (
            <article
              className={`homepage-hero-card__slide homepage-hero-card__slide--${banner.theme}`}
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${banners.length}`}
              aria-hidden={index !== visibleIndex}
            >
              {banner.artwork && (
                <img
                  className="homepage-hero-card__art"
                  src={banner.artwork}
                  alt=""
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
              )}
              {banner.images && (
                <div className={`homepage-hero-card__visual homepage-hero-card__visual--${banner.theme}`} aria-hidden="true">
                  {banner.images.map((image, imageIndex) => (
                    <img key={`${banner.id}-${imageIndex}`} src={image} alt="" decoding="async" />
                  ))}
                </div>
              )}
              <div className="homepage-hero-card__scrim" />
              <div className="homepage-hero-card__copy">
                {banner.eyebrow && <span className="homepage-hero-card__eyebrow">{banner.eyebrow}</span>}
                <h1>{banner.title}</h1>
                <p>{banner.description}</p>
                <div className="homepage-hero-card__actions">
                  {banner.actions.map((action) => (
                    <a
                      key={action.label}
                      className={`homepage-hero-button homepage-hero-button--${action.secondary ? 'secondary' : 'primary'}`}
                      href={action.href}
                      tabIndex={index === visibleIndex ? 0 : -1}
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {banners.length > 1 && <div className="homepage-hero-card__controls" aria-label="Navigasi banner">
          <button className="homepage-hero-card__arrow" type="button" onClick={() => move(-1)} aria-label="Banner sebelumnya">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <div className="homepage-hero-card__dots">
            {banners.map((banner, index) => (
              <button
                className={`homepage-hero-card__dot${index === visibleIndex ? ' is-active' : ''}`}
                key={banner.id}
                type="button"
                aria-label={`Tampilkan banner ${index + 1}: ${banner.eyebrow || 'Beranda'}`}
                aria-pressed={index === visibleIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <button className="homepage-hero-card__arrow" type="button" onClick={() => move(1)} aria-label="Banner berikutnya">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>}
      </div>
      <TrustStrip />
    </section>
  )
}
