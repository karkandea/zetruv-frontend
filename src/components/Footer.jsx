import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
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
  const copy = useStorefrontCopy()
  return (
    <footer className="footer footer--figma-final">
      <span className="footer__glow footer__glow--left" aria-hidden="true" />
      <span className="footer__glow footer__glow--right" aria-hidden="true" />

      <div className="footer__content">
        <div className="footer__brand">
          <img className="footer-logo" src={assets.footerLogo || assets.logo} alt="Zetruv" />
          <p>
            {copy.getReadyForYourNextGameTop}
          </p>

          <div className="socials" aria-label={copy.zetruvSocialMedia}>
            {socials.map((social) => (
              <a href="#" aria-label={social.name} key={social.name}>
                <img src={social.image} alt="" />
              </a>
            ))}
          </div>
        </div>

        <div className="footer__links">
          <div className="footer__column footer__column--page">
            <h3>{copy.pages}</h3>
            <a href="/">{copy.homepage}</a>
            <a href="#login">{copy.logIn}</a>
            <a href="#register">{copy.register}</a>
            <a href="/order-status">{copy.checkTransaction}</a>
          </div>

          <div className="footer__support-payment">
            <div className="footer__two-columns">
              <div className="footer__column">
                <h3>{copy.support}</h3>
                <a href="#">Youtube</a>
                <a href="#">Facebook</a>
              </div>

              <div className="footer__column">
                <h3>{copy.legal}</h3>
                <a href="#terms">{copy.termsAndConditions}</a>
              </div>
            </div>

            <div className="footer__payments">
              <h3>{copy.payment}</h3>
              <div className="payment-grid" aria-label={copy.supportedPaymentMethods}>
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

      <div className="footer__copyright">{copy.label2024CvZetruvAllRightsReserved}</div>
    </footer>
  )
}
