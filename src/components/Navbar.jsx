import { assets } from '../data/assets'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__top container">
        <a className="brand" href="#home" aria-label="Zetruv home">
          <img src={assets.logo} alt="Zetruv" />
        </a>
        <label className="searchbox">
          <img src={assets.search} alt="" />
          <input placeholder="Search game or voucher" aria-label="Search game or voucher" />
        </label>
        <button className="language" type="button" aria-label="Change language">🇬🇧 <span>EN</span></button>
      </div>
      <div className="navbar__bottom">
        <div className="container navbar__bottom-inner">
          <nav className="navlinks" aria-label="Main navigation">
            <a className="active" href="#home"><img src={assets.home} alt="" />Home</a>
            <a href="#transaction"><span className="navlinks__dot">↔</span>Check Transaction</a>
            <a href="#leaderboard"><img src={assets.leaderboard} alt="" />Leaderboard</a>
          </nav>
          <div className="auth-actions">
            <button className="btn btn--outline"><img src={assets.login} alt="" />Login</button>
            <button className="btn btn--ghost"><img src={assets.register} alt="" />Register</button>
          </div>
        </div>
      </div>
    </header>
  )
}
