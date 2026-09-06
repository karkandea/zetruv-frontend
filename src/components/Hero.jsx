import { assets } from '../data/assets'
import TrustStrip from './TrustStrip'

export default function Hero({ hero = null }) {
  const showcaseImage = hero?.imageUrl || assets.heroShowcase

  return (
    <section className="hero" id="home" style={{ '--hero-bg': `url(${assets.heroBackground})` }}>
      <div className="hero__shade" />
      <div className="hero-browser">
        <div className="hero-browser__chrome"><i /><i /><i /></div>
        <div className="hero-showcase">
          <img src={showcaseImage} alt={hero?.title || 'Zetruv game banner'} />
          <div className="hero-dots"><b /><span /><span /><span /></div>
        </div>
      </div>
      <TrustStrip />
    </section>
  )
}
