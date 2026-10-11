import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { assets } from '../data/assets'
import TrustStrip from './TrustStrip'

// Frontend-only promotional slides. Keep the existing Figma banner as slide one.
const banners = [
  {
    id: 'welcome',
    theme: 'welcome',
    title: 'Semua kebutuhan game kamu, satu tempat.',
    description: 'Top up, akun game, item digital, dan merchandise dengan proses yang jelas dan aman.',
    artwork: assets.homepageHeroArtwork,
    actions: [
      { label: 'Jelajahi Produk', href: '/search' },
      { label: 'Cek Pesanan', href: '/order-status', secondary: true },
    ],
  },
  {
    id: 'topup',
    theme: 'topup',
    eyebrow: 'TOP UP GAME',
    title: 'Top up game favoritmu, lebih praktis.',
    description: 'Cari diamond, UC, dan item in-game untuk game yang kamu mainkan.',
    images: [assets.mobileLegends, assets.pubg, assets.valorant],
    actions: [
      { label: 'Top Up Via ID', href: '/search' },
      { label: 'Top Up Via Login', href: '/search/login', secondary: true },
    ],
  },
  {
    id: 'jockey',
    theme: 'jockey',
    eyebrow: 'JOKI GAME',
    title: 'Mau push rank? Cek pilihan joki game.',
    description: 'Temukan layanan joki untuk game favoritmu langsung di Zetruv.',
    images: [assets.genshin, assets.mobileLegends, assets.starRail],
    actions: [{ label: 'Lihat Joki Game', href: '#jockey' }],
  },
  {
    id: 'merchandise',
    theme: 'merchandise',
    eyebrow: 'MERCHANDISE',
    title: 'Gaming nggak berhenti di layar.',
    description: 'Jersey dan merchandise pilihan untuk lengkapi gaya gaming kamu.',
    images: [assets.jersey],
    actions: [{ label: 'Lihat Merchandise', href: '#merch' }],
  },
]

export default function Hero() {
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
      setActiveIndex((index) => (index + 1) % banners.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [activeIndex, isHovered, hasFocus, isVisible])

  const move = (direction) => setActiveIndex((index) => (index + direction + banners.length) % banners.length)

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
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          aria-live="off"
        >
          {banners.map((banner, index) => (
            <article
              className={`homepage-hero-card__slide homepage-hero-card__slide--${banner.theme}`}
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${banners.length}`}
              aria-hidden={index !== activeIndex}
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
                      tabIndex={index === activeIndex ? 0 : -1}
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="homepage-hero-card__controls" aria-label="Navigasi banner">
          <button className="homepage-hero-card__arrow" type="button" onClick={() => move(-1)} aria-label="Banner sebelumnya">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <div className="homepage-hero-card__dots">
            {banners.map((banner, index) => (
              <button
                className={`homepage-hero-card__dot${index === activeIndex ? ' is-active' : ''}`}
                key={banner.id}
                type="button"
                aria-label={`Tampilkan banner ${index + 1}: ${banner.eyebrow || 'Beranda'}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
          <button className="homepage-hero-card__arrow" type="button" onClick={() => move(1)} aria-label="Banner berikutnya">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <TrustStrip />
    </section>
  )
}
