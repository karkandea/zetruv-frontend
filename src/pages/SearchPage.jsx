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
    route: '/search',
  },
  TopUpLogin: {
    key: 'login',
    browseLabel: 'Top Up Games Via Login',
    loginLabel: 'Top Up Via Login',
    icon: searchAssets.categoryLogin,
    route: '/product/genshin-impact/login',
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

const BROWSE_FALLBACK_PRODUCTS = [
  { id: 'fallback-mlbb', kind: 'TopUpGame', slug: 'mobile-legends', name: 'Mobile Legends', publisher: 'Moonton', thumbnailUrl: searchAssets.mobileLegends, isAvailable: true },
  { id: 'fallback-pubg', kind: 'TopUpGame', slug: 'pubg-mobile', name: 'PUBG Mobile', publisher: 'Tencent', thumbnailUrl: searchAssets.pubgMobile, isAvailable: true },
  { id: 'fallback-valorant', kind: 'TopUpGame', slug: 'valorant', name: 'Valorant', publisher: 'Riot Games', thumbnailUrl: searchAssets.valorant, isAvailable: true },
  { id: 'fallback-genshin', kind: 'TopUpGame', slug: 'genshin-impact', name: 'Genshin Impact', publisher: 'HoYoverse', thumbnailUrl: searchAssets.genshinImpact, isAvailable: true },
  { id: 'fallback-codm', kind: 'TopUpGame', slug: 'call-of-duty-mobile', name: 'Call of Duty Mobile', publisher: 'Activision', thumbnailUrl: searchAssets.callOfDutyMobile, isAvailable: true },
  { id: 'fallback-star-rail', kind: 'TopUpGame', slug: 'honkai-star-rail', name: 'Honkai: Star Rail', publisher: 'HoYoverse', thumbnailUrl: searchAssets.starRail, isAvailable: true },
]

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
  return undefined
}

function CatalogCard({ product, categoryLabel }) {
  const href = productHref(product)
  const available = product.isAvailable !== false

  function handleClick() {
    if (href) window.location.href = href
  }

  return (
    <button
      className="search-game-card"
      type="button"
      aria-label={available ? `Open ${product.name}` : `${product.name} unavailable`}
      onClick={handleClick}
      disabled={!available}
    >
      <img src={product.thumbnailUrl || fallbackProductImage(product)} alt="" />
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
  return new URLSearchParams(window.location.search).get('kind') || 'TopUpGame'
}

export default function SearchPage({ mode = 'player-id' }) {
  const isLoginMode = mode === 'login'
  const initialQuery = new URLSearchParams(window.location.search).get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [activeKind, setActiveKind] = useState(() => initialKind(mode))
  const [activeLetter, setActiveLetter] = useState('M')
  const [letterFiltering, setLetterFiltering] = useState(false)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await getCatalogCategories()
        if (cancelled) return

        setCategories(result)

        if (result.length > 0 && !result.some((category) => category.kind === activeKind)) {
          setActiveKind(result[0].kind)
        }
      } catch (error) {
        if (!cancelled && isLoginMode) {
          setCatalogError(error.message || 'Catalog categories could not be loaded.')
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    }

    loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoadingProducts(true)
      setCatalogError('')

      try {
        const result = await getCatalogProducts({
          kind: activeKind,
          search: submittedQuery,
          pageSize: 50,
        })

        if (!cancelled) setProducts(result.items || [])
      } catch (error) {
        if (!cancelled) {
          setProducts([])
          if (isLoginMode || activeKind !== 'TopUpGame' || submittedQuery) {
            setCatalogError(error.message || 'Catalog products could not be loaded.')
          }
        }
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [activeKind, submittedQuery])

  const categoryDefinitions = useMemo(() => {
    return CATEGORY_ORDER.map((kind) => {
      const presentation = CATEGORY_PRESENTATION[kind]
      const fallback = FALLBACK_CATEGORIES.find((category) => category.kind === kind)
      const apiCategory = categories.find((category) => category.kind === kind)
      const category = { ...fallback, ...apiCategory }

      return {
        ...category,
        key: presentation.key,
        label: isLoginMode ? presentation.loginLabel : presentation.browseLabel,
        icon: category.iconUrl || presentation.icon,
        route: presentation.route,
      }
    })
  }, [categories, isLoginMode])

  const activeCategory = categoryDefinitions.find((category) => category.kind === activeKind)
  const categoryLabel = activeCategory?.label || CATEGORY_PRESENTATION[activeKind]?.browseLabel || 'Catalog'
  const effectiveLetter = letterFiltering ? activeLetter : ''

  const filteredProducts = useMemo(
    () => filterByLetter(products, effectiveLetter),
    [products, effectiveLetter],
  )

  const popularProducts = useMemo(() => {
    const featured = filteredProducts.filter((product) => product.isFeatured)
    return featured.length > 0 ? featured : filteredProducts.slice(0, 6)
  }, [filteredProducts])

  const popularIds = useMemo(
    () => new Set(popularProducts.map((product) => product.id)),
    [popularProducts],
  )

  const moreProducts = useMemo(
    () => filteredProducts.filter((product) => !popularIds.has(product.id)),
    [filteredProducts, popularIds],
  )

  const browsePrimaryProducts = useMemo(() => {
    if (activeKind !== 'TopUpGame') return orderBrowseProducts(products).slice(0, 6)

    if (submittedQuery) return orderBrowseProducts(products).slice(0, 6)

    const source = products.length > 0 ? products : BROWSE_FALLBACK_PRODUCTS
    return orderBrowseProducts(source).slice(0, 6)
  }, [activeKind, products, submittedQuery])

  const browseMoreProducts = useMemo(
    () => browsePrimaryProducts.slice(3, 6),
    [browsePrimaryProducts],
  )

  function handleSearch(event) {
    event.preventDefault()
    const next = query.trim()
    setSubmittedQuery(next)

    const url = new URL(window.location.href)
    if (next) url.searchParams.set('q', next)
    else url.searchParams.delete('q')

    if (!isLoginMode && activeKind !== 'TopUpGame') url.searchParams.set('kind', activeKind)
    else if (!isLoginMode) url.searchParams.delete('kind')

    window.history.replaceState({}, '', `${url.pathname}${url.search}`)
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
    if (category.route) {
      window.location.href = category.route
      return
    }

    const url = new URL(window.location.href)
    url.pathname = '/search'
    if (category.kind === 'TopUpGame') url.searchParams.delete('kind')
    else url.searchParams.set('kind', category.kind)
    window.location.href = `${url.pathname}${url.search}`
  }

  const loading = loadingCatalog || loadingProducts
  const browseHasFallback = !isLoginMode && activeKind === 'TopUpGame' && !submittedQuery && browsePrimaryProducts.length > 0
  const showBrowseLoading = loading && !browseHasFallback
  const showBrowseError = catalogError && browsePrimaryProducts.length === 0

  return (
    <div className={`search-site-shell${isLoginMode ? ' search-site-shell--login' : ''}`}>
      {isLoginMode ? <Navbar variant="loginCatalog" /> : <Navbar />}

      <main className={`search-page${isLoginMode ? ' search-page--login' : ' search-page--browse'}`}>
        <div className="search-page__container">
          {!isLoginMode && (
            <>
              <p className="search-breadcrumb"><a href="/">Home</a> / Categories</p>
              <h1>Browse Categories</h1>
              <p className="search-page__intro">Find the game, top-up method, or product you’re looking for.</p>
            </>
          )}

          <section className={`search-catalog${isLoginMode ? '' : ' search-catalog--browse'}`} aria-label={isLoginMode ? 'Explore kategori via login' : 'Browse Zetruv categories'}>
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
                <button type="submit">{isLoginMode ? 'Cari' : 'Search'}</button>
              </form>

              {isLoginMode ? (
                <>
                  <div className="alphabet-filter" aria-label="Filter games alphabetically">
                    <strong>A–Z</strong>
                    {alphabet.map((letter) => (
                      <button
                        key={letter}
                        type="button"
                        className={activeLetter === letter && letterFiltering ? 'active' : ''}
                        onClick={() => handleLetter(letter)}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>

                  <div className="search-section-heading">
                    <h2>Kategori Populer</h2>
                    <span>{categoryLabel}</span>
                  </div>

                  {loading ? (
                    <div className="search-empty">Loading catalog…</div>
                  ) : catalogError ? (
                    <div className="search-empty">{catalogError}</div>
                  ) : popularProducts.length > 0 ? (
                    <div className="search-game-grid">
                      {popularProducts.map((product) => (
                        <CatalogCard key={product.id} product={product} categoryLabel={categoryLabel} />
                      ))}
                    </div>
                  ) : (
                    <div className="search-empty">Game tidak ditemukan. Coba kata kunci atau huruf lain.</div>
                  )}

                  <div className="search-section-heading search-section-heading--more">
                    <div>
                      <h2>Kategori Lainnya</h2>
                      <p>Game yang tersedia di katalog Zetruv</p>
                    </div>
                  </div>

                  {!loading && !catalogError && moreProducts.length > 0 && (
                    <div className="search-game-grid">
                      {moreProducts.map((product) => (
                        <CatalogCard key={`more-${product.id}`} product={product} categoryLabel={categoryLabel} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {showBrowseLoading ? (
                    <div className="search-empty search-empty--browse">Loading catalog…</div>
                  ) : showBrowseError ? (
                    <div className="search-empty search-empty--browse">{catalogError}</div>
                  ) : browsePrimaryProducts.length > 0 ? (
                    <div className="search-game-grid search-game-grid--browse-primary">
                      {browsePrimaryProducts.map((product) => (
                        <CatalogCard key={product.id} product={product} categoryLabel={categoryLabel} />
                      ))}
                    </div>
                  ) : (
                    <div className="search-empty search-empty--browse">No games found. Try another keyword.</div>
                  )}

                  <div className="search-section-heading search-section-heading--more search-section-heading--browse-more">
                    <div>
                      <h2>More Games</h2>
                      <p>Browse more games available for top-up on Zetruv.</p>
                    </div>
                  </div>

                  {browseMoreProducts.length > 0 && (
                    <div className="search-game-grid search-game-grid--browse-more">
                      {browseMoreProducts.map((product) => (
                        <CatalogCard key={`more-${product.id}`} product={product} categoryLabel={categoryLabel} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
