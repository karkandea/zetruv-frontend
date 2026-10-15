import { useEffect, useRef, useState } from 'react'
import { assets } from '../data/assets'
import AuthModal from './AuthModal'
import NavbarSearch from './NavbarSearch'
import { NAVBAR_COPY, NAVBAR_LANGUAGES, NAVBAR_LANGUAGE_STORAGE_KEY, normalizeNavbarLanguage, readNavbarLanguage } from '../services/navbarLanguage'
import { cartCount, onCartChange, readCart } from '../services/cartService'
import { activateCustomerCart, readCustomerSession, refreshCustomerCart, setCustomerSession, logoutCustomer, CUSTOMER_EVENT } from '../services/customerCartSync'

const productLinks = [
  { label: 'Browse All Categories', href: '/search', arrow: true },
  { label: 'Top Up Via ID', href: '/search' },
  { label: 'Top Up Login', href: '/search?kind=TopUpLogin' },
  { label: 'Voucher Game', href: '/search?kind=GameVoucher' },
  { label: 'Joki Game', href: '/search?kind=Joki' },
  { label: 'Merchandise', href: '/merchandise' },
  { label: 'Game Account', href: '/game-accounts' },
]

function readPhysicalCartCount() {
  if (typeof window === 'undefined') return 0
  try {
    const item = JSON.parse(window.sessionStorage.getItem('zetruv-physical-cart-v1') || 'null')
    return item ? Number(item.qty || 1) : 0
  } catch {
    return 0
  }
}

export default function Navbar({ variant = 'default', onAuthenticated }) {
  const [isProductOpen, setIsProductOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [language, setLanguage] = useState(readNavbarLanguage)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [verifiedSession,setVerifiedSession]=useState(readCustomerSession)
  const [cartItems, setCartItems] = useState(() => typeof window === 'undefined' ? [] : readCart())
  const [physicalCartCount, setPhysicalCartCount] = useState(() => readPhysicalCartCount())
  const [authMode, setAuthMode] = useState(() => {
    if (typeof window === 'undefined') return null
    if (window.location.pathname === '/auth/reset-password') return 'forgot-new'
    const verifyState = new URLSearchParams(window.location.search).get('verify-email')
    if (verifyState === 'pending') return 'register-verify'
    if (verifyState === 'success') return 'register-verified'
    if (verifyState === 'expired') return 'register-expired'
    return null
  })
  const productMenuRef = useRef(null)
  const cartMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const resetToken = useRef(typeof window === 'undefined' ? '' : (window.location.pathname === '/auth/reset-password' ? new URLSearchParams(window.location.search).get('token') || '' : ''))
  const languageMenuRef = useRef(null)
  const languageButtonRef = useRef(null)

  const isCatalog = variant === 'catalog'
  const isLoginCatalog = variant === 'loginCatalog'
  const isHomeLoggedIn = variant === 'homeLoggedIn'
  const isLeaderboard = variant === 'leaderboard'
  const isArticle = variant === 'article'
  const isAccount = variant === 'account'
  const isLoggedIn = Boolean(verifiedSession) // Page variant is never authentication.
  const homeActive = variant === 'default' || isLoginCatalog || isHomeLoggedIn || isAccount

  const [activeNav, setActiveNav] = useState(() => {
    if (isLeaderboard) return 'leaderboard'
    if (isArticle) return 'article'
    if (isCatalog) return 'product'
    if (homeActive) return 'home'
    return ''
  })

  const initialQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('q') || ''
    : ''
  const t = NAVBAR_COPY[language]
  const selectedLanguage = NAVBAR_LANGUAGES.find((option) => option.code === language) || NAVBAR_LANGUAGES[0]
  const searchPlaceholder = isCatalog ? t.searchCatalog : t.search
  const cartLabel = t.cart
  const productLabel = isCatalog ? t.shop : t.product
  const articleLabel = isCatalog ? t.articles : t.article
  const transactionLabel = isCatalog ? t.trackOrder : t.transaction

  useEffect(() => onCartChange(setCartItems), [])
  useEffect(() => {
    // Keep the selected navbar language in sync across open tabs.
    const onStorage = (event) => {
      if (event.key === NAVBAR_LANGUAGE_STORAGE_KEY) {
        setLanguage(normalizeNavbarLanguage(event.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  useEffect(()=>{
    // Every browser/device reads the server cart after a verified login.
    if(readCustomerSession())activateCustomerCart().catch(()=>{})
    const refreshSession=()=>setVerifiedSession(readCustomerSession())
    const onFocus=()=>{if(readCustomerSession())refreshCustomerCart().catch(()=>{})}
    window.addEventListener(CUSTOMER_EVENT,refreshSession)
    window.addEventListener('focus',onFocus)
    return ()=>{window.removeEventListener(CUSTOMER_EVENT,refreshSession)
      window.removeEventListener('focus',onFocus)}
  },[])

  useEffect(() => {
    const refreshPhysicalCart = () => setPhysicalCartCount(readPhysicalCartCount())
    refreshPhysicalCart()
    window.addEventListener('focus', refreshPhysicalCart)
    window.addEventListener('pageshow', refreshPhysicalCart)
    return () => {
      window.removeEventListener('focus', refreshPhysicalCart)
      window.removeEventListener('pageshow', refreshPhysicalCart)
    }
  }, [])

  useEffect(() => {
    function handlePointerDown(event) {
      if (productMenuRef.current && !productMenuRef.current.contains(event.target)) {
        setIsProductOpen(false)
      }
      if (cartMenuRef.current && !cartMenuRef.current.contains(event.target)) {
        setIsCartOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) setIsMobileMenuOpen(false)
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsProductOpen(false)
        setIsCartOpen(false)
        setIsLanguageOpen(false)
        setIsMobileMenuOpen(false)
      }
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
    setIsCartOpen(false)
    setIsLanguageOpen(false)
    setIsMobileMenuOpen(false)
  }

  function selectLanguage(code) {
    const selected = normalizeNavbarLanguage(code)
    setLanguage(selected)
    setIsLanguageOpen(false)
    try {
      window.localStorage.setItem(NAVBAR_LANGUAGE_STORAGE_KEY, selected)
    } catch {
      // Keep the choice active for this page if browser storage is unavailable.
    }
    languageButtonRef.current?.focus()
  }

  function handleAuthenticated(response) {
    setCustomerSession(response)
    setVerifiedSession(readCustomerSession())
    activateCustomerCart().catch(()=>{}) // error is displayed on cart; guest draft retained.
    onAuthenticated?.(response)
  }

  return (
    <>
      <header className={navbarClasses}>
      <div className="navbar__top design-container">
        <a className="brand navbar-control" href="/" aria-label="Zetruv home">
          <img src={assets.logo} alt="Zetruv" />
        </a>

        <NavbarSearch placeholder={searchPlaceholder} initialQuery={initialQuery} />

        <div className="navbar__quick-actions">
          <div ref={languageMenuRef} className={`nav-language-menu${isLanguageOpen ? ' is-open' : ''}`}>
            <button
              ref={languageButtonRef}
              className="nav-pill navbar-control nav-language-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isLanguageOpen}
              aria-controls="navbar-language-dropdown"
              aria-label={`${t.language}: ${selectedLanguage.name}`}
              onClick={() => {
                setIsLanguageOpen((open) => !open)
                setIsProductOpen(false)
                setIsCartOpen(false)
                setIsMobileMenuOpen(false)
              }}
            >
              <span className="nav-pill__icon nav-language-flag"><img src={assets[selectedLanguage.flag]} alt="" /></span>
              <span className="nav-language-trigger__badge">{selectedLanguage.badge}</span>
            </button>
            <div
              id="navbar-language-dropdown"
              className="cart-dropdown nav-language-dropdown"
              role="menu"
              aria-label={t.language}
              aria-hidden={!isLanguageOpen}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
                event.preventDefault()
                const items = Array.from(event.currentTarget.querySelectorAll('[role="menuitemradio"]'))
                const current = items.indexOf(document.activeElement)
                const delta = event.key === 'ArrowDown' ? 1 : -1
                items[(current + delta + items.length) % items.length]?.focus()
              }}
            >
              {NAVBAR_LANGUAGES.map((option) => (
                <button
                  className="nav-language-option navbar-control"
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={language === option.code}
                  tabIndex={isLanguageOpen ? 0 : -1}
                  onClick={() => selectLanguage(option.code)}
                >
                  <img src={assets[option.flag]} alt="" />
                  <span><strong>{option.name}</strong><small>{option.badge}</small></span>

                </button>
              ))}
            </div>
          </div>
          <div ref={cartMenuRef} className={`nav-cart-menu${isCartOpen ? ' is-open' : ''}`}>
            <button
              className="nav-pill navbar-control nav-cart-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isCartOpen}
              aria-label={`${cartLabel} (${cartCount(cartItems) + physicalCartCount})`}
              onClick={() => {
                setIsCartOpen((open) => !open)
                setIsProductOpen(false)
                setIsLanguageOpen(false)
                setIsMobileMenuOpen(false)
                setPhysicalCartCount(readPhysicalCartCount())
              }}
            >
              <img src={assets.cart} alt="" />
              <span>{cartLabel}</span>
              {cartCount(cartItems) + physicalCartCount > 0 && <b className="nav-cart-count">{cartCount(cartItems) + physicalCartCount}</b>}
            </button>
            <div className="cart-dropdown" role="menu" aria-hidden={!isCartOpen}>
              <a className="navbar-control" href="/cart" role="menuitem" onClick={() => setIsCartOpen(false)}>
                <span><strong>{t.digitalCart}</strong><small>Top Up, Voucher, Joki &amp; Akun Game</small></span>
                <b>{cartCount(cartItems)}</b>
              </a>
              <a className="navbar-control" href="/cart?flow=physical" role="menuitem" onClick={() => setIsCartOpen(false)}>
                <span><strong>{t.physicalCart}</strong><small>Merchandise</small></span>
                <b>{physicalCartCount}</b>
              </a>
            </div>
          </div>
          {verifiedSession && <a className="nav-avatar" href="/account" aria-label="Akun Zetruv">{String(verifiedSession.customer?.name||'A').slice(0,1).toUpperCase()}</a>}
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
              <img src={assets.home} alt="" />{t.home}
            </a>

            <div ref={productMenuRef} className={`nav-product-menu${isProductOpen ? ' is-open' : ''}`}>
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
                  setIsLanguageOpen(false)
                  setIsMobileMenuOpen(false)
                }}
              >
                {productLabel} <img src={assets.navDown} alt="" />
              </a>
              <div className="product-dropdown" aria-label="Product categories" aria-hidden={!isProductOpen}>
                {productLinks.map((link) => (
                  <a className="navbar-control" href={link.href} key={link.label}>
                    <span>{t.products[link.label] || link.label}</span>
                    {link.arrow && <img src={assets.productDropdownArrow} alt="" />}
                  </a>
                ))}
              </div>
            </div>

            <a className={`navbar-control${activeNav === 'article' ? ' active' : ''}`} href="/articles" aria-current={activeNav === 'article' ? 'page' : undefined} onClick={() => selectNav('article')}>
              <img src={assets.transaction} alt="" />{articleLabel}
            </a>
            <a className={`navbar-control${activeNav === 'transaction' ? ' active' : ''}`} href="/order-status" aria-current={activeNav === 'transaction' ? 'page' : undefined} onClick={() => selectNav('transaction')}>
              <img src={assets.transaction} alt="" />{transactionLabel}
            </a>
            <a className={`navbar-control${activeNav === 'leaderboard' ? ' active' : ''}`} href="/leaderboard" aria-current={activeNav === 'leaderboard' ? 'page' : undefined} onClick={() => selectNav('leaderboard')}>
              <img src={assets.leaderboard} alt="" />{t.leaderboard}
            </a>
            <div className={`nav-mobile-more${isMobileMenuOpen ? ' is-open' : ''}`} ref={mobileMenuRef}>
              <button type="button" className="nav-mobile-more__trigger navbar-control" aria-haspopup="menu" aria-expanded={isMobileMenuOpen} aria-label="Menu lainnya"
                onClick={() => { setIsMobileMenuOpen(v => !v); setIsProductOpen(false); setIsCartOpen(false); setIsLanguageOpen(false) }}>
                Menu <img src={assets.navDown} alt="" />
              </button>
              <div className="cart-dropdown nav-mobile-more__dropdown" role="menu" aria-hidden={!isMobileMenuOpen}>
                <a href="/search" role="menuitem">{t.product}</a>
                <a href="/merchandise" role="menuitem">Merchandise</a>
                <a href="/articles" role="menuitem">{t.article}</a>
                <a href="/order-status" role="menuitem">{t.transaction}</a>
                <a href="/leaderboard" role="menuitem">{t.leaderboard}</a>
              </div>
            </div>
          </nav>

          {!verifiedSession && (
            <div className="auth-actions">
              <button className="btn btn--outline navbar-control" type="button" aria-haspopup="dialog" onClick={() => setAuthMode('login')}>
                <img src={assets.login} alt="" />{t.login}
              </button>
              <button className="btn btn--ghost navbar-control" type="button" aria-haspopup="dialog" onClick={() => setAuthMode('register')}>
                <img src={assets.register} alt="" />{t.register}
              </button>
            </div>
          )}
          {verifiedSession && <div className="auth-actions"><button type="button" className="btn btn--outline navbar-control"
            onClick={()=>{logoutCustomer();setVerifiedSession(null)}}>{t.logout}</button></div>}
        </div>
      </div>
      </header>

      {authMode && (
        <AuthModal mode={authMode} resetToken={resetToken.current} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={handleAuthenticated} />
      )}
    </>
  )
}
