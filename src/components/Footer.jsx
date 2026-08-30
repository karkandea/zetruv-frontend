import { assets } from '../data/assets'

const socials = [assets.twitter, assets.instagram, assets.facebook, assets.discord, assets.youtube]
const payments = ['BCA', 'BNI', 'BRI', 'CIMB', 'DANAMON', 'MAYBANK', 'PERMATA', 'DANA', 'GOPAY', 'LINKAJA', 'OVO', 'SHOPEE']

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__content">
        <div className="footer__brand">
          <img className="footer-logo" src={assets.logo} alt="Zetruv" />
          <p>Your gaming adventure is about to begin, before that let's top up first to make your story easier. Easy transactions, process only takes a few seconds!</p>
          <div className="socials">{socials.map((src, index) => <img src={src} alt="" key={src + index} />)}</div>
        </div>
        <div className="footer__links">
          <div><h3>Page</h3><a href="#home">Homepage</a><a href="#enter">Enter</a><a href="#register">Registration</a><a href="#transaction">Check Transaction</a></div>
          <div><h3>Support</h3><a href="#youtube">Youtube</a><a href="#facebook">Facebook</a><h3 className="footer-subtitle">Payment</h3><div className="payment-grid">{payments.map((name) => <span key={name}>{name}</span>)}</div></div>
          <div><h3>Legality</h3><a href="#terms">Term &amp; Condition</a></div>
        </div>
      </div>
      <div className="container footer__copyright">© 2024 CV Zetruv. All rights reserved.</div>
    </footer>
  )
}
