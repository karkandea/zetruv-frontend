import { useEffect, useRef, useState } from 'react'
import { assets } from '../data/assets'
import AuthModal from './AuthModal'

const productLinks = [
  { label: 'Browse All Categories', href: '/search', arrow: true },
  { label: 'Top Up Via ID', href: '/search' },
  { label: 'Top Up Login', href: '/search/login' },
  { label: 'Voucher Game', href: '/search?q=voucher' },
  { label: 'Joki Game', href: '/#jockey' },
  { label: 'Merchandise', href: '/#merch' },
]

export default function Navbar({ variant = 'default' }) {
  const [isProductOpen, setIsProductOpen] = useState(false)
  const [authMode, setAuthMode] = useState(null)
  const productMenuRef = useRef(null)

  const isCatalog = variant === 'catalog'
  const isLoginCatalog = variant === 'loginCatalog'
  const isHomeLoggedIn = variant === 'homeLoggedIn'
  const isLeaderboard = variant === 'leaderboard'
  const isLoggedIn = isCatalog || isLoginCatalog || isHomeLoggedIn
  const homeActive = variant === 'default' || isLoginCatalog || isHomeLoggedIn

  const [activeNav, setActiveNav] = useState(() => {
    if (isLeaderboard) return 'leaderboard'
    if (isCatalog) return 'product'
    if (homeActive) return 'home'
    return ''
  })

  const initialQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('q') || ''
    : ''
  const searchAction = isLoginCatalog ? '/search/login' : '/search'

  useEffect(() => {
    function handlePointerDown(event) {
      if (productMenuRef.current && !productMenuRef.current.contains(event.target)) {
        setIsProductOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsProductOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const navbarClasses = [
    'navbar',
    isLoggedIn ? 'navbar--catalog' : '',
    isHomeLoggedIn ? 'navbar--home-final' : '',
  ].filter(Boolean).join(' ')

  function selectNav(name) {
    setActiveNav(name)
    if (name !== 'product') setIsProductOpen(false)
  }

  return (
    <>
      <header className={navbarClasses}>
      <div className="navbar__top design-container">
        <a className="brand navbar-control" href="/" aria-label="Zetruv home">
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
          <button className="nav-pill navbar-control" type="button" aria-label="Change language">
            <span className="nav-pill__icon"><img src={assets.flagEn} alt="" /></span>
            <span>EN</span>
          </button>
          <button className="nav-pill navbar-control" type="button">
            <img src={assets.cart} alt="" />
            <span>Cart</span>
          </button>
          {isLoggedIn && <span className="nav-avatar" aria-label="Signed in as M">M</span>}
        </div>
      </div>

      <div className="navbar__bottom">
        <div className="design-container navbar__bottom-inner">
          <nav className="navlinks" aria-label="Main navigation">
            <a
              className={`navbar-control${activeNav === 'home' ? ' active' : ''}`}
              href="/"
              aria-current={activeNav === 'home' ? 'page' : undefined}
              onClick={() => selectNav('home')}
            >
              <img src={assets.home} alt="" />Home
            </a>

            <div
              ref={productMenuRef}
              className={`nav-product-menu${isProductOpen ? ' is-open' : ''}`}
            >
              <a
                href="/search"
                className={`navbar-control navlinks__product${activeNav === 'product' || isProductOpen ? ' active' : ''}`}
                aria-haspopup="true"
                aria-expanded={isProductOpen}
                aria-current={activeNav === 'product' ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  setActiveNav('product')
                  setIsProductOpen((open) => !open)
                }}
              >
                {isCatalog ? 'Shop' : 'Product'} <img src={assets.navDown} alt="" />
              </a>
              <div className="product-dropdown" aria-label="Product categories" aria-hidden={!isProductOpen}>
                {productLinks.map((link) => (
                  <a className="navbar-control" href={link.href} key={link.label}>
                    <span>{link.label}</span>
                    {link.arrow && <img src={assets.productDropdownArrow} alt="" />}
                  </a>
                ))}
              </div>
            </div>

            <a
              className={`navbar-control${activeNav === 'article' ? ' active' : ''}`}
              href="#article"
              aria-current={activeNav === 'article' ? 'page' : undefined}
              onClick={() => selectNav('article')}
            >
              <img src={assets.transaction} alt="" />{isCatalog ? 'Articles' : 'Article'}
            </a>

            <a
              className={`navbar-control${activeNav === 'transaction' ? ' active' : ''}`}
              href="#transaction"
              aria-current={activeNav === 'transaction' ? 'page' : undefined}
              onClick={() => selectNav('transaction')}
            >
              <img src={assets.transaction} alt="" />{isCatalog ? 'Track Order' : 'Check Transaction'}
            </a>

            <a
              className={`navbar-control${activeNav === 'leaderboard' ? ' active' : ''}`}
              href="/leaderboard"
              aria-current={activeNav === 'leaderboard' ? 'page' : undefined}
              onClick={() => selectNav('leaderboard')}
            >
              <img src={assets.leaderboard} alt="" />Leaderboard
            </a>
          </nav>

          {!isLoggedIn && (
            <div className="auth-actions">
              <button
                className="btn btn--outline navbar-control"
                type="button"
                aria-haspopup="dialog"
                onClick={() => setAuthMode('login')}
              >
                <img src={assets.login} alt="" />Login
              </button>
              <button
                className="btn btn--ghost navbar-control"
                type="button"
                aria-haspopup="dialog"
                onClick={() => setAuthMode('register')}
              >
                <img src={assets.register} alt="" />Register
              </button>
            </div>
          )}
        </div>
      </div>
      </header>

      {authMode && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthMode(null)}
        />
      )}
    </>
  )
}
