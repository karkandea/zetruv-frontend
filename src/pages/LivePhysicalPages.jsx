import { Bone, LoadingRegion, SkeletonItems, SkeletonPanel } from '../components/Skeleton'
import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import ProductReviews, { ProductRating } from '../components/ProductReviews'
import BrowseMobileControls from '../components/BrowseMobileControls'
import SupportChat from '../components/SupportChat'
import { Bookmark, ImageOff } from 'lucide-react'
import { getCatalogProduct, getCatalogProducts } from '../services/catalogService'
import { isFavorite, toggleFavorite, subscribeFavorites } from '../services/favoritesService'
import { searchAssets } from '../data/searchAssets'
import '../styles/physical-purchase.css'

const CART_KEY = 'zetruv-physical-cart-v1'
const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(Number(value))}`

function Availability({ available }) {
  const copy = useStorefrontCopy()
  return <span className={`physical-stock physical-stock--${available ? 'ok' : 'low'}`}>{available ? copy.available2 : copy.unavailable2}</span>
}

function ProductCard({ product }) {
  const copy = useStorefrontCopy()
  const favoriteId = `merchandise:${product.slug}`
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))
  useEffect(() => subscribeFavorites(() => setSaved(isFavorite(favoriteId))), [favoriteId])

  return <article className="physical-product-card">
    <a className="physical-product-card__link" href={`/merchandise/${encodeURIComponent(product.slug)}`}>
      <div className="physical-product-card__image">
        {product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="" loading="lazy" /> : <ImageOff size={20} aria-label={copy.photoUnavailable} />}
      </div>
      <div className="physical-product-card__meta"><span className="physical-badge">{copy.merchandise2}</span><Availability available={product.isAvailable} /></div>
      <strong className="physical-product-card__name">{product.name}</strong>
      <span className="physical-product-card__variant">{product.categorySlug}</span>
      <strong className="physical-product-card__price">{product.minPrice != null ? rupiah(product.minPrice) : copy.priceUnavailable}</strong>
    </a>
    <button type="button" className={`physical-product-card__favorite${saved ? ' is-saved' : ''}`}
      aria-label={saved ? formatCopy(copy.removeBookmark, { product: product.name }) : formatCopy(copy.addBookmark, { product: product.name })}
      aria-pressed={saved}
      onClick={() => setSaved(toggleFavorite({
        id: favoriteId, name: product.name, type: 'Merchandise',
        price: product.minPrice != null ? rupiah(product.minPrice) : copy.priceUnavailable,
        href: `/merchandise/${product.slug}`, image: product.thumbnailUrl,
      }))}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" /></button>
  </article>
}

export function LivePhysicalCatalogPage() {
  const copy = useStorefrontCopy()
  const [products, setProducts] = useState([])
  const [state, setState] = useState('loading')
  const [sort, setSort] = useState('newest')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getCatalogProducts({ kind: 'Merchandise', pageSize: 50, signal: controller.signal })
      .then((page) => { if (!controller.signal.aborted) { setProducts(page.items || []); setState('ready') } })
      .catch(() => { if (!controller.signal.aborted) setState('error') })
    return () => controller.abort()
  }, [])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    const items = products.filter(product => product.name.toLowerCase().includes(term))
    if (sort === 'low') return items.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity))
    if (sort === 'high') return items.sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity))
    return items
  }, [products, sort, query])

  const categories = [
    [copy.gameTopUpById, searchAssets.categoryPlayerId, '/search?kind=TopUpGame'],
    [copy.gameTopUpByLogin, searchAssets.categoryLogin, '/search?kind=TopUpLogin'],
    [copy.gameVouchers, searchAssets.categoryItems, '/search?kind=GameVoucher'],
    [copy.gameBoosting, searchAssets.categoryJoki, '/search?kind=Joki'],
    [copy.gameAccounts2, searchAssets.categoryAccounts, '/game-accounts'],
    [copy.merchandise, searchAssets.categoryMerchandise, '/merchandise'],
  ]

  return <div className="physical-shell browse-catalog-shell">
    <Navbar homepageMobileMenu />
    <main className="physical-catalog browse-catalog-page">
      <h1 className="browse-title--mobile">{copy.browse}</h1>
      <BrowseMobileControls
        activeKind="Merchandise"
        query={query}
        onQueryChange={setQuery}
        onSubmit={event => event.preventDefault()}
      />
      <div className="physical-catalog-layout">
      <aside className="physical-catalog-sidebar">
        <h2>{copy.categories2}</h2><nav>{categories.map(([label, icon, href]) => <a className={href === '/merchandise' ? 'is-active' : ''} href={href} key={label}>
          <span><img src={icon} alt="" /></span><strong>{label}</strong>{href === '/merchandise' && <i aria-hidden="true" />}
        </a>)}</nav>
      </aside>
      <section className="physical-catalog-content">
        <header className="physical-catalog__heading"><div><h1>{copy.merchandise}</h1><p>{copy.physicalProductsListedInTheZetruvCatalog}</p></div><span>{products.length} {copy.products2}</span></header>
        <div className="physical-catalog__toolbar">
          <div className="physical-filter-pills"><span>{copy.allMerchandise}</span></div>
          <h2 className="browse-list-title">{copy.merchandise}</h2>
          <label className="physical-sort"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={copy.sortMerchandise}>
            <option value="newest">{copy.catalogOrder}</option><option value="low">{copy.lowestPrice}</option><option value="high">{copy.highestPrice}</option>
          </select></label>
        </div>
        <div className="physical-catalog__context"><strong>{copy.allProducts}</strong><span>•</span><span>{copy.pricingAndStockComeFromTheCatalog}</span></div>
        {state === 'loading' && <LoadingRegion label={copy.loadingMerchandise}>
          <div className="physical-product-grid">
            <SkeletonItems className="physical-product-card" count={4}>
              <div className="physical-product-card__link">
                <div className="physical-product-card__image"><Bone variant="media" /></div>
                <div className="physical-product-card__meta"><Bone width="54%" /></div>
                <Bone className="physical-product-card__name" width="78%" />
                <Bone className="physical-product-card__price" width="64px" height="20px" />
              </div>
            </SkeletonItems>
          </div>
        </LoadingRegion>}
        {state === 'error' && <p role="alert">{copy.weCouldnTLoadTheMerchandiseCatalog}</p>}
        {state === 'ready' && visible.length === 0 && <p role="status">{query.trim()
          ? copy.noProductsMatchYourSearch
          : copy.noMerchandiseHasBeenPublishedInThe}</p>}
        {state === 'ready' && <div className="physical-product-grid">{visible.map((product) => <ProductCard product={product} key={product.id} />)}</div>}
      </section>
    </div></main>
    <SupportChat />
  </div>
}

export function LivePhysicalProductPage({ slug }) {
  const copy = useStorefrontCopy()
  const [product, setProduct] = useState(null)
  const [state, setState] = useState('loading')
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [added, setAdded] = useState(false)
  const favoriteId = `merchandise:${slug}`
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))

  useEffect(() => subscribeFavorites(() => setSaved(isFavorite(favoriteId))), [favoriteId])
  useEffect(() => {
    const controller = new AbortController()
    getCatalogProduct(slug).then((data) => {
      if (controller.signal.aborted) return
      if (data.kind !== 'Merchandise') { setState('not-found'); return }
      setProduct(data)
      const first = (data.variants || []).find((variant) => variant.isAvailable)
      setVariantId(first?.id || '')
      setState('ready')
    }).catch((error) => {
      if (!controller.signal.aborted) setState(error.status === 404 ? 'not-found' : 'error')
    })
    return () => controller.abort()
  }, [slug])

  if (state === 'loading') return <div className="physical-shell"><Navbar homepageMobileMenu /><main className="physical-pdp">
    <LoadingRegion label={copy.loadingProduct}>
      <Bone width="36%" />
      <div className="physical-pdp__main">
        <section className="physical-gallery">
          <div className="physical-gallery__thumbs"><SkeletonItems count={3}><Bone variant="thumb" /></SkeletonItems></div>
          <div className="physical-gallery__primary"><Bone variant="media" /></div>
        </section>
        <section className="physical-purchase-panel"><SkeletonPanel /></section>
      </div>
    </LoadingRegion>
  </main></div>

  if (state !== 'ready') return <div className="physical-shell"><Navbar homepageMobileMenu /><main className="physical-pdp" role="status">
    <h1>{state === 'not-found' ? copy.productNotFound : copy.productCouldnTBeLoaded3}</h1>
    <a href="/merchandise">{copy.backToMerchandise}</a>
  </main></div>

  const variants = product.variants || []
  const variant = variants.find((item) => item.id === variantId)
  const images = (product.images || []).map((item) => item.url).filter(Boolean)
  if (!images.length && product.thumbnailUrl) images.push(product.thumbnailUrl)
  const unitPrice = variant?.effectivePrice ?? variant?.price
  const canAdd = Boolean(product.isAvailable && variant?.isAvailable && unitPrice != null)
  const stockLimit = variant?.stockQuantity == null ? 9 : Math.min(9, variant.stockQuantity)

  function addToCart() {
    if (!canAdd) return
    window.sessionStorage.setItem(CART_KEY, JSON.stringify({
      slug: product.slug, variantId: variant.id, name: product.name,
      color: '', size: variant.name, qty, price: unitPrice, image: images[0] || '',
      category: copy.merchandise,
    }))
    window.dispatchEvent(new Event('zetruv:physical-cart-changed'))
    setAdded(true)
  }

  return <div className="physical-shell"><Navbar homepageMobileMenu />
    <main className="physical-pdp">
      <div className="physical-breadcrumb"><a href="/merchandise">{copy.merchandise}</a> <span>/</span> {product.name}</div>
      <div className="physical-pdp__main">
        <section className="physical-gallery">
          {images.length > 0 && <div className="physical-gallery__thumbs">{images.map((src, index) => <button type="button" className={index === selectedImage ? 'is-active' : ''} key={`${src}-${index}`} onClick={() => setSelectedImage(index)} aria-label={formatCopy(copy.viewImage, { number: index + 1 })}><img src={src} alt="" /></button>)}</div>}
          <div className="physical-gallery__primary">{images.length ? <img src={images[Math.min(selectedImage, images.length - 1)]} alt={product.name} /> : <span>{copy.productPhotoUnavailable}</span>}</div>
        </section>
        <section className="physical-purchase-panel">
          <div className="physical-purchase-panel__top"><span className="physical-badge">{copy.merchandise2}</span><Availability available={product.isAvailable} /></div>
          <h1>{product.name}</h1>
          <div className="physical-rating-line">
            <ProductRating product={product} />
            <span>{product.soldQuantity ?? 0} {copy.sold}</span>
          </div>
          <strong className="physical-pdp__price">{unitPrice != null ? rupiah(unitPrice) : copy.priceUnavailable}</strong>
          <hr />
          <div className="physical-option-heading"><strong>{copy.chooseAnOption}</strong><span>{copy.stockFromTheCatalog}</span></div>
          <div className="physical-size-options">{variants.map((item) => <button key={item.id} type="button" disabled={!item.isAvailable} aria-pressed={variantId === item.id} className={variantId === item.id ? 'is-active' : ''} onClick={() => { setVariantId(item.id); setQty(1); setAdded(false) }}>
            {item.name} · {rupiah(item.effectivePrice ?? item.price)}
          </button>)}</div>
          {variants.length === 0 && <p>{copy.thereAreNoActiveOptions}</p>}
          <div className="physical-qty-save">
            <div className="physical-qty"><button type="button" onClick={() => { setQty((v) => Math.max(1, v - 1)); setAdded(false) }}>−</button><span>{qty}</span><button type="button" onClick={() => { setQty((v) => Math.min(stockLimit, v + 1)); setAdded(false) }}>+</button></div>
            <button className={saved ? 'physical-save is-saved' : 'physical-save'} type="button" aria-pressed={saved} onClick={() => setSaved(toggleFavorite({
              id: favoriteId, name: product.name, type: 'Merchandise',
              price: unitPrice != null ? rupiah(unitPrice) : copy.priceUnavailable,
              href: `/merchandise/${product.slug}`, image: images[0],
            }))}>{saved ? '♥ Tersimpan' : '♡ Favorit'}</button>
          </div>
          <div className="physical-shipping-estimate" role="note"><strong>{copy.merchandiseCartIsADraft}</strong><span>{copy.checkoutShippingAndPaymentForMerchandiseAre}</span></div>
          {added && <p role="status" className="physical-add-confirmation">{copy.draft} {product.name} · {variant.name} · {qty} {copy.itemsSavedToYourCart}</p>}
          <button className="physical-btn physical-btn--primary physical-add-cart" type="button" disabled={!canAdd} onClick={added ? () => { window.location.href = '/cart?flow=physical' } : addToCart}>{added ? copy.viewCart : canAdd ? copy.saveCartDraft : copy.notAvailableYet}</button>
        </section>
      </div>
      <div className="physical-product-info"><section><strong>{copy.description}</strong><p>{product.description || product.shortDescription || copy.descriptionIsUnavailable}</p></section></div>
      <ProductReviews product={product} />
    </main>
  </div>
}
