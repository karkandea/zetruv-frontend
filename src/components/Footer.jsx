import { assets } from '../data/assets'

const socials = [
  { name: 'Twitter', image: assets.twitter },
  { name: 'Instagram', image: assets.instagram },
  { name: 'Facebook', image: assets.facebook },
  { name: 'Discord', image: assets.discord },
  { name: 'YouTube', image: assets.youtube },
]

const payments = [
  { name: 'BCA', image: assets.payBca },
  { name: 'BNI', image: assets.payBni },
  { name: 'BRI', image: assets.payBri },
  { name: 'CIMB', image: assets.payCimb },
  { name: 'Danamon', image: assets.payDanamon },
  { name: 'Maybank', image: assets.payMaybank },
  { name: 'Permata', image: assets.payPermata },
  { name: 'DANA', image: assets.payDana },
  { name: 'GoPay', image: assets.payGopay },
  { name: 'LinkAja', image: assets.payLinkaja },
  { name: 'OVO', image: assets.payOvo },
  { name: 'ShopeePay', image: assets.payShopee },
]

export default function Footer() {
  return (
    <footer className="footer footer--figma-final">
      <span className="footer__glow footer__glow--left" aria-hidden="true" />
      <span className="footer__glow footer__glow--right" aria-hidden="true" />

      <div className="footer__content">
        <div className="footer__brand">
          <img className="footer-logo" src={assets.footerLogo || assets.logo} alt="Zetruv" />
          <p>
            Your gaming adventure is about to begin, before that let's top up first to make your story easier.
            Top up the game here, will make you more prepared to face all challenges. Easy transactions,
            Process only takes a few seconds!
          </p>

          <div className="socials" aria-label="Zetruv social media">
            {socials.map((social) => (
              <a href="#" aria-label={social.name} key={social.name}>
                <img src={social.image} alt="" />
              </a>
            ))}
          </div>
        </div>

        <div className="footer__links">
          <div className="footer__column footer__column--page">
            <h3>Page</h3>
            <a href="/">Homepage</a>
            <a href="#login">Enter</a>
            <a href="#register">Registration</a>
            <a href="#transaction">Check Transaction</a>
          </div>

          <div className="footer__support-payment">
            <div className="footer__two-columns">
              <div className="footer__column">
                <h3>Support</h3>
                <a href="#">Youtube</a>
                <a href="#">Facebook</a>
              </div>

              <div className="footer__column">
                <h3>Legality</h3>
                <a href="#terms">Term &amp; Condition</a>
              </div>
            </div>

            <div className="footer__payments">
              <h3>Payment</h3>
              <div className="payment-grid" aria-label="Supported payment methods">
                {payments.map((payment) => (
                  <img
                    className="payment-mark"
                    src={payment.image}
                    alt={payment.name}
                    key={payment.name}
                  />
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
