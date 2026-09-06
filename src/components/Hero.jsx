import { assets } from '../data/assets'
import TrustStrip from './TrustStrip'

export default function Hero() {
  return (
    <section className="hero hero--homepage-final" id="home">
      <div className="homepage-hero-card">
        <img className="homepage-hero-card__art" src={assets.homepageHeroArtwork} alt="" />
        <div className="homepage-hero-card__scrim" />
        <div className="homepage-hero-card__copy">
          <h1>Semua kebutuhan game kamu, satu tempat.</h1>
          <p>Top up, akun game, item digital, dan merchandise dengan proses yang jelas dan aman.</p>
          <div className="homepage-hero-card__actions">
            <a className="homepage-hero-button homepage-hero-button--primary" href="/search">Jelajahi Produk</a>
            <a className="homepage-hero-button homepage-hero-button--secondary" href="#transaction">Cek Pesanan</a>
          </div>
        </div>
      </div>
      <TrustStrip />
    </section>
  )
}
