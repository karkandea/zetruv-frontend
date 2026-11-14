import { useEffect, useRef, useState } from 'react'
import { assets } from '../data/assets'
import AuthModal from './AuthModal'
import NavbarSearch from './NavbarSearch'
import HelpCenterDialog from './HelpCenterDialog'
import { ChevronDown, ClipboardList, Gamepad2, Home, LifeBuoy, LogIn, LogOut, Newspaper, Settings, ShoppingBag, Trophy, UserRound, UserRoundPlus } from 'lucide-react'
import { NAVBAR_COPY, NAVBAR_LANGUAGES } from '../services/navbarLanguage'
import { setNavbarLanguage, useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { cartCount, onCartChange, readCart } from '../services/cartService'
import { activateCustomerCart, readCustomerSession, refreshCustomerCart, setCustomerSession, logoutCustomer, watchCustomerSession, CUSTOMER_EVENT } from '../services/customerCartSync'
import { readPendingRegistration } from '../services/registrationVerification'

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

export default function Navbar({ variant = 'default', onAuthenticated, homepageMobileMenu = false, restoreSession = true }) {
  const [isProductOpen, setIsProductOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHomepageDrawerOpen, setIsHomepageDrawerOpen] = useState(false)
  const [isHomepageProductsOpen, setIsHomepageProductsOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const language = useNavbarLanguage()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [verifiedSession,setVerifiedSession]=useState(readCustomerSession)
  const [logoutError, setLogoutError] = useState('')
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
  const homepageDrawerRef = useRef(null)
  const homepageMenuButtonRef = useRef(null)
  const resetToken = useRef(typeof window === 'undefined' ? '' : (window.location.pathname === '/auth/reset-password' ? new URLSearchParams(window.location.search).get('token') || '' : ''))
  const languageMenuRef = useRef(null)
  const languageButtonRef = useRef(null)
  const accountMenuRef = useRef(null)
  const accountButtonRef = useRef(null)
  const brandRef = useRef(null)

  const isCatalog = variant === 'catalog'
  const isLoginCatalog = variant === 'loginCatalog'
  const isHomeLoggedIn = variant === 'homeLoggedIn'
  const isLeaderboard = variant === 'leaderboard'
  const isArticle = variant === 'article'
  const isLoggedIn = Boolean(verifiedSession) // Page variant is never authentication.
  const accountInitial = String(verifiedSession?.customer?.name || 'A').slice(0, 1).toUpperCase()
  const homeActive = variant === 'default' || isLoginCatalog || isHomeLoggedIn

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
  useEffect(()=>{
    const refreshSession=()=>{
      const session = readCustomerSession()
      setVerifiedSession(session)
      if (!session) setIsAccountOpen(false)
    }
    const onFocus=()=>{if(readCustomerSession())refreshCustomerCart().catch(()=>{})}
    window.addEventListener(CUSTOMER_EVENT,refreshSession)
    window.addEventListener('focus',onFocus)
    return ()=>{window.removeEventListener(CUSTOMER_EVENT,refreshSession)
      window.removeEventListener('focus',onFocus)}
  },[])

  useEffect(() => watchCustomerSession({ restoreSession }), [restoreSession])

  useEffect(() => {
    const refreshPhysicalCart = () => setPhysicalCartCount(readPhysicalCartCount())
    refreshPhysicalCart()
    window.addEventListener('focus', refreshPhysicalCart)
    window.addEventListener('pageshow', refreshPhysicalCart)
    window.addEventListener('zetruv:physical-cart-changed', refreshPhysicalCart)
    return () => {
      window.removeEventListener('focus', refreshPhysicalCart)
      window.removeEventListener('pageshow', refreshPhysicalCart)
      window.removeEventListener('zetruv:physical-cart-changed', refreshPhysicalCart)
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
      if (homepageDrawerRef.current && !homepageDrawerRef.current.contains(event.target)) setIsHomepageDrawerOpen(false)
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageOpen(false)
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) setIsAccountOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (event.target.closest?.('#navbar-account-dropdown')) accountButtonRef.current?.focus()
        setIsAccountOpen(false)
        if (event.target.closest?.('#zetruv-homepage-mobile-nav')) homepageMenuButtonRef.current?.focus()
        setIsProductOpen(false)
        setIsCartOpen(false)
        setIsLanguageOpen(false)
        setIsMobileMenuOpen(false)
        setIsHomepageDrawerOpen(false)
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
    isLoggedIn ? 'navbar--has-account' : '',
    isHomeLoggedIn ? 'navbar--home-final' : '',
    homepageMobileMenu ? 'navbar--homepage-mobile' : '',
  ].filter(Boolean).join(' ')

  function selectNav(name) {
    setActiveNav(name)
    if (name !== 'product') setIsProductOpen(false)
    setIsCartOpen(false)
    setIsLanguageOpen(false)
    setIsMobileMenuOpen(false)
    setIsHomepageDrawerOpen(false)
    setIsAccountOpen(false)
  }

  function selectLanguage(code) {
    setNavbarLanguage(code)
    setIsLanguageOpen(false)
    languageButtonRef.current?.focus()
  }

  function handleAuthenticated(response) {
    setCustomerSession(response)
    setVerifiedSession(readCustomerSession())
    activateCustomerCart().catch(()=>{}) // error is displayed on cart; guest draft retained.
    onAuthenticated?.(response)
  }

  async function handleLogout() {
    if (loggingOut) return
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logoutCustomer()
      setIsAccountOpen(false)
      setIsHomepageDrawerOpen(false)
      brandRef.current?.focus()
    } catch {
      setLogoutError(t.logoutError)
    } finally {
      setLoggingOut(false)
    }
  }

  function openRegistration() {
    setAuthMode(readPendingRegistration() ? 'register-verify' : 'register')
  }

  return (
    <>
      <header className={navbarClasses}>
      <div ref={homepageDrawerRef} className="navbar__homepage-mobile-wrapper">
      <div className="navbar__top design-container">
        <a ref={brandRef} className="brand navbar-control" href="/" aria-label="Zetruv home">
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
                setIsAccountOpen(false)
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
                setIsAccountOpen(false)
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
        </div>
        {verifiedSession && (
          <div ref={accountMenuRef} className="nav-account" onBlur={(event) => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setIsAccountOpen(false)
          }}>
            <button
              ref={accountButtonRef}
              className="nav-account__trigger"
              type="button"
              aria-label={t.accountMenu}
              aria-expanded={isAccountOpen}
              aria-controls="navbar-account-dropdown"
              onClick={() => {
                setIsAccountOpen((open) => !open)
                setIsProductOpen(false)
                setIsCartOpen(false)
                setIsLanguageOpen(false)
                setIsMobileMenuOpen(false)
                setIsHomepageDrawerOpen(false)
              }}
            >
              <span className="nav-account__avatar" aria-hidden="true">{accountInitial}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <nav id="navbar-account-dropdown" className="nav-account__dropdown" aria-label={t.accountMenu} hidden={!isAccountOpen}>
              <a className="nav-account__identity" href="/account" onClick={() => setIsAccountOpen(false)}>
                <span className="nav-account__avatar" aria-hidden="true">{accountInitial}</span>
                <span><strong>{verifiedSession.customer?.name || t.account}</strong><small>{verifiedSession.customer?.email}</small></span>
              </a>
              <div className="nav-account__links">
                <a href="/account#account-settings" onClick={() => setIsAccountOpen(false)}><Settings size={18} aria-hidden="true" />{t.settings}</a>
                <button type="button" aria-haspopup="dialog" onClick={() => {
                  setIsAccountOpen(false)
                  setIsHelpOpen(true)
                }}><LifeBuoy size={18} aria-hidden="true" />{t.helpCenter}</button>
              </div>
              <div className="nav-account__footer">
                <button type="button" onClick={handleLogout} disabled={loggingOut}><LogOut size={18} aria-hidden="true" />{t.logout}</button>
              </div>
            </nav>
          </div>
        )}
        {homepageMobileMenu && <button
          className="navbar__hamburger navbar-control"
          ref={homepageMenuButtonRef}
          type="button"
          aria-label={isHomepageDrawerOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-controls="zetruv-homepage-mobile-nav"
          aria-expanded={isHomepageDrawerOpen}
          onClick={() => {
            setIsHomepageDrawerOpen((open) => !open)
            setIsProductOpen(false)
            setIsCartOpen(false)
            setIsLanguageOpen(false)
            setIsAccountOpen(false)
          }}
        >
          <span className="navbar__hamburger-icon" aria-hidden="true"><span /><span /><span /></span>
        </button>}
      </div>

      {homepageMobileMenu && <div id="zetruv-homepage-mobile-nav" className="navbar__mobile-drawer" data-open={isHomepageDrawerOpen} inert={!isHomepageDrawerOpen}>
        <nav className="navbar__mobile-links" aria-label="Navigasi Zetruv mobile">
          <a className={activeNav === 'home' ? 'is-current' : ''} href="/" onClick={() => selectNav('home')}><Home size={18} aria-hidden="true" />{t.home}</a>
          <div className="navbar__mobile-product">
            <button type="button" aria-expanded={isHomepageProductsOpen} aria-controls="zetruv-homepage-products" onClick={() => setIsHomepageProductsOpen((open) => !open)}>
              <Gamepad2 size={18} aria-hidden="true" />{productLabel}<ChevronDown size={17} aria-hidden="true" />
            </button>
            <div id="zetruv-homepage-products" className="navbar__mobile-submenu" data-open={isHomepageProductsOpen} inert={!isHomepageProductsOpen}>
              <div className="navbar__mobile-submenu-clip">
                <div className="navbar__mobile-submenu-links">
                  {productLinks.map((link) => <a href={link.href} key={link.label} onClick={() => selectNav('product')}>{t.products[link.label] || link.label}</a>)}
                </div>
              </div>
            </div>
          </div>
          <a href="/articles" onClick={() => selectNav('article')}><Newspaper size={18} aria-hidden="true" />{articleLabel}</a>
          <a href="/order-status" onClick={() => selectNav('transaction')}><ClipboardList size={18} aria-hidden="true" />{transactionLabel}</a>
          <a href="/leaderboard" onClick={() => selectNav('leaderboard')}><Trophy size={18} aria-hidden="true" />{t.leaderboard}</a>
          <a href="/cart" onClick={() => selectNav('cart')}><ShoppingBag size={18} aria-hidden="true" />{t.digitalCart} <span className="navbar__mobile-count">{cartCount(cartItems)}</span></a>
          <a href="/cart?flow=physical" onClick={() => selectNav('cart')}><ShoppingBag size={18} aria-hidden="true" />{t.physicalCart} <span className="navbar__mobile-count">{physicalCartCount}</span></a>
          {verifiedSession && <a href="/account" onClick={() => selectNav('account')}><UserRound size={18} aria-hidden="true" />{t.account}</a>}
        </nav>
        <div className="navbar__mobile-language" role="group" aria-label={t.language}>
          {NAVBAR_LANGUAGES.map((option) => (
            <button key={option.code} type="button" aria-label={`${t.language}: ${option.name}`} aria-pressed={language === option.code} onClick={() => selectLanguage(option.code)}>
              <img src={assets[option.flag]} alt="" />
            </button>
          ))}
        </div>
        {!verifiedSession && <div className="navbar__mobile-auth">
            <button type="button" onClick={() => { setIsHomepageDrawerOpen(false); setAuthMode('login') }}><LogIn size={18} aria-hidden="true" />{t.login}</button>
            <button type="button" onClick={() => { setIsHomepageDrawerOpen(false); openRegistration() }}><UserRoundPlus size={18} aria-hidden="true" />{t.register}</button>
        </div>}
      </div>}
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
                  setIsAccountOpen(false)
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
              <button className="btn btn--ghost navbar-control" type="button" aria-haspopup="dialog" onClick={openRegistration}>
                <img src={assets.register} alt="" />{t.register}
              </button>
            </div>
          )}
        </div>
      </div>
      </header>

      {logoutError && <p className="navbar-logout-error" role="alert">{logoutError}</p>}
      {isHelpOpen && <HelpCenterDialog labels={t} onClose={() => {
        setIsHelpOpen(false)
        requestAnimationFrame(() => accountButtonRef.current?.focus())
      }} />}
      {authMode && (
        <AuthModal mode={authMode} resetToken={resetToken.current} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={handleAuthenticated} />
      )}
    </>
  )
}
