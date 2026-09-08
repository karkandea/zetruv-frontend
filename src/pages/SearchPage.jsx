import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { searchAssets } from '../data/searchAssets'
import { getCatalogCategories, getCatalogProducts } from '../services/catalogService'
import '../styles/search.css'
import '../styles/search-login.css'

const CATEGORY_PRESENTATION = {
  TopUpGame: {
    key: 'player-id',
    label: 'Top Up Via ID',
    icon: searchAssets.categoryPlayerId,
    route: '/search',
  },
  TopUpLogin: {
    key: 'login',
    label: 'Top Up Via Login',
    icon: searchAssets.categoryLogin,
    route: '/search/login',
  },
  GameVoucher: {
    key: 'voucher',
    label: 'Voucher Game',
    icon: searchAssets.categoryItems,
  },
  Joki: {
    key: 'joki',
    label: 'Joki Game',
    icon: searchAssets.categoryItems,
  },
  GameAccount: {
    key: 'accounts',
    label: 'Akun Game',
    icon: searchAssets.categoryAccounts,
  },
  Merchandise: {
    key: 'merchandise',
    label: 'Merchandise',
    icon: searchAssets.categoryMerchandise,
  },
}

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

function productHref(product) {
  if (product.kind === 'TopUpGame' && product.slug === 'mobile-legends') {
    return '/product/mobile-legends'
  }

  if (product.kind === 'TopUpLogin' && product.slug === 'genshin-impact') {
    return '/product/genshin-impact/login'
  }

  return undefined
}

function CatalogCard({ product, categoryLabel }) {
  const href = productHref(product)

  function handleClick() {
    if (href) window.location.href = href
  }

  return (
    <button
      className="search-game-card"
      type="button"
      aria-label={`Open ${product.name}`}
      onClick={handleClick}
    >
      <img src={product.thumbnailUrl || fallbackProductImage(product)} alt="" />
      <span className="search-game-card__copy">
        <strong>{product.name}</strong>
        <small>{product.gameName || categoryLabel}</small>
      </span>
    </button>
  )
}

function filterByLetter(items, letter) {
  if (!letter || letter === '#') return items
  return items.filter((item) => item.name.toUpperCase().startsWith(letter))
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
        if (!cancelled) {
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

        if (!cancelled) {
          setProducts(result.items || [])
        }
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
    return () => {
      cancelled = true
    }
  }, [activeKind, submittedQuery])

  const categoryDefinitions = useMemo(
    () => categories.map((category) => {
      const presentation = CATEGORY_PRESENTATION[category.kind] || {}
      return {
        ...category,
        key: presentation.key || category.slug,
        label: presentation.label || category.name,
        icon: category.iconUrl || presentation.icon || searchAssets.categoryItems,
        route: presentation.route,
      }
    }),
    [categories],
  )

  const activeCategory = categoryDefinitions.find((category) => category.kind === activeKind)
  const categoryLabel = activeCategory?.label || CATEGORY_PRESENTATION[activeKind]?.label || 'Catalog'
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

  function handleSearch(event) {
    event.preventDefault()
    const next = query.trim()
    setSubmittedQuery(next)

    const url = new URL(window.location.href)
    if (next) url.searchParams.set('q', next)
    else url.searchParams.delete('q')

    if (!isLoginMode && activeKind !== 'TopUpGame') {
      url.searchParams.set('kind', activeKind)
    }

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
    const url = new URL(window.location.href)

    if (category.kind === 'TopUpLogin') {
      url.pathname = '/search/login'
      url.searchParams.delete('kind')
    } else {
      url.pathname = '/search'
      if (category.kind === 'TopUpGame') url.searchParams.delete('kind')
      else url.searchParams.set('kind', category.kind)
    }

    window.location.href = `${url.pathname}${url.search}`
  }

  const loading = loadingCatalog || loadingProducts

  return (
    <div className={`search-site-shell${isLoginMode ? ' search-site-shell--login' : ''}`}>
      <Navbar variant={isLoginMode ? 'loginCatalog' : 'catalog'} />

      <main className={`search-page${isLoginMode ? ' search-page--login' : ''}`}>
        <div className="search-page__container">
          {!isLoginMode && (
            <>
              <p className="search-breadcrumb"><a href="/">Home</a> / Categories</p>
              <h1>Browse Categories</h1>
              <p className="search-page__intro">Find the game, top-up method, or product you’re looking for.</p>
            </>
          )}

          <section className="search-catalog" aria-label={isLoginMode ? 'Explore kategori via login' : 'Browse Zetruv categories'}>
            <aside className="search-sidebar">
              <h2>{isLoginMode ? 'Kategori' : 'Categories'}</h2>
              <div className="search-category-list">
                {categoryDefinitions.map((category) => (
                  <button
                    type="button"
                    key={category.id}
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

            <div className="search-catalog__content">
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
                <h2>{isLoginMode ? 'Kategori Populer' : 'Popular Games'}</h2>
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
                <div className="search-empty">
                  {isLoginMode ? 'Game tidak ditemukan. Coba kata kunci atau huruf lain.' : 'No games found. Try another keyword or letter.'}
                </div>
              )}

              <div className="search-section-heading search-section-heading--more">
                <div>
                  <h2>{isLoginMode ? 'Kategori Lainnya' : 'More Games'}</h2>
                  <p>{isLoginMode ? 'Game yang tersedia di katalog Zetruv' : 'Browse more products available in the selected category.'}</p>
                </div>
              </div>

              {!loading && !catalogError && moreProducts.length > 0 && (
                <div className="search-game-grid">
                  {moreProducts.map((product) => (
                    <CatalogCard key={`more-${product.id}`} product={product} categoryLabel={categoryLabel} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
