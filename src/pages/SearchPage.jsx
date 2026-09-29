import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { searchAssets } from '../data/searchAssets'
import { getCatalogCategories, getCatalogProducts } from '../services/catalogService'
import '../styles/search.css'
import '../styles/search-login.css'

const CATEGORY_ORDER = ['TopUpGame', 'TopUpLogin', 'GameVoucher', 'Joki', 'GameAccount', 'Merchandise']

const CATEGORY_PRESENTATION = {
  TopUpGame: {
    key: 'player-id',
    browseLabel: 'Top Up Games Via ID',
    loginLabel: 'Top Up Via ID',
    icon: searchAssets.categoryPlayerId,
  },
  TopUpLogin: {
    key: 'login',
    browseLabel: 'Top Up Games Via Login',
    loginLabel: 'Top Up Via Login',
    icon: searchAssets.categoryLogin,
  },
  GameVoucher: {
    key: 'voucher',
    browseLabel: 'Voucher Game',
    loginLabel: 'Voucher Game',
    icon: searchAssets.categoryItems,
  },
  Joki: {
    key: 'joki',
    browseLabel: 'Joki Game',
    loginLabel: 'Joki Game',
    icon: searchAssets.categoryJoki || searchAssets.categoryItems,
  },
  GameAccount: {
    key: 'accounts',
    browseLabel: 'Game Accounts',
    loginLabel: 'Akun Game',
    icon: searchAssets.categoryAccounts,
  },
  Merchandise: {
    key: 'merchandise',
    browseLabel: 'Merchandise',
    loginLabel: 'Merchandise',
    icon: searchAssets.categoryMerchandise,
  },
}

const FALLBACK_CATEGORIES = CATEGORY_ORDER.map((kind, index) => ({
  id: `fallback-category-${index + 1}`,
  kind,
  name: CATEGORY_PRESENTATION[kind].browseLabel,
  slug: CATEGORY_PRESENTATION[kind].key,
  iconUrl: CATEGORY_PRESENTATION[kind].icon,
}))

const FALLBACK_PRODUCTS = {
  TopUpGame: [
    { id: 'fallback-mlbb', kind: 'TopUpGame', slug: 'mobile-legends', name: 'Mobile Legends', publisher: 'Moonton', thumbnailUrl: searchAssets.mobileLegends, isAvailable: true },
    { id: 'fallback-pubg', kind: 'TopUpGame', slug: 'pubg-mobile', name: 'PUBG Mobile', publisher: 'Tencent', thumbnailUrl: searchAssets.pubgMobile, isAvailable: true },
    { id: 'fallback-valorant', kind: 'TopUpGame', slug: 'valorant', name: 'Valorant', publisher: 'Riot Games', thumbnailUrl: searchAssets.valorant, isAvailable: true },
    { id: 'fallback-genshin', kind: 'TopUpGame', slug: 'genshin-impact', name: 'Genshin Impact', publisher: 'HoYoverse', thumbnailUrl: searchAssets.genshinImpact, isAvailable: true },
    { id: 'fallback-codm', kind: 'TopUpGame', slug: 'call-of-duty-mobile', name: 'Call of Duty Mobile', publisher: 'Activision', thumbnailUrl: searchAssets.callOfDutyMobile, isAvailable: true },
    { id: 'fallback-star-rail', kind: 'TopUpGame', slug: 'honkai-star-rail', name: 'Honkai: Star Rail', publisher: 'HoYoverse', thumbnailUrl: searchAssets.starRail, isAvailable: true },
  ],
  TopUpLogin: [
    { id: 'login-genshin', kind: 'TopUpLogin', slug: 'genshin-impact', name: 'Genshin Impact', publisher: 'HoYoverse', thumbnailUrl: searchAssets.genshinImpact, isAvailable: true },
  ],
  GameVoucher: [
    { id: 'voucher-steam', kind: 'GameVoucher', slug: 'steam-wallet-idr', name: 'Steam Wallet IDR', publisher: 'Steam', thumbnailUrl: searchAssets.categoryItems, isAvailable: true },
    { id: 'voucher-google', kind: 'GameVoucher', slug: 'google-play-gift-code', name: 'Google Play Gift Code', publisher: 'Google Play', thumbnailUrl: searchAssets.categoryItems, isAvailable: true },
    { id: 'voucher-ps', kind: 'GameVoucher', slug: 'playstation-store', name: 'PlayStation Store', publisher: 'PlayStation', thumbnailUrl: searchAssets.categoryItems, isAvailable: true },
  ],
  Joki: [
    { id: 'joki-ml', kind: 'Joki', slug: 'mobile-legends-rank-push', name: 'Mobile Legends Rank Push', publisher: 'Joki Game', thumbnailUrl: searchAssets.mobileLegends, isAvailable: true },
    { id: 'joki-valorant', kind: 'Joki', slug: 'valorant-rank-boost', name: 'Valorant Rank Boost', publisher: 'Joki Game', thumbnailUrl: searchAssets.valorant, isAvailable: true },
    { id: 'joki-genshin', kind: 'Joki', slug: 'genshin-daily-abyss', name: 'Genshin Daily & Abyss', publisher: 'Joki Game', thumbnailUrl: searchAssets.genshinImpact, isAvailable: true },
  ],
  GameAccount: [
    { id: 'account-dota', kind: 'GameAccount', slug: 'dota-2', name: 'Dota 2 Accounts', publisher: 'Game Account', thumbnailUrl: searchAssets.categoryAccounts, isAvailable: true },
    { id: 'account-ml', kind: 'GameAccount', slug: 'mobile-legends', name: 'Mobile Legends Accounts', publisher: 'Game Account', thumbnailUrl: searchAssets.mobileLegends, isAvailable: true },
  ],
  Merchandise: [
    { id: 'merch-jersey', kind: 'Merchandise', slug: 'zetruv-gaming-jersey', name: 'Zetruv Gaming Jersey', publisher: 'Merchandise', thumbnailUrl: searchAssets.categoryMerchandise, isAvailable: true },
    { id: 'merch-keychain', kind: 'Merchandise', slug: 'zetruv-crest-keychain', name: 'Zetruv Crest Keychain', publisher: 'Merchandise', thumbnailUrl: searchAssets.categoryMerchandise, isAvailable: true },
    { id: 'merch-scarf', kind: 'Merchandise', slug: 'zetruv-supporter-scarf', name: 'Zetruv Supporter Scarf', publisher: 'Merchandise', thumbnailUrl: searchAssets.categoryMerchandise, isAvailable: true },
  ],
}

const BROWSE_PRODUCT_MATCHERS = [
  (value) => value.includes('mobile legend'),
  (value) => value.includes('pubg'),
  (value) => value.includes('valorant'),
  (value) => value.includes('genshin'),
  (value) => value.includes('call of duty') || value.includes('codm'),
  (value) => value.includes('star rail'),
]

const alphabet = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V', 'W']

function fallbackProductImage(product) {
  if (product.kind === 'GameVoucher') return searchAssets.categoryItems
  if (product.kind === 'Joki') return searchAssets.categoryJoki || searchAssets.categoryItems
  if (product.kind === 'GameAccount') return searchAssets.categoryAccounts
  if (product.kind === 'Merchandise') return searchAssets.categoryMerchandise

  const value = `${product.name || ''} ${product.gameName || ''}`.toLowerCase()
  if (value.includes('mobile legend')) return searchAssets.mobileLegends
  if (value.includes('pubg')) return searchAssets.pubgMobile
  if (value.includes('valorant')) return searchAssets.valorant
  if (value.includes('genshin')) return searchAssets.genshinImpact
  if (value.includes('call of duty') || value.includes('codm')) return searchAssets.callOfDutyMobile
  if (value.includes('star rail')) return searchAssets.starRail
  return searchAssets.mobileLegends
}

function publisherForProduct(product, fallback) {
  if (product.publisher) return product.publisher
  if (product.gamePublisher) return product.gamePublisher
  if (product.game?.publisher) return product.game.publisher
  if (['GameVoucher', 'Joki', 'GameAccount', 'Merchandise'].includes(product.kind)) return CATEGORY_PRESENTATION[product.kind]?.browseLabel || fallback

  const value = `${product.name || ''} ${product.gameName || ''}`.toLowerCase()
  if (value.includes('mobile legend')) return 'Moonton'
  if (value.includes('pubg')) return 'Tencent'
  if (value.includes('valorant')) return 'Riot Games'
  if (value.includes('genshin')) return 'HoYoverse'
  if (value.includes('call of duty') || value.includes('codm')) return 'Activision'
  if (value.includes('star rail')) return 'HoYoverse'
  return fallback
}

function productHref(product) {
  if (product.isAvailable === false) return undefined
  if (product.kind === 'TopUpGame') return `/product/${product.slug}`
  if (product.kind === 'TopUpLogin') return `/product/${product.slug}/login`
  if (product.kind === 'GameVoucher') return `/product/voucher/${product.slug}`
  if (product.kind === 'Joki') return `/product/joki/${product.slug}`
  if (product.kind === 'GameAccount') return product.slug === 'dota-2' ? '/game-accounts/dota-2' : '/game-accounts'
  if (product.kind === 'Merchandise') return product.slug === 'zetruv-gaming-jersey' ? '/merchandise/zetruv-gaming-jersey' : '/merchandise'
  return undefined
}

function CatalogCard({ product, categoryLabel }) {
  const href = productHref(product)
  const available = product.isAvailable !== false

  return (
    <button
      className="search-game-card"
      type="button"
      aria-label={available ? `Open ${product.name}` : `${product.name} unavailable`}
      onClick={() => href && (window.location.href = href)}
      disabled={!available}
    >
      <img
        src={product.thumbnailUrl || fallbackProductImage(product)}
        alt=""
        onError={(event) => {
          const fallback = fallbackProductImage(product)
          if (event.currentTarget.src !== new URL(fallback, window.location.origin).href) event.currentTarget.src = fallback
        }}
      />
      <span className="search-game-card__copy">
        <strong>{product.name}</strong>
        <small>{publisherForProduct(product, product.gameName || categoryLabel)}</small>
      </span>
    </button>
  )
}

function filterByLetter(items, letter) {
  if (!letter || letter === '#') return items
  return items.filter((item) => item.name.toUpperCase().startsWith(letter))
}

function orderBrowseProducts(items) {
  const ordered = []
  const used = new Set()

  BROWSE_PRODUCT_MATCHERS.forEach((matches) => {
    const item = items.find((product) => !used.has(product.id) && matches(`${product.name || ''} ${product.gameName || ''}`.toLowerCase()))
    if (item) {
      ordered.push(item)
      used.add(item.id)
    }
  })

  items.forEach((item) => {
    if (!used.has(item.id)) ordered.push(item)
  })

  return ordered
}

function initialKind(mode) {
  if (mode === 'login') return 'TopUpLogin'
  const requested = new URLSearchParams(window.location.search).get('kind')
  return CATEGORY_ORDER.includes(requested) ? requested : 'TopUpGame'
}

function filterFallbackProducts(kind, search) {
  const source = FALLBACK_PRODUCTS[kind] || []
  const q = search.trim().toLowerCase()
  if (q.length < 3) return source
  return source.filter((item) => `${item.name} ${item.publisher || ''}`.toLowerCase().includes(q))
}

export default function SearchPage({ mode = 'player-id' }) {
  const isLoginMode = mode === 'login'
  const rawInitialQuery = new URLSearchParams(window.location.search).get('q') || ''
  const initialQuery = rawInitialQuery.trim().length >= 3 ? rawInitialQuery : ''
  const [query, setQuery] = useState(rawInitialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [activeKind, setActiveKind] = useState(() => initialKind(mode))
  const [activeLetter, setActiveLetter] = useState('M')
  const [letterFiltering, setLetterFiltering] = useState(false)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  const trimmedQuery = query.trim()
  const queryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < 3

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      try {
        const result = await getCatalogCategories()
        if (!cancelled) setCategories(result)
      } catch {
        // Sidebar always has complete local category definitions.
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    }
    loadCategories()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const next = query.trim()
    if (next.length > 0 && next.length < 3) return undefined

    const timer = window.setTimeout(() => {
      setSubmittedQuery(next)
      const url = new URL(window.location.href)
      if (next) url.searchParams.set('q', next)
      else url.searchParams.delete('q')
      if (activeKind === 'TopUpGame') url.searchParams.delete('kind')
      else url.searchParams.set('kind', activeKind)
      window.history.replaceState({}, '', `${url.pathname}${url.search}`)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [query, activeKind])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoadingProducts(true)
      setCatalogError('')

      try {
        const result = await getCatalogProducts({ kind: activeKind, search: submittedQuery, pageSize: 50 })
        if (!cancelled) setProducts(result.items || [])
      } catch (error) {
        if (!cancelled) {
          setProducts([])
          setCatalogError(error.message || 'Catalog products could not be loaded.')
        }
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    }

    loadProducts()
    return () => { cancelled = true }
  }, [activeKind, submittedQuery])

  const categoryDefinitions = useMemo(() => CATEGORY_ORDER.map((kind) => {
    const presentation = CATEGORY_PRESENTATION[kind]
    const fallback = FALLBACK_CATEGORIES.find((category) => category.kind === kind)
    const apiCategory = categories.find((category) => category.kind === kind)
    const category = { ...fallback, ...apiCategory }
    return {
      ...category,
      key: presentation.key,
      label: isLoginMode ? presentation.loginLabel : presentation.browseLabel,
      icon: category.iconUrl || presentation.icon,
    }
  }), [categories, isLoginMode])

  const activeCategory = categoryDefinitions.find((category) => category.kind === activeKind)
  const categoryLabel = activeCategory?.label || CATEGORY_PRESENTATION[activeKind]?.browseLabel || 'Catalog'
  const fallbackRows = useMemo(() => filterFallbackProducts(activeKind, submittedQuery), [activeKind, submittedQuery])
  const sourceProducts = products.length ? products : fallbackRows
  const effectiveLetter = letterFiltering ? activeLetter : ''
  const filteredProducts = useMemo(() => filterByLetter(sourceProducts, effectiveLetter), [sourceProducts, effectiveLetter])

  const popularProducts = useMemo(() => {
    const featured = filteredProducts.filter((product) => product.isFeatured)
    return featured.length > 0 ? featured.slice(0, 6) : filteredProducts.slice(0, 6)
  }, [filteredProducts])

  const browseProducts = useMemo(() => orderBrowseProducts(filteredProducts), [filteredProducts])
  const browsePrimaryProducts = useMemo(() => browseProducts.slice(0, 6), [browseProducts])
  const browseMoreProducts = useMemo(() => browseProducts.slice(6, 12), [browseProducts])
  const popularIds = useMemo(() => new Set(popularProducts.map((product) => product.id)), [popularProducts])
  const moreProducts = useMemo(() => filteredProducts.filter((product) => !popularIds.has(product.id)).slice(0, 12), [filteredProducts, popularIds])

  function handleSearch(event) {
    event.preventDefault()
    const next = query.trim()
    if (next.length > 0 && next.length < 3) return
    setSubmittedQuery(next)
  }

  function handleLetter(letter) {
    if (letterFiltering && activeLetter === letter) {
      setLetterFiltering(false)
      return
    }
    setActiveLetter(letter)
    setLetterFiltering(true)
  }

  function handleCategory(category) {
    if (category.kind === 'Merchandise') {
      window.location.href = '/merchandise'
      return
    }
    if (category.kind === 'GameAccount') {
      window.location.href = '/game-accounts'
      return
    }

    setActiveKind(category.kind)
    setLetterFiltering(false)
    setCatalogError('')
    const url = new URL(window.location.href)
    url.pathname = '/search'
    if (category.kind === 'TopUpGame') url.searchParams.delete('kind')
    else url.searchParams.set('kind', category.kind)
    if (query.trim().length < 3) url.searchParams.delete('q')
    window.history.pushState({}, '', `${url.pathname}${url.search}`)
  }

  const loading = loadingCatalog || loadingProducts
  const hasVisibleFallback = fallbackRows.length > 0
  const showLoading = loading && !hasVisibleFallback && !queryTooShort
  const showError = Boolean(catalogError) && !hasVisibleFallback && !queryTooShort
  const noResults = !loading && !queryTooShort && filteredProducts.length === 0

  const searchState = queryTooShort
    ? 'min'
    : showLoading
      ? 'loading'
      : showError
        ? 'error'
        : noResults
          ? 'empty'
          : 'results'

  return (
    <div className={`search-site-shell${isLoginMode ? ' search-site-shell--login' : ''}`}>
      <Navbar variant={isLoginMode ? 'loginCatalog' : 'default'} />

      <main className={`search-page${isLoginMode ? ' search-page--login' : ' search-page--browse'}`}>
        <div className="search-page__container">
          {!isLoginMode && (
            <>
              <p className="search-breadcrumb"><a href="/">Home</a> / Categories</p>
              <h1>Browse Categories</h1>
              <p className="search-page__intro">Find the game, top-up method, or product you’re looking for.</p>
            </>
          )}

          <section className={`search-catalog${isLoginMode ? '' : ' search-catalog--browse'}`} aria-label="Browse Zetruv categories">
            <aside className={`search-sidebar${isLoginMode ? '' : ' search-sidebar--browse'}`}>
              <h2>{isLoginMode ? 'Kategori' : 'Categories'}</h2>
              <div className="search-category-list">
                {categoryDefinitions.map((category) => (
                  <button
                    type="button"
                    key={category.kind}
                    className={`search-category${activeKind === category.kind ? ' active' : ''}`}
                    onClick={() => handleCategory(category)}
                  >
                    <span className="search-category__icon"><img src={category.icon} alt="" /></span>
                    <span>{category.label}</span>
                    {activeKind === category.kind && <i aria-hidden="true" />}
                  </button>
                ))}
              </div>

              <button className="search-help-card" type="button">
                <strong>{isLoginMode ? 'Admin Support' : 'Need Help?'}</strong>
                <span>{isLoginMode ? 'Chat admin jika terjadi kendala' : 'Chat with our support team.'}</span>
              </button>
            </aside>

            <div className={`search-catalog__content${isLoginMode ? '' : ' search-catalog__content--browse'}`}>
              <form className="catalog-search" onSubmit={handleSearch}>
                <img src={searchAssets.searchIcon} alt="" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={isLoginMode ? 'Cari game atau kategori' : 'Search games or categories'}
                  aria-label={isLoginMode ? 'Cari game atau kategori' : 'Search games or categories'}
                />
                <button type="submit" disabled={queryTooShort}>{isLoginMode ? 'Cari' : 'Search'}</button>
              </form>

              <div className="search-query-state" aria-live="polite">
                {searchState === 'min' && <span>Type at least 3 characters to start searching.</span>}
                {searchState === 'loading' && <span>Loading results…</span>}
                {searchState === 'error' && <span>Couldn’t load results. Showing available local catalog where possible.</span>}
                {searchState === 'empty' && <span>No results found for “{submittedQuery}”. Try another keyword or category.</span>}
              </div>

              {isLoginMode && (
                <div className="alphabet-filter" aria-label="Filter games alphabetically">
                  <strong>A–Z</strong>
                  {alphabet.map((letter) => (
                    <button key={letter} type="button" className={activeLetter === letter && letterFiltering ? 'active' : ''} onClick={() => handleLetter(letter)}>{letter}</button>
                  ))}
                </div>
              )}

              {isLoginMode && (
                <div className="search-section-heading">
                  <h2>Kategori Populer</h2>
                  <span>{categoryLabel}</span>
                </div>
              )}

              {searchState === 'results' && (
                <>
                  {(isLoginMode ? popularProducts : browsePrimaryProducts).length > 0 ? (
                    <div className={`search-game-grid${isLoginMode ? '' : ' search-game-grid--browse-primary'}`}>
                      {(isLoginMode ? popularProducts : browsePrimaryProducts).map((product) => (
                        <CatalogCard key={product.id} product={product} categoryLabel={categoryLabel} />
                      ))}
                    </div>
                  ) : (
                    <div className="search-empty search-empty--browse">No products found in this category.</div>
                  )}

                  {(isLoginMode ? moreProducts : browseMoreProducts).length > 0 && (
                    <>
                      <div className="search-section-heading search-section-heading--more search-section-heading--browse-more">
                        <div><h2>More Products</h2><p>Browse more products available on Zetruv.</p></div>
                      </div>
                      <div className={`search-game-grid${isLoginMode ? '' : ' search-game-grid--browse-more'}`}>
                        {(isLoginMode ? moreProducts : browseMoreProducts).map((product) => (
                          <CatalogCard key={`more-${product.id}`} product={product} categoryLabel={categoryLabel} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {searchState !== 'results' && (
                <div className="search-empty search-empty--browse search-empty--state">
                  {searchState === 'min' && 'Search starts after 3 characters.'}
                  {searchState === 'loading' && 'Loading catalog…'}
                  {searchState === 'error' && 'Catalog could not be loaded. Please try again.'}
                  {searchState === 'empty' && 'No products match your search.'}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
