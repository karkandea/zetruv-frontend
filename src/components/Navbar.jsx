import { assets } from '../data/assets'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__top design-container">
        <a className="brand" href="#home" aria-label="Zetruv home">
          <img src={assets.logo} alt="Zetruv" />
        </a>

        <label className="searchbox">
          <img src={assets.search} alt="" />
          <input placeholder="Search game or voucher" aria-label="Search game or voucher" />
        </label>

        <div className="navbar__quick-actions">
          <button className="nav-pill" type="button" aria-label="Change language">
            <span className="nav-pill__icon"><img src={assets.flagEn} alt="" /></span>
            <span>EN</span>
          </button>
          <button className="nav-pill" type="button">
            <img src={assets.cart} alt="" />
            <span>Cart</span>
          </button>
        </div>
      </div>

      <div className="navbar__bottom">
        <div className="design-container navbar__bottom-inner">
          <nav className="navlinks" aria-label="Main navigation">
            <a className="active" href="#home"><img src={assets.home} alt="" />Home</a>
            <a href="#product" className="navlinks__product">Product <img src={assets.navDown} alt="" /></a>
            <a href="#article"><img src={assets.transaction} alt="" />Article</a>
            <a href="#transaction"><img src={assets.transaction} alt="" />Check Transaction</a>
            <a href="#leaderboard"><img src={assets.leaderboard} alt="" />Leaderboard</a>
          </nav>

          <div className="auth-actions">
            <button className="btn btn--outline" type="button"><img src={assets.login} alt="" />Login</button>
            <button className="btn btn--ghost" type="button"><img src={assets.register} alt="" />Register</button>
          </div>
        </div>
      </div>
    </header>
  )
}
