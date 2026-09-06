import { useState } from 'react'
import { assets } from '../data/assets'

const productLinks = [
  { label: 'Browse All Categories', href: '/search', arrow: true },
  { label: 'Top Up Via ID', href: '/search' },
  { label: 'Top Up Login', href: '/search/login' },
  { label: 'Voucher Game', href: '/search?q=voucher' },
  { label: 'Joki Game', href: '/#jockey' },
  { label: 'Merchandise', href: '/#merchandise' },
]

export default function Navbar({ variant = 'default' }) {
  const [isProductOpen, setIsProductOpen] = useState(false)
  const isCatalog = variant === 'catalog'
  const isLoginCatalog = variant === 'loginCatalog'
  const isHomeLoggedIn = variant === 'homeLoggedIn'
  const isLeaderboard = variant === 'leaderboard'
  const isLoggedIn = isCatalog || isLoginCatalog || isHomeLoggedIn
  const homeActive = variant === 'default' || isLoginCatalog || isHomeLoggedIn
  const initialQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('q') || ''
    : ''
  const searchAction = isLoginCatalog ? '/search/login' : '/search'

  const navbarClasses = [
    'navbar',
    isLoggedIn ? 'navbar--catalog' : '',
    isHomeLoggedIn ? 'navbar--home-final' : '',
  ].filter(Boolean).join(' ')

  return (
    <header className={navbarClasses}>
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
            <a className={homeActive ? 'active' : ''} href="/"><img src={assets.home} alt="" />Home</a>

            <div className={`nav-product-menu${isProductOpen ? ' is-open' : ''}`}>
              <a
                href="/search"
                className={`navlinks__product${isCatalog || isProductOpen ? ' active' : ''}`}
                aria-haspopup="true"
                aria-expanded={isProductOpen}
                onClick={(event) => {
                  event.preventDefault()
                  setIsProductOpen((open) => !open)
                }}
              >
                {isCatalog ? 'Shop' : 'Product'} <img src={assets.navDown} alt="" />
              </a>
              <div className="product-dropdown" aria-label="Product categories" aria-hidden={!isProductOpen}>
                {productLinks.map((link) => (
                  <a href={link.href} key={link.label}>
                    <span>{link.label}</span>
                    {link.arrow && <img src={assets.productDropdownArrow} alt="" />}
                  </a>
                ))}
              </div>
            </div>

            <a href="#article"><img src={assets.transaction} alt="" />{isCatalog ? 'Articles' : 'Article'}</a>
            <a href="#transaction"><img src={assets.transaction} alt="" />{isCatalog ? 'Track Order' : 'Check Transaction'}</a>
            <a className={isLeaderboard ? 'active' : ''} href="/leaderboard"><img src={assets.leaderboard} alt="" />Leaderboard</a>
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
