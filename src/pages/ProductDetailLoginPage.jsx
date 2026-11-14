import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleAlert, Info, LoaderCircle, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductBenefits from '../components/ProductBenefits'
import genshinHero from '../assets/game-account-flow/genshin-impact.png'
import { getTopUpCurrencyArt } from '../data/topUpCurrencyAssets'
import { getCatalogProduct } from '../services/catalogService'
import { selectLinkedVariant } from '../services/flashSaleFlow'
import { addCartItem, awaitCartPersistence, supportsCartQuantity, cartItemLimit } from '../services/cartService' 
import { getCartSyncStatus } from '../services/customerCartSync'
import { getDigitalPricing } from '../services/digitalCartPricing'
import { viaLoginServiceStatus } from '../services/digitalServiceAvailability'
import { getManualLoginReadiness } from '../services/digitalPurchaseCapabilities'
import '../styles/product-detail-login.css'
import '../styles/product-detail-login-improvements.css'
import '../styles/service-unavailable-polish.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const genericGameImage = '/assets/search/category-topup.webp'

// Matched to the actual top-up items on the official HoYoverse shop.
// These are presentation assets only; names, SKU IDs, prices and stock
// always come from the Zetruv catalog API.
const genshinOfficialArt = Object.freeze({
  60: 'https://fastcdn.hoyoverse.com/static-resource-v2/2026/07/06/d7c6eac266c930b0278f57064f390f0d_567527774238570827.png',
  300: 'https://fastcdn.hoyoverse.com/static-resource-v2/2026/07/06/d758d2dbd743ffe863fc66077b989875_940758918252298425.png',
  980: 'https://fastcdn.hoyoverse.com/static-resource-v2/2026/07/06/7d07a18c6ad66fe1f62beb95392cc681_8210466223401422245.png',
  1980: 'https://fastcdn.hoyoverse.com/static-resource-v2/2026/07/06/aa76b07c34f1bd2768986ba5d112f2a0_3459666159508940942.png',
  3280: 'https://fastcdn.hoyoverse.com/static-resource-v2/2026/07/06/af58a8ddf0f520563ed5a76f058f9019_1243809032247765010.png',
  welkin: 'https://fastcdn.hoyoverse.com/static-resource-v2/2026/07/06/9823974586364a73552f1830a9977359_2540283372940691621.png',
})

function firstAvailableVariant(product) {
  return product?.variants?.find((variant) => variant.isAvailable && (variant.stockQuantity == null || Number(variant.stockQuantity) > 0)) || null
}

function productMedia(product) {
  const slug = product?.game?.slug || product?.slug
  const hero = slug === 'genshin-impact'
    ? genshinHero
    : product?.images?.[0]?.url || product?.game?.imageUrl || product?.thumbnailUrl || genericGameImage
  return {
    hero,
    cover: product?.game?.imageUrl || product?.thumbnailUrl ||
      (slug === 'genshin-impact' ? '/assets/search/genshin-impact.webp' : genericGameImage),
  }
}

function variantMedia(product, variant, index, ignoreUploadedIcon = false) {
  const gameSlug = product?.game?.slug || product?.slug
  const gameArt = productMedia(product)
  const art = getTopUpCurrencyArt(gameSlug, variant, index)
  const isGenshin = gameSlug === 'genshin-impact'
  const name = String(variant?.name || '')
  const amount = Number(name.match(/^\s*(\d+)/)?.[1] || 0)
  const official = isGenshin
    ? /welkin|moon/i.test(name) ? genshinOfficialArt.welkin : genshinOfficialArt[amount]
    : null
  return (!ignoreUploadedIcon && variant?.iconUrl) || variant?.imageUrl || variant?.thumbnailUrl || official || art?.image || gameArt.cover
}

function VariantImage({ src, fallback, alt = '' }) {
  return <img src={src || fallback} alt={alt} loading="lazy" decoding="async"
    onError={(event) => {
      if (event.currentTarget.dataset.fallback !== '1') {
        event.currentTarget.dataset.fallback = '1'
        event.currentTarget.src = fallback
      }
    }}
  />
}

export default function ProductDetailLoginPage({ slug = 'genshin-impact', initialVariantId = '' }) {
  const copy = useStorefrontCopy()
  const [product, setProduct] = useState(null)
  const [serviceReadiness, setServiceReadiness] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(false)
  const [selectionWarning, setSelectionWarning] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)
  const addGuard = useRef(false)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError('')
    setProduct(null)
    setServiceReadiness(null)
    setSelectedId('')
    setNotice(false)
    setSelectionWarning('')
    setQuantity(1)
    getCatalogProduct(slug)
      .then(async (data) => {
        if (!active) return
        if (data.kind !== 'TopUpLogin' || data.fulfillmentMethod !== 'MANUAL_LOGIN') {
          throw new Error(copy.thisProductDoesNotSupportTopUp)
        }
        if (!Array.isArray(data.variants) || data.variants.length === 0) {
          throw new Error(copy.noPackagesAreAvailableInTheCatalog)
        }
        setProduct(data)
        const selection = selectLinkedVariant(data.variants, initialVariantId)
        setSelectedId((selection.variant && selection.variant.isAvailable ? selection.variant : firstAvailableVariant(data))?.id || '')
        if (selection.invalidSelection) setSelectionWarning(copy.thisFlashSaleOptionIsNoLonger2)
        else if (initialVariantId && !selection.variant?.isOnSale) setSelectionWarning(copy.theFlashSaleForThisPackageHas)
        try {
          const readiness = await getManualLoginReadiness(data.id)
          if (!active) return
          setServiceReadiness(readiness)
        } catch {
          if (!active) return
          setServiceReadiness(null)
        }
        setStatus('ready')
      })
      .catch((reason) => {
        if (!active) return
        setError(copy.weCouldnTLoadTheCatalog)
        setStatus('error')
      })
    return () => { active = false }
  }, [slug, initialVariantId, reloadCount])

  const selected = useMemo(
    () => product?.variants?.find((variant) => variant.id === selectedId) || null,
    [product, selectedId],
  )
  const available = Boolean(selected && selected.isAvailable &&
    (selected.stockQuantity == null || Number(selected.stockQuantity) > 0))
  const limit = selected ? cartItemLimit({ maxQuantity: selected.stockQuantity ?? 99 }) : 1
  const quantityCapable = selected ? supportsCartQuantity({
    productKind: product.kind, fulfillmentMethod: product.fulfillmentMethod, maxQuantity: limit,
  }) : false
  const unitPrice = Number(selected?.effectivePrice ?? selected?.price ?? 0)
  const regularPrice = Number(selected?.price ?? selected?.effectivePrice ?? 0)
  const previewItem = useMemo(
    () => selected ? [{ regularPrice, unitPrice, quantity }] : [],
    [selected, regularPrice, unitPrice, quantity],
  )
  const pricing = useMemo(() => getDigitalPricing(previewItem), [previewItem])
  const serviceStatus = viaLoginServiceStatus(product, {}, serviceReadiness)
  const canAdd = status === 'ready' && serviceStatus.available && available && Number.isFinite(unitPrice) && unitPrice > 0 && !isAdding
  const cover = product ? productMedia(product) : { hero: genericGameImage, cover: genericGameImage }
  const selectedIndex = product?.variants?.findIndex((variant) => variant.id === selectedId) ?? -1
  const thumbnail = product && selected
    ? variantMedia(product, selected, Math.max(0, selectedIndex)) : genericGameImage
  const reviewCount = Number(product?.reviewCount || 0)
  const rating = Number(product?.rating || 0)

  function selectVariant(variant) {
    setSelectedId(variant.id)
    setSelectionWarning('')
    setQuantity(1)
    setNotice(false)
  }

  async function addToCart() {
    if (!canAdd || addGuard.current) return
    addGuard.current = true
    setIsAdding(true)
    setNotice(false)
    setError('')
    try {
      // Guest cart is local; authenticated cart is persisted to server before success.
      await new Promise((resolve) => window.requestAnimationFrame(resolve))
      addCartItem({
        accountKey: 'checkout-required',
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productKind: product.kind,
        fulfillmentMethod: product.fulfillmentMethod,
        requiresGameAccountValidation: Boolean(product.requiresGameAccountValidation),
        thumbnailUrl: product.thumbnailUrl || product.game?.imageUrl || cover.cover,
        gameName: product.game?.name || product.name,
        variantId: selected.id,
        variantSku: selected.sku,
        variantName: selected.name,
        unitPrice,
        regularPrice,
        quantity: quantityCapable ? quantity : 1,
        maxQuantity: limit,
      })
      await awaitCartPersistence()
      if(getCartSyncStatus().state==='error')throw Error(copy.yourCartCouldnTBeSaved)
      setNotice(true)
    } catch {
      setError(copy.weCouldnTAddThisPackagePlease)
    } finally {
      addGuard.current = false
      setIsAdding(false)
    }
  }

  return (
    <div className="login-product-shell">
      <Navbar variant="loginCatalog" />
      <main className="login-product-page">
        {status === 'loading' && (
          <section className="login-product-loading" role="status">
            <LoaderCircle size={22} className="login-product-spin" aria-hidden="true" />
            {copy.loadingPackagesFromTheCatalog}
          </section>
        )}
        {status === 'error' && (
          <section className="login-product-loading" role="alert">
            <CircleAlert size={23} aria-hidden="true" />
            <strong>{copy.productCouldnTBeLoaded2}</strong>
            <p>{error}</p>
            <button type="button" onClick={() => setReloadCount((n) => n + 1)}>{copy.tryAgain2}</button>
          </section>
        )}
        {status === 'ready' && product && (
          <>
            <section className="login-product-hero">
              <img className="login-product-hero__background" src={cover.hero} alt="" decoding="async"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallback !== '1') {
                    event.currentTarget.dataset.fallback = '1'
                    event.currentTarget.src = cover.cover
                  }
                }} />
              <div className="login-product-hero__shade" />
              <div className="login-product-container login-product-hero__content">
                <div className="login-product-cover">
                  <VariantImage src={cover.cover} fallback={genericGameImage} alt={product.game?.name || product.name} />
                </div>
                <div className="login-product-hero__copy">
                  <span className="login-product-service-badge">{copy.topUpByLogin2}</span>
                  <div className="login-product-title-block">
                    <h1>{product.game?.name || product.name}</h1>
                    <div className="login-product-rating-line">
                      <strong>{product.game?.publisher || copy.gameTopUp}</strong>
                      {rating > 0 && reviewCount > 0
                        ? <span className="login-product-rating-group">
                            <Star size={15} fill="#fed218" color="#fed218" aria-hidden="true" />
                            <b>{rating.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</b>
                            <em>({reviewCount.toLocaleString('id-ID')} {copy.reviews2}</em>
                          </span>
                        : <span className="login-product-unrated">{copy.noReviewsYet}</span>}
                    </div>
                  </div>
                  <ProductBenefits className="login-product-benefits" />
                </div>
              </div>
            </section>

            <div className="login-product-body">
              <div className="login-product-container login-product-layout">
                <section className="login-package-panel" aria-labelledby="login-packages-heading">
                  <h2 id="login-packages-heading">{copy.chooseAPackage}</h2>
                  <p className="login-package-description">{copy.chooseAPackageForYourGameAccount}</p>
                  {selectionWarning && <p className="login-variant-warning" role="status"><CircleAlert size={16} aria-hidden="true" />{selectionWarning}</p>}
                  <div className="login-package-grid">
                    {product.variants.map((variant, index) => {
                      const active = selectedId === variant.id
                      const purchasable = variant.isAvailable &&
                        (variant.stockQuantity == null || Number(variant.stockQuantity) > 0)
                      return (
                        <button type="button" key={variant.id}
                          className={`login-package-card${active ? ' active' : ''}`}
                          aria-pressed={active} disabled={!purchasable}
                          onClick={() => selectVariant(variant)}>
                          <span className="login-package-card__icon">
                            <VariantImage
                              src={variantMedia(product, variant, index)} fallback={variantMedia(product, variant, index, true)} />
                          </span>
                          <span className="login-package-card__copy">
                            <strong>{variant.name}</strong>
                            <small>{rupiah(variant.effectivePrice ?? variant.price)}{variant.isOnSale && Number(variant.price) > Number(variant.effectivePrice) && <del className="login-variant-old-price">{rupiah(variant.price)}</del>}</small>
                            {!purchasable && <em>{copy.unavailable2}</em>}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <div className={`login-product-info-banner${!serviceStatus.available ? ' login-product-info-banner--unavailable' : ''}`} role={!serviceStatus.available ? 'status' : undefined}>
                    {!serviceStatus.available ? <CircleAlert size={17} aria-hidden="true" /> : <Info size={17} aria-hidden="true" />}
                    <div>
                      {!serviceStatus.available && <strong>{copy.serviceTemporarilyUnavailable}</strong>}
                      <p>{serviceStatus.available
                        ? copy.weLlAskForYourGameAccount
                        : copy.topUpByLoginIsUnavailableFor2}</p>
                      {!serviceStatus.available && <a href="/search">{copy.browseOtherServices} <ArrowRight size={13} aria-hidden="true" /></a>}
                    </div>
                  </div>
                </section>

                <aside className="login-product-summary" aria-label={copy.packageSummary}>
                  <h2>{copy.summary}</h2>
                  {selected ? (
                    <>
                      <div className="login-selected-package">
                        <div className="login-selected-package__info">
                          <strong>{selected.name}</strong>
                          <span>{rupiah(unitPrice)} / item</span>
                        </div>
                      </div>
                      {quantityCapable && (
                        <div className="login-quantity-row">
                          <span>{copy.quantity}</span>
                          <div className="login-quantity-stepper" role="group" aria-label={copy.packageQuantity}>
                            <button type="button" aria-label={copy.decreaseQuantity} disabled={quantity <= 1}
                              onClick={() => { setQuantity((n) => Math.max(1, n - 1)); setNotice(false) }}>
                              <Minus size={16} aria-hidden="true" />
                            </button>
                            <output aria-label={copy.quantity}>{quantity}</output>
                            <button type="button" aria-label={copy.increaseQuantity} disabled={quantity >= limit}
                              onClick={() => { setQuantity((n) => Math.min(limit, n + 1)); setNotice(false) }}>
                              <Plus size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="login-summary-row"><span>{copy.subtotal}</span><strong>{rupiah(pricing.subtotal)}</strong></div>
                      <div className="login-summary-row"><span>{copy.serviceFee}</span><strong>{rupiah(pricing.serviceFee)}</strong></div>
                      {pricing.discount > 0 && (
                        <div className="login-summary-row login-summary-row--discount"><span>{copy.productDiscount}</span><strong>−{rupiah(pricing.discount)}</strong></div>
                      )}
                      <div className="login-summary-divider" />
                      <div className="login-summary-total"><span>{copy.paymentTotal}</span><strong>{rupiah(pricing.total)}</strong></div>
                    </>
                  ) : <p className="login-product-summary__hint">{copy.thereAreNoPackagesToChooseFrom}</p>}
                  <div className="login-product-actions">
                    <button type="button" className="login-product-add" disabled={!canAdd}
                      onClick={addToCart}>
                      {isAdding ? <LoaderCircle className="login-product-spin" size={18} aria-hidden="true" />
                        : <ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />}
                      <span>{isAdding ? 'Menambahkan...' : copy.addToCart}</span>
                    </button>
                    {!serviceStatus.available && <p className="login-product-summary__unavailable" role="status">
                      <CircleAlert size={17} aria-hidden="true" />
                      <span><strong>{copy.serviceTemporarilyUnavailable}</strong>
                        {copy.thisPackageIsnTAvailableForPurchase} <a href="/search">{copy.browseOtherProducts}</a>.</span>
                    </p>}
                    {!selected && serviceStatus.available && <p className="login-product-summary__hint">{copy.chooseAnAvailablePackageFirst}</p>}
                    {selected && !available && <p className="login-product-summary__hint">{copy.thisPackageIsCurrentlyUnavailable}</p>}
                  </div>

                  {notice && (
                    <div className="login-product-feedback" role="status" aria-live="polite">
                      <div><CheckCircle2 size={19} aria-hidden="true" /><strong>{copy.addedToCart}</strong></div>
                      <p>{selected?.name} {copy.wasAddedToYourCart}</p>
                      <nav aria-label={copy.nextSteps}>
                        <a href="/search">{copy.continueShopping}</a>
                        <a href="/cart">{copy.viewCart} <ArrowRight size={15} aria-hidden="true" /></a>
                      </nav>
                    </div>
                  )}
                  {error && <p className="login-product-summary__error" role="alert">{error}</p>}
                </aside>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
