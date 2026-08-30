import { assets } from '../data/assets'

export default function Hero({ registeredUsers = 100000 }) {
  return (
    <section className="hero" id="home" style={{ '--hero-bg': `url(${assets.heroBackground})` }}>
      <div className="hero__overlay" />
      <div className="container hero__inner">
        <div className="hero-card">
          <div className="hero-card__chrome"><i /><i /><i /></div>
          <div className="hero-card__body">
            <div className="hero-showcase">
              <img src={assets.heroShowcase} alt="Zetruv gaming showcase" />
              <div className="dots"><b /><span /><span /><span /></div>
            </div>
            <div className="hero-copy">
              <div className="registered-pill">
                <div className="avatar-stack">
                  <img src={assets.avatar1} alt="" />
                  <img src={assets.avatar2} alt="" />
                  <img src={assets.avatar3} alt="" />
                </div>
                <span><strong>{registeredUsers.toLocaleString('id-ID')}+</strong> has registered</span>
              </div>
              <h1>Welcome to Zetruv</h1>
              <p>Join the ultimate gaming community! Enjoy a seamless, secure, and reliable experience for your game voucher transactions. Level up your gaming journey today!</p>
              <a className="hero-cta" href="#register">Register Now</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
