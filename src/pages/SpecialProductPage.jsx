import { ProductSkeleton } from '../components/Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import ProductReviews, { ProductRating } from '../components/ProductReviews'
import { searchAssets } from '../data/searchAssets'
import { getCatalogProduct } from '../services/catalogService'
import { addCartItem, awaitCartPersistence, readCart } from '../services/cartService'
import { getCartSyncStatus, readCustomerSession } from '../services/customerCartSync'
import { getDigitalPricing } from '../services/digitalCartPricing'
import '../styles/special-product.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function ProductState({ state, retry, joki = false, gameItem = false }) {
  const copy = useStorefrontCopy()
  const loading = state === 'loading'
  const failed = state === 'error'
  return <div className="special-product-shell"><Navbar homepageMobileMenu />
    {loading ? <main className="special-product-page">
      <ProductSkeleton label={copy.loadingProduct} hero={`special-product-hero special-product-hero--${joki ? 'joki' : 'voucher'}`}
        heroContent="special-product-hero__content" cover="special-product-hero__visual" heroCopy="special-product-hero__copy"
        layout="special-product-layout" panel="special-product-packages"
        grid="special-product-grid" card="skeleton-row" aside="special-product-summary" />
    </main> : <main className="special-product-page special-product-state">
      <div role={failed ? 'alert' : 'status'}>
        <h1>{failed ? copy.productCouldnTBeLoaded : copy.productNotFound}</h1>
        {state === 'not-found' && <p>{copy.thisProductIsUnavailableInTheCatalog}</p>}
      </div>
      {failed && <button type="button" className="special-secondary" onClick={retry}>{copy.tryAgain}</button>}
      <a href={gameItem ? '/search?kind=GameItem' : joki ? '/search?kind=Joki' : '/search?kind=GameVoucher'}>{joki ? copy.backToBoosting : copy.backToCatalog}</a>
    </main>}
  </div>
}

function LiveManualProduct({ slug, kind }) {
  const gameItem = kind === 'GameItem'
  const isVoucher = kind === 'GameVoucher'
  const [result, setResult] = useState({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getCatalogProduct(slug, { signal: controller.signal }).then((product) => {
      if (controller.signal.aborted) return
      setResult(product?.kind === kind ? { state: 'ready', product } : { state: 'not-found' })
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ state: error.status === 404 ? 'not-found' : 'error' })
    })
    return () => controller.abort()
  }, [slug, kind, attempt])

  if (result.state !== 'ready') return <ProductState joki={!gameItem} gameItem={gameItem} state={result.state} retry={() => {
    setResult({ state: 'loading' })
    setAttempt((value) => value + 1)
  }} />

  return <SpecialProduct product={result.product} slug={slug} joki={!gameItem && !isVoucher} gameItem={gameItem} voucher={isVoucher} />
}

function packagePrice(variant) {
  return Number(variant.effectivePrice ?? variant.price)
}

function isPurchasable(variant) {
  return variant.isAvailable && (variant.stockQuantity == null || variant.stockQuantity > 0) &&
    Number.isFinite(packagePrice(variant)) && packagePrice(variant) > 0
}

function SpecialProduct({ product, slug, joki = false, gameItem = false, voucher = false }) {
  const manual = joki || gameItem || voucher
  const copy = useStorefrontCopy()
  const variants = product.variants || []
  const available = variants.filter((variant) => product.isAvailable && isPurchasable(variant))
  const [selectedId, setSelectedId] = useState(available[0]?.id || variants[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const addGuard = useRef(false)
  // An out-of-stock voucher can be selected for viewing, never for purchase.
  const selected = variants.find((item) => item.id === selectedId) || available[0] || variants[0]
  const selectedPurchasable = Boolean(selected && available.includes(selected))
  const image = product.thumbnailUrl || product.image || product.game?.imageUrl || (voucher ? searchAssets.categoryItems : gameItem ? searchAssets.categoryItems : searchAssets.categoryJoki)
  const hero = product.images?.[0]?.url || product.hero || image
  const publisher = manual ? product.game?.publisher : product.publisher
  const description = product.shortDescription || product.description
  const entry = selectedPurchasable ? {
    accountKey: 'checkout-required',
    productId: product.id,
    productSlug: product.slug || slug,
    productName: product.name,
    productKind: product.kind,
    fulfillmentMethod: product.fulfillmentMethod,
    thumbnailUrl: image,
    gameName: manual ? product.game?.name || product.name : product.name,
    variantId: selected.id,
    variantName: selected.name,
    unitPrice: packagePrice(selected),
    regularPrice: selected.price,
    quantity,
    maxQuantity: manual ? 1 : 9,
    requiresGameAccountValidation: Boolean(product.requiresGameAccountValidation),
  } : null
  const pricing = entry ? getDigitalPricing([entry]) : null
  const voucherServiceFee = voucher ? 2000 : 0

  async function add(goToCart) {
    if (!entry || !selectedPurchasable || addGuard.current) return
    addGuard.current = true
    setSaving(true)
    setNotice('')
    setError('')
    try {
      if (readCustomerSession() && getCartSyncStatus().state !== 'synced') {
        throw Error('cartNotSynced')
      }
      const alreadyAdded = readCart().some((item) => item.variantId === entry.variantId)
      if (!alreadyAdded) addCartItem(entry)
      await awaitCartPersistence()
      const sync = getCartSyncStatus()
      if (sync.state === 'error' || sync.state === 'conflict') throw Error(sync.message)
      if (goToCart) window.location.href = '/cart'
      else setNotice(alreadyAdded ? 'packageAlreadyInCart' : 'theProductWasAddedToYourCart')
    } catch (failure) {
      setError(failure.message === 'cartNotSynced' ? 'cartNotSynced' : 'weCouldnTAddThisPackagePlease')
    } finally {
      addGuard.current = false
      setSaving(false)
    }
  }

  return (
    <div className="special-product-shell">
      <Navbar variant="catalog" homepageMobileMenu />
      <main className="special-product-page">
        <section className={`special-product-hero special-product-hero--${joki ? 'joki' : 'voucher'}`}>
          <img className="special-product-hero__background" src={hero} alt="" />
          <div className="special-product-hero__scrim" />
          <div className="special-product-hero__content">
            <div className="special-product-hero__visual"><img src={image} alt="" /></div>
            <div className="special-product-hero__copy">
              <span>{gameItem ? copy.gameItems : joki ? copy.gameBoosting : copy.gameVouchers}</span>
              <h1>{product.name}</h1>
              {publisher && <p>{publisher}</p>}
              <ProductRating product={product} />
              {description && <small>{description}</small>}
            </div>
          </div>
        </section>

        <div className="special-product-layout">
          <section className="special-product-packages">
            <h2>{gameItem ? copy.chooseGameItem : joki ? copy.chooseABoostingPackage : copy.chooseAVoucherValue}</h2>
            {(!gameItem || selected) && <p>{gameItem ? copy.gameItemDeliveryAfterPayment : joki ? copy.manualServiceAfterPayment : copy.theDigitalCodeWillBeSentAfter}</p>}
            {!selected && <p role="status">{gameItem ? copy.gameItemUnavailable : copy.thereAreNoPackagesToChooseFrom}</p>}
            {voucher && available.length === 0 && (
              <p role="status" className="special-product-stock-note">{copy.voucherStockUnavailable}</p>
            )}
            <div className="special-product-grid">
              {variants.map((item) => (
                <button className={selected?.id === item.id ? 'is-active' : ''} type="button"
                  disabled={!voucher && !available.includes(item)} aria-pressed={selected?.id === item.id}
                  onClick={() => { setSelectedId(item.id); setQuantity(1); setNotice(''); setError('') }} key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{voucher ? `${rupiah(packagePrice(item))}${available.includes(item) ? '' : ` · ${copy.unavailable2}`}` : gameItem || available.includes(item) ? rupiah(packagePrice(item)) : copy.unavailable2}</span>
                </button>
              ))}
            </div>
            {voucher && <div className="special-product-note"><b>i</b><span>{copy.checkThatTheVoucherRegionMatchesYour}</span></div>}
            <ProductReviews product={manual ? product : { slug }} />
          </section>

          {entry && <aside className="special-product-summary">
            <h2>{copy.summary}</h2>
            <div className="special-product-selected">
              <div><strong>{selected.name}</strong><span>{rupiah(entry.unitPrice)} / item</span></div>
              {voucher && <div className="special-product-qty"><button onClick={() => setQuantity((v) => Math.max(1, v - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity((v) => Math.min(9, v + 1))}>+</button></div>}
            </div>
            <div className="special-summary-row"><span>{copy.subtotal}</span><strong>{rupiah(pricing.subtotal)}</strong></div>
            {pricing.discount > 0 && <div className="special-summary-row"><span>{copy.discount}</span><strong>−{rupiah(pricing.discount)}</strong></div>}
            {voucher && <div className="special-summary-row"><span>{copy.serviceFee}</span><strong>{rupiah(voucherServiceFee)}</strong></div>
            <hr />
            <div className="special-summary-total"><span>{copy.total}</span><strong>{rupiah(pricing.total + voucherServiceFee)}</strong></div>
            {notice && <p role="status" className="special-product-success">{copy[notice]}</p>}
            {error && <p role="alert">{copy[error]}</p>}
            <button className="special-secondary" type="button" disabled={saving} onClick={() => add(false)}>{copy.addToCart}</button>
            <button className="special-primary" type="button" disabled={saving} onClick={() => add(true)}>{copy.addAndViewCart}</button>
          </aside>}
        </div>
      </main>
    </div>
  )
}

export default function SpecialProductPage({ type = 'voucher', slug }) {
  return <LiveManualProduct key={slug} slug={slug}
    kind={type === 'item' ? 'GameItem' : type === 'joki' ? 'Joki' : 'GameVoucher'} />
}
