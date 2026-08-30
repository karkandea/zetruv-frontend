import { assets } from '../data/assets'

export default function Navbar({ variant = 'default' }) {
  const isCatalog = variant === 'catalog'
  const isLoginCatalog = variant === 'loginCatalog'
  const isLoggedIn = isCatalog || isLoginCatalog
  const initialQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('q') || ''
    : ''
  const searchAction = isLoginCatalog ? '/search/login' : '/search'

  return (
    <header className={`navbar${isLoggedIn ? ' navbar--catalog' : ''}`}>
      <div className="navbar__top design-container">
        <a className="brand" href="/" aria-label="Zetruv home">
          <img src={assets.logo} alt="Zetruv" />
        </a>

        <form className="searchbox" action={searchAction} method="get">
          <img src={assets.search} alt="" />
          <input
            name="q"
            defaultValue={initialQuery}
            placeholder={isCatalog ? 'Search games, vouchers, or products' : 'Search game or voucher'}
            aria-label="Search games, vouchers, or products"
          />
        </form>

        <div className="navbar__quick-actions">
          <button className="nav-pill" type="button" aria-label="Change language">
            <span className="nav-pill__icon"><img src={assets.flagEn} alt="" /></span>
            <span>EN</span>
          </button>
          <button className="nav-pill" type="button">
            <img src={assets.cart} alt="" />
            <span>Cart</span>
          </button>
          {isLoggedIn && <span className="nav-avatar" aria-label="Signed in as M">M</span>}
        </div>
      </div>

      <div className="navbar__bottom">
        <div className="design-container navbar__bottom-inner">
          <nav className="navlinks" aria-label="Main navigation">
            <a className={!isCatalog ? 'active' : ''} href="/"><img src={assets.home} alt="" />Home</a>
            <a href="/search" className={`navlinks__product${isCatalog ? ' active' : ''}`}>
              {isCatalog ? 'Shop' : 'Product'} <img src={assets.navDown} alt="" />
            </a>
            <a href="#article"><img src={assets.transaction} alt="" />{isCatalog ? 'Articles' : 'Article'}</a>
            <a href="#transaction"><img src={assets.transaction} alt="" />{isCatalog ? 'Track Order' : 'Check Transaction'}</a>
            <a href="#leaderboard"><img src={assets.leaderboard} alt="" />Leaderboard</a>
          </nav>

          {!isLoggedIn && (
            <div className="auth-actions">
              <button className="btn btn--outline" type="button"><img src={assets.login} alt="" />Login</button>
              <button className="btn btn--ghost" type="button"><img src={assets.register} alt="" />Register</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
