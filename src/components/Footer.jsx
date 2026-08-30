import { assets } from '../data/assets'

const socials = [assets.twitter, assets.instagram, assets.facebook, assets.discord, assets.youtube]
const payments = [
  { name: 'BCA', image: assets.payBca, tone: 'blue' },
  { name: 'BNI', image: assets.payBni, tone: 'white' },
  { name: 'BRI', image: assets.payBri, tone: 'blue' },
  { name: 'CIMB', image: assets.payCimb, tone: 'red' },
  { name: 'Danamon', image: assets.payDanamon, tone: 'white' },
  { name: 'Maybank', image: assets.payMaybank, tone: 'yellow' },
  { name: 'Permata', image: assets.payPermata, tone: 'white' },
  { name: 'DANA', image: assets.payDana, tone: 'blue-light' },
  { name: 'GoPay', image: assets.payGopay, tone: 'white' },
  { name: 'LinkAja', image: assets.payLinkaja, tone: 'red' },
  { name: 'OVO', image: assets.payOvo, tone: 'purple' },
  { name: 'ShopeePay', image: assets.payShopee, tone: 'orange' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <img className="footer__glow footer__glow--left" src={assets.footerGlow} alt="" />
      <img className="footer__glow footer__glow--right" src={assets.footerGlow} alt="" />

      <div className="footer__content">
        <div className="footer__brand">
          <img className="footer-logo" src={assets.logo} alt="Zetruv" />
          <p>Your gaming adventure is about to begin, before that let's top up first to make your story easier. Top up the game here, will make you more prepared to face all challenges. Easy transactions, Process only takes a few seconds!</p>
          <div className="socials">{socials.map((src, index) => <img src={src} alt="" key={src + index} />)}</div>
        </div>

        <div className="footer__links">
          <div className="footer__column">
            <h3>Page</h3>
            <a href="#home">Homepage</a>
            <a href="#enter">Enter</a>
            <a href="#register">Registration</a>
            <a href="#transaction">Check Transaction</a>
          </div>

          <div className="footer__support-payment">
            <div className="footer__two-columns">
              <div className="footer__column"><h3>Support</h3><a href="#youtube">Youtube</a><a href="#facebook">Facebook</a></div>
              <div className="footer__column"><h3>Legality</h3><a href="#terms">Term &amp; Condition</a></div>
            </div>
            <div className="footer__payments">
              <h3>Payment</h3>
              <div className="payment-grid">
                {payments.map((payment) => (
                  <span className={`payment-mark payment-mark--${payment.tone}`} key={payment.name} title={payment.name}>
                    <img src={payment.image} alt={payment.name} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer__copyright">© 2024 CV Zetruv. All rights reserved.</div>
    </footer>
  )
}
