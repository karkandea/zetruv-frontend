import { Bone, LoadingRegion, ProductSkeleton, SkeletonItems, SkeletonLines } from '../components/Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductReviews, { ProductRating } from '../components/ProductReviews'
import CatalogPage, { CatalogSearch } from '../components/CatalogPage'
import { CatalogCard } from './SearchPage'
import { saveGameAccountCart } from '../data/gameAccountCatalog'
import { getCatalogGames, getCatalogProduct, getCatalogProducts } from '../services/catalogService'
import { accountPrice, accountProductHref, getAccountAttributes, summarizeAccountAttributes } from '../services/gameAccountPresentation'
import '../styles/game-accounts.css'
import '../styles/game-account-live.css'

function StateMessage({ children }) {
  return <div className="ga-live-state" role="status">{children}</div>
}

function GameArtwork({ image, name, className = '' }) {
  const copy = useStorefrontCopy()
  return image
    ? <img className={className} src={image} alt={name} loading="lazy" decoding="async" />
    : <div className={`ga-live-placeholder ${className}`} aria-label={name}>{copy.gameAccounts}</div>
}

export function GameAccountsPage() {
  const copy = useStorefrontCopy()
  const [games, setGames] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    getCatalogGames().then((rows) => {
      if (!active) return
      setGames(Array.isArray(rows) ? rows : [])
    })
      .catch(() => { if (active) { setGames([]); setError(copy.weCouldnTLoadTheCatalog) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const visibleGames = useMemo(
    () => games.filter((game) => `${game.name} ${game.publisher || ''}`.toLowerCase().includes(query.trim().toLowerCase())),
    [games, query],
  )
  function search(event) {
    event.preventDefault()
  }
  return <CatalogPage browseLanding activeKind="GameAccount" query={query} onQueryChange={setQuery} onSubmit={search}>
    <CatalogSearch browse label={copy.searchGamesOrCategories} query={query} onQueryChange={setQuery} onSubmit={search} />
    <h2 className="browse-list-title catalog-heading">{copy.gameAccounts}</h2>
    {loading ? <LoadingRegion label={copy.loadingGames}>
      <div className="search-game-grid search-game-grid--browse-primary account-browse-grid">
        <SkeletonItems className="search-game-card" count={6}><Bone variant="thumb" className="search-game-card__thumb" /><SkeletonLines /></SkeletonItems>
      </div>
    </LoadingRegion> : error ? <StateMessage>{error}</StateMessage>
      : visibleGames.length === 0 ? <StateMessage>{copy.noGamesFound}</StateMessage>
      : <div className="search-game-grid search-game-grid--browse-primary account-browse-grid">{visibleGames.map((game) =>
        <CatalogCard key={game.id} product={{ ...game, kind: 'GameAccount', thumbnailUrl: game.imageUrl }}
          categoryLabel={copy.gameAccounts} hrefOverride={`/game-accounts/${encodeURIComponent(game.slug)}`}
          favoriteIdOverride={`catalog:GameAccountGame:${game.slug}`} />)}</div>}
  </CatalogPage>
}

export function GameAccountListingPage({ gameSlug }) {
  const copy = useStorefrontCopy()
  const [game, setGame] = useState(null)
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getCatalogGames().then((rows) => {
      if (!active) return
      setGame((rows || []).find(item => item.slug === gameSlug) || null)
    }).catch(() => {
      if (active) {
        setGame(null)
      }
    })
    return () => { active = false }
  }, [gameSlug])
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getCatalogProducts({ kind: 'GameAccount', game: gameSlug, search: submittedQuery, page, pageSize: 24 })
      .then((result) => {
        if (!active) return
        const rows = result.items || []
        setProducts(rows)
        setTotalPages(result.totalPages || 1)
        setTotalItems(result.totalItems ?? rows.length)
      }).catch(() => {
        if (active) {
          setProducts([])
          setTotalPages(1)
          setTotalItems(0)
          setError(copy.weCouldnTLoadTheCatalog)
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [gameSlug, submittedQuery, page])
  const visible = useMemo(() => {
    const filtered = products.filter((item) => tab === 'all' ||
      (tab === 'available' ? item.isAvailable : !item.isAvailable))
    if (sort === 'default') return filtered
    return [...filtered].sort((a, b) => {
      if (a.minPrice == null) return 1
      if (b.minPrice == null) return -1
      return sort === 'high' ? b.minPrice - a.minPrice : a.minPrice - b.minPrice
    })
  }, [products, tab, sort])
  function search(event) {
    event.preventDefault(); setPage(1); setSubmittedQuery(query.trim())
  }
  return <CatalogPage activeKind="GameAccount" query={query} onQueryChange={setQuery} onSubmit={search}>
    <p className="ga-breadcrumb"><a href="/">{copy.home}</a><span>/</span><a href="/game-accounts">{copy.gameAccounts}</a></p>
    <header className="catalog-header">
      <div className="catalog-game-heading">
        <GameArtwork image={game?.imageUrl} name="" />
        <h1 className="catalog-title">{copy.gameAccounts} · {game?.name || gameSlug}</h1>
      </div>
      <select className="catalog-sort" value={sort} onChange={(event) => setSort(event.target.value)} aria-label={copy.sortCurrentPage}>
        <option value="default">{copy.catalogOrder}</option>
        <option value="low">{copy.lowestPriceThisPage}</option>
        <option value="high">{copy.highestPriceThisPage}</option>
      </select>
    </header>
    <CatalogSearch label={copy.searchAccounts} query={query} onQueryChange={setQuery} onSubmit={search} />
    <div className="ga-stock-tabs">
      {[[ 'all', copy.all ], [ 'available', copy.available2 ], [ 'unavailable', copy.unavailable2 ]].map(([value, label]) =>
        <button key={value} type="button" className={tab === value ? 'active' : ''} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</button>)}
    </div>
    {loading ? <LoadingRegion label={copy.loadingListings}>
      <div className="ga-account-grid ga-live-grid">
        <SkeletonItems className="ga-account-card ga-live-card">
          <div className="ga-account-art"><Bone variant="media" /></div>
          <div className="ga-account-copy"><SkeletonLines /></div>
        </SkeletonItems>
      </div>
    </LoadingRegion> : error ? <StateMessage>{error}</StateMessage>
      : visible.length === 0 ? <StateMessage>{copy.noAccountsMatchTheseFilters}</StateMessage>
      : <div className="ga-account-grid ga-live-grid">{visible.map((item) => {
        const attributes = getAccountAttributes(item.accountDetails, { cardOnly: true, limit: 3 })
        const href = accountProductHref(item)
        const Card = href ? 'a' : 'article'
        return <Card className={`ga-account-card ga-live-card${item.isAvailable ? '' : ' sold'}`} href={href} key={item.id}>
          <div className="ga-account-art">
            <GameArtwork image={item.thumbnailUrl} name={item.name} />
            <span className={item.isAvailable ? 'available' : 'sold-out'}>{item.isAvailable ? copy.available : copy.unavailable}</span>
          </div>
          <div className="ga-account-copy">
            <h2 className="catalog-card-title">{item.name}</h2><p className="catalog-card-meta">{item.gameName || game?.name || copy.gameAccounts}</p>
            <div className="ga-tags ga-live-tags">{attributes.map((field) =>
              <span key={field.key} title={`${field.label}: ${field.value}`}>{field.label}: {field.value}</span>)}</div>
            <div className="ga-account-price-row">
              <strong>{accountPrice(item.minPrice) || copy.priceUnavailable}</strong>
              {href && <ChevronRight size={18} aria-hidden="true" />}
            </div>
          </div>
        </Card>
      })}</div>}
    <div className="ga-live-pagination">
      <span>{copy.showingPage} {page} {copy.of2} {totalPages} · {totalItems} {copy.listings}</span>
      <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{copy.previous}</button>
      <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>{copy.next}</button>
    </div>
  </CatalogPage>
}

export function GameAccountDetailPage({ gameSlug, accountSlug }) {
  const copy = useStorefrontCopy()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getCatalogProduct(accountSlug).then((data) => {
      if (!active) return
      if (data.kind !== 'GameAccount' || (data.game?.slug && gameSlug !== 'account' && data.game.slug !== gameSlug))
        throw new Error(copy.accountListingNotFound)
      setProduct(data)
    }).catch((err) => {
      if (!active) return
      setProduct(null)
      setError(copy.weCouldnTLoadTheAccountDetails)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [gameSlug, accountSlug])
  const attributes = getAccountAttributes(product?.accountDetails)
  const variant = product?.variants?.find((item) => item.isAvailable) || product?.variants?.[0]
  const price = variant?.effectivePrice ?? variant?.price
  const available = Boolean(product?.isAvailable && variant?.isAvailable)
  function addAccountToCart() {
    if (!available || !product || price == null) return
    const fields = product.accountDetails?.attributes || []
    const attribute = (name, fallback) => fields.find((item) => item.key === name)?.value ?? fallback
    saveGameAccountCart({
      slug: product.slug,
      title: product.name,
      price: Number(price),
      available: true,
      rank: String(attribute('rank', product.name)),
      heroes: Number(attribute('heroes', 0)),
      level: Number(attribute('level', 1)),
      region: String(attribute('region', 'SEA')),
      email: String(attribute('email', 'Tersedia saat penyerahan')),
      warranty: 'Sesuai ketentuan seller',
      game: {
        slug: product.game?.slug || gameSlug,
        name: product.game?.name || product.gameName || gameSlug,
        publisher: product.game?.publisher || copy.gameAccount,
      },
    })
    window.location.href = '/cart?flow=account'
  }

  return <div className="ga-shell browse-catalog-shell"><Navbar homepageMobileMenu showMobileCart />
    {loading ? <main className="ga-detail-page">
      <ProductSkeleton label={copy.loadingAccountDetails} hero="ga-detail-hero ga-live-hero"
        heroContent="ga-detail-hero-content" cover="ga-hero-thumb" heroCopy="ga-detail-hero-copy"
        layout="ga-detail-layout" panel="ga-detail-card ga-live-detail" aside="ga-purchase-card ga-live-purchase" />
    </main> : error || !product ? <main className="ga-detail-page ga-container"><StateMessage>{error || copy.listingNotFound}</StateMessage></main>
      : <main className="ga-detail-page">
        <section className="ga-detail-hero ga-live-hero">
          {product.images?.[0]?.url && <img className="ga-detail-hero-bg" src={product.images[0].url} alt="" />}
          <div className="ga-detail-scrim" />
          <div className="ga-detail-hero-content">
            <div className="ga-hero-thumb"><GameArtwork image={product.thumbnailUrl || product.game?.imageUrl} name={product.name} /></div>
            <div className="ga-detail-hero-copy"><h1>{product.name}</h1>
              <div className="ga-hero-rating"><span>{product.game?.name || copy.gameAccount}</span>
                <ProductRating product={product} />
              </div>
              <div className="ga-hero-badges"><span>{available ? copy.accountAvailable : copy.accountUnavailable}</span>
                {product.soldQuantity > 0 && <span>{product.soldQuantity} {copy.sold}</span>}</div>
            </div>
          </div>
        </section>
        <div className="ga-detail-layout">
          <section className="ga-detail-card ga-live-detail">
            <h2>{copy.accountDetails2}</h2>
            {product.description && <p className="ga-live-description">{product.description}</p>}
            {attributes.length > 0 ? <dl className="ga-detail-specs ga-live-specs">
              {attributes.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
            </dl> : <StateMessage>{copy.accountDetailsAreUnavailable2}</StateMessage>}
            {product.images?.length > 0 && <div className="ga-live-gallery" aria-label={copy.listingPhoto}>
              {product.images.map((image) => <img key={image.id} src={image.url} alt={image.altText || product.name} loading="lazy" />)}
            </div>}
            <ProductReviews product={product} />
          </section>
          <aside className="ga-purchase-card ga-live-purchase"><h2>{copy.product}</h2>
            <div className="ga-selected-account"><strong>{product.name}</strong>
              <span>{accountPrice(price) || copy.priceUnavailable}</span>
              <small>{available ? copy.available1UniqueAccount : copy.unavailable2}</small></div>
            <p className="ga-live-note">{copy.detailsAndPricingComeFromTheCatalog}</p>
            <button type="button" className="ga-primary-cta" disabled={!available} onClick={addAccountToCart}>{available ? copy.buyNow : copy.accountUnavailable}</button>
            <a className="ga-live-back" href={product.game?.slug
              ? `/game-accounts/${encodeURIComponent(product.game.slug)}` : '/game-accounts'}>{copy.backToAccountListings}</a>
          </aside>
        </div>
      </main>}
  </div>
}
