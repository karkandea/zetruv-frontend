import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, Minus, Pencil, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import { getCatalogProduct } from '../services/catalogService'
import { activateCustomerCart, refreshCustomerCart, readCustomerSession, setCustomerSession, getCartSyncStatus, resolveCartConflict, CART_SYNC_EVENT } from '../services/customerCartSync'
import {
  cartCount, cartItemLimit, onCartChange, readCart, removeCartItem,
  restoreCartItem, supportsCartQuantity, updateCartAccount, updateCartQuantity,
} from '../services/cartService'
import { getDigitalPricing } from '../services/digitalCartPricing'
import { viaLoginServiceStatus } from '../services/digitalServiceAvailability'
import { getManualLoginReadiness } from '../services/digitalPurchaseCapabilities'
import { accountRequirements, checkCartDestination, getCartItemProblem, isCartCatalogPending } from '../services/digitalCartValidation'
import '../styles/digital-commerce.css'
import '../styles/digital-cart-improvements.css'
import '../styles/service-unavailable-polish.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const methodLabel = {
  AUTO_ID: 'topUpById',
  MANUAL_LOGIN: 'topUpByLogin',
  VOUCHER_CODE: 'gameVouchers',
  JOKI_MANUAL: 'gameBoosting',
}
const fallbackImages = {
  TopUpGame: '/assets/home/category-topup.png',
  TopUpLogin: '/assets/home/category-topup.png',
  GameVoucher: '/assets/home/category-voucher.png',
  Joki: '/assets/search/category-joki.webp',
  GameAccount: '/assets/home/category-account.png',
}
const clean = (value) => String(value ?? '').trim()

function itemContext(item, copy) {
  if (item.fulfillmentMethod === 'MANUAL_LOGIN') return copy.enterGameAccountInformationAtCheckoutIf
  if (item.fulfillmentMethod === 'VOUCHER_CODE') return copy.theVoucherCodeWillBeSentAfter
  if (item.productKind === 'Joki') return copy.manualServiceAfterPayment
  if (item.productKind === 'GameAccount') return copy.weLlVerifyYourGameAccountBefore
  return copy.digitalProduct
}

function CartThumbnail({ item }) {
  const fallback = fallbackImages[item.productKind] || '/assets/home/category-topup.png'
  return <img className="digital-cart-product-image" src={item.thumbnailUrl || fallback} alt="" loading="lazy"
    onError={(event) => {
      if (event.currentTarget.dataset.fallback !== '1') {
        event.currentTarget.dataset.fallback = '1'
        event.currentTarget.src = fallback
      }
    }}
  />
}

function AccountEditModal({ item, requirements, onClose, onSave }) {
  const copy = useStorefrontCopy()
  const [value, setValue] = useState({
    userId: item.accountFields?.userId || '',
    zone: item.accountFields?.zone || '',
  })
  const fields = requirements || []
  const invalid = checkCartDestination({ ...item, accountFields: value }, fields, copy)
  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', escape)
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = before
      document.removeEventListener('keydown', escape)
    }
  }, [onClose])

  return (
    <div className="digital-cart-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="digital-cart-modal" role="dialog" aria-modal="true" aria-labelledby="cart-edit-title">
        <header className="digital-cart-modal__header">
          <div><h2 id="cart-edit-title">{copy.editDestinationAccount}</h2><p>{item.productName} · {item.variantName}</p></div>
          <button type="button" aria-label={copy.closeDialog} onClick={onClose}><X size={19} aria-hidden="true" /></button>
        </header>
        {fields.length ? (
          <form onSubmit={(event) => { event.preventDefault(); if (invalid.valid) onSave(value, fields) }}>
            {fields.map((field) => (
              <label key={field.key}>
                {field.label}{!field.required && <span> {copy.optional}</span>}
                <input type="text" required={field.required} maxLength={field.maxLength}
                  inputMode={field.type === 'Number' ? 'numeric' : 'text'}
                  autoComplete="off" autoFocus={field.slot === 'userId'}
                  placeholder={field.placeholder || field.label}
                  value={value[field.slot] || ''}
                  onChange={(event) => setValue((current) => ({ ...current, [field.slot]: event.target.value }))}
                />
                {field.helpText && <small>{field.helpText}</small>}
              </label>
            ))}
            {!invalid.valid && <p className="digital-cart-modal__error" role="status">{invalid.message}</p>}
            <footer>
              <button className="digital-cart-modal__cancel" type="button" onClick={onClose}>{copy.cancel}</button>
              <button className="digital-cart-modal__save" type="submit" disabled={!invalid.valid}>{copy.saveChanges}</button>
            </footer>
          </form>
        ) : (
          <p className="digital-cart-modal__error" role="alert">
            {copy.accountFieldsAreUnavailableCheckYourConnection}
          </p>
        )}
      </section>
    </div>
  )
}

export default function CartPage() {
  const copy = useStorefrontCopy()
  const [items, setItems] = useState(readCart)
  const [requirements, setRequirements] = useState({})
  const [catalogErrors, setCatalogErrors] = useState({})
  const [catalogProducts, setCatalogProducts] = useState({})
  const [serviceReadiness, setServiceReadiness] = useState({})
  const [editingKey, setEditingKey] = useState(null)
  const [removed, setRemoved] = useState(null)
  const [status, setStatus] = useState('')
  const [authMode, setAuthMode] = useState(null)
  const [cartSync,setCartSync] = useState(getCartSyncStatus)
  const undoTimer = useRef(null)
  const accountSlugs = useMemo(() => [...new Set(items
    .filter((item) => ['AUTO_ID','MANUAL_LOGIN'].includes(item.fulfillmentMethod))
    .map((item) => item.productSlug).filter(Boolean))].sort().join('|'), [items])

  useEffect(() => onCartChange(setItems), [])
  useEffect(()=>{
    const handler=event=>setCartSync(event.detail||getCartSyncStatus())
    window.addEventListener(CART_SYNC_EVENT,handler)
    return ()=>window.removeEventListener(CART_SYNC_EVENT,handler)
  },[])
  useEffect(() => () => { if (undoTimer.current) window.clearTimeout(undoTimer.current) }, [])

  useEffect(() => {
    if (!accountSlugs) return undefined
    let active = true
    const slugs = accountSlugs.split('|')
    Promise.all(slugs.map(async (slug) => {
      try {
        const product = await getCatalogProduct(slug)
        if (product.slug !== slug) throw new Error(copy.thisProductDoesnTMatchTheCatalog)
        if (product.fulfillmentMethod === 'MANUAL_LOGIN') {
          const readiness = await getManualLoginReadiness(product.id).catch(() => null)
          if (active) setServiceReadiness(prev => ({...prev,[slug]:readiness}))
        }
        if (active) {
          setCatalogProducts((prev) => ({...prev,[slug]:product}))
          setRequirements((prev) => ({ ...prev, [slug]: accountRequirements(product) }))
          setCatalogErrors((prev) => ({ ...prev, [slug]: '' }))
        }
      } catch {
        if (active) {
          setCatalogProducts((prev) => ({...prev,[slug]:null}))
          setRequirements((prev) => ({ ...prev, [slug]: [] }))
          setCatalogErrors((prev) => ({ ...prev, [slug]: true }))
        }
      }
    }))
    return () => { active = false }
  }, [accountSlugs])

  const pricing = useMemo(() => getDigitalPricing(items), [items])
  const itemCount = cartCount(items)
  const isChecking = (item) => isCartCatalogPending(item, catalogProducts, catalogErrors)
  const checkingCatalog = items.some(isChecking)
  const problems = items.map(item => ({
    key: item.cartKey,
    message: item.serverLineId && item.isAvailable===false
      ? copy.productStockOrAccountVerificationHasExpired
      : isChecking(item) ? ''
      : item.fulfillmentMethod === 'MANUAL_LOGIN' &&
      !viaLoginServiceStatus(catalogProducts[item.productSlug],item,serviceReadiness[item.productSlug]).available
        ? `${copy.serviceTemporarilyUnavailable}. ${copy.removeThisPackageToContinue}`
        : catalogErrors[item.productSlug] ? copy.weCouldnTLoadTheAccountRequirements : getCartItemProblem(item, requirements, copy),
  })).filter(problem => problem.message)
  const canCheckout = items.length > 0 && problems.length === 0 && !checkingCatalog &&
    (!readCustomerSession() || cartSync.state==='synced')
  const editing = items.find((item) => item.cartKey === editingKey) || null

  function changeQty(item, nextQty) {
    if (!supportsCartQuantity(item)) return
    const next = Math.max(1, Math.min(cartItemLimit(item), nextQty))
    setItems(updateCartQuantity(item.cartKey, next))
    setStatus('')
  }

  function remove(item) {
    const index = items.findIndex((entry) => entry.cartKey === item.cartKey)
    setItems(removeCartItem(item.cartKey))
    setRemoved({ item, index })
    setStatus('')
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setRemoved(null), 8000)
  }

  function undo() {
    if (!removed) return
    setItems(restoreCartItem(removed.item, removed.index))
    setRemoved(null)
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
  }

  function saveAccount(value, fields) {
    const first = fields.find(f => f.slot === 'userId')
    setItems(updateCartAccount(editingKey, value, { first: first?.label }))
    setEditingKey(null)
    setStatus(copy.destinationAccountDetailsWereUpdated)
  }

  return (
    <div className="digital-shell">
      <Navbar />
      <main className="digital-cart-page digital-container">
        <header className="digital-page-heading">
          <div><h1>{copy.digitalCart}</h1><p>{copy.reviewYourProductsAndDestinationAccountsBefore}</p></div>
          <a href="/search">{copy.continueShopping}</a>
        </header>

        {readCustomerSession() && <section className="digital-info-strip" role="status" aria-live="polite">
          <Info size={18}/>
          <span>{cartSync.state==='synced'?copy.yourCartIsSavedToYourZetruv:
            cartSync.state==='saving'?copy.savingCartChanges:
            cartSync.state==='loading'?copy.loadingAndMergingYourAccountCart:
            ['conflict','error'].includes(cartSync.state)?(cartSync.message||copy.weCouldnTSyncYourCart): copy.loadingYourAccountCart}</span>
          <button type="button" disabled={['saving','loading','conflict','error'].includes(cartSync.state)}
            onClick={()=>activateCustomerCart().catch(()=>{})}>{copy.syncAgain}</button>
        </section>}
        {readCustomerSession() && ['conflict','error'].includes(cartSync.state) && (
          <section className="digital-info-strip" role="alert" aria-live="assertive">
            <CircleAlert size={18} aria-hidden="true"/>
            <span>{copy.yourChangesHavenTBeenSavedCompare}</span>
            <button type="button" onClick={async()=>{
              if(!window.confirm(copy.useTheLatestSavedCartUnsavedChanges))return
              try{await resolveCartConflict('server')}catch(e){setStatus(e.message)}
            }}>{copy.useSavedCart}</button>
            <button type="button" onClick={async()=>{
              if(!window.confirm(copy.saveTheDraftFromThisDeviceItems))return
              try{await resolveCartConflict('local')}catch(e){setStatus(e.message)}
            }}>{copy.useDraft}</button>
          </section>
        )}
        <div className="digital-info-strip">
          <Info size={18} aria-hidden="true" />
          <span>{copy.editYourGameUserIdAndZone}</span>
        </div>

        <div className="digital-cart-layout">
          <section className="digital-cart-list-card" aria-labelledby="digital-cart-title">
            <div className="digital-cart-list-head">
              <strong id="digital-cart-title">{formatCopy(copy.cartProducts, { count: items.length })}</strong>
              <span>{itemCount} {copy.items}</span>
            </div>

            {items.length === 0 ? (
              <div className="digital-empty-cart">
                <ShoppingCart size={32} strokeWidth={1.6} aria-hidden="true" />
                <strong>{copy.yourDigitalCartIsEmpty}</strong>
                <p>{copy.chooseATopUpVoucherOrBoosting}</p>
                <a href="/search">{copy.viewProducts}</a>
              </div>
            ) : (
              <div className="digital-cart-items">
                {items.map(item => {
                  const qty = Math.max(1, Number(item.quantity) || 1)
                  const lineTotal = Number(item.unitPrice || 0) * qty
                  const allowsQuantity = supportsCartQuantity(item)
                  const checking = isChecking(item)
                  const loginUnavailable = !checking && item.fulfillmentMethod==='MANUAL_LOGIN' &&
                    !viaLoginServiceStatus(catalogProducts[item.productSlug],item,serviceReadiness[item.productSlug]).available
                  const issue = item.serverLineId && item.isAvailable===false
                    ? copy.thisProductStockOrDestinationAccountIs
                    : checking ? ''
                    : loginUnavailable ? `${copy.serviceTemporarilyUnavailable}. ${copy.removeThisPackageToContinue}`
                    : catalogErrors[item.productSlug] ? copy.weCouldnTLoadTheAccountRequirements : getCartItemProblem(item, requirements, copy)
                  const isAccount = item.fulfillmentMethod === 'AUTO_ID'
                  const target = item.accountFields || {}
                  return (
                    <article className="digital-cart-item" key={item.cartKey}>
                      <CartThumbnail item={item} />
                      <div className="digital-cart-item__copy">
                        <span className="digital-cart-item__badge">{item.productKind === 'Joki' ? copy.gameBoosting : copy[methodLabel[item.fulfillmentMethod]] || copy.digitalProduct}</span>
                        <h2>{item.productKind === 'Joki' ? item.productName : item.gameName || item.productName}</h2>
                        <strong className="digital-cart-item__variant">{item.variantName}</strong>
                        <span className="digital-cart-item__unit">{copy.unitPrice} {rupiah(Number(item.unitPrice) || 0)}</span>

                        {isAccount ? (
                          <div className="digital-cart-item__target">
                            <span>
                              <strong>{copy.destination}</strong> {clean(target.userId) || copy.userIdIsMissing}
                              {clean(target.zone) && <> {copy.zone} {clean(target.zone)}</>}
                            </span>
                            <button type="button" disabled={checking} onClick={() => setEditingKey(item.cartKey)}
                              aria-label={formatCopy(copy.editDestinationAccountFor, { product: item.variantName })}>
                              <Pencil size={13} aria-hidden="true" /> {copy.edit}
                            </button>
                          </div>
                        ) : <p>{itemContext(item, copy)}</p>}
                        {checking && !issue && <p className="digital-cart-item__checking" role="status">{copy.checkingProductRequirementsAndAccountDetails}</p>}
                        {issue && <p className="digital-cart-item__warning"><CircleAlert size={13} aria-hidden="true" />{issue}</p>}
                        {loginUnavailable && <div className="digital-cart-item__unavailable-actions">
                          <button type="button" onClick={() => remove(item)}>{copy.removeThisPackage}</button>
                          <a href="/search">{copy.browseOtherProducts2}</a>
                        </div>}
                      </div>
                      <div className="digital-cart-item__side">
                        <div className="digital-cart-item__subtotal">
                          <small>{copy.subtotal}</small>
                          <strong>{rupiah(lineTotal)}</strong>
                        </div>
                        <div className="digital-cart-item__actions">
                          {allowsQuantity ? (
                            <div className="digital-qty" role="group" aria-label={`Jumlah ${item.variantName}`}>
                              <button type="button" aria-label={copy.decreaseQuantity} disabled={qty <= 1}
                                onClick={() => changeQty(item, qty - 1)}><Minus size={15} aria-hidden="true" /></button>
                              <output aria-label={copy.itemQuantity}>{qty}</output>
                              <button type="button" aria-label={copy.increaseQuantity} disabled={qty >= cartItemLimit(item)}
                                onClick={() => changeQty(item, qty + 1)}><Plus size={15} aria-hidden="true" /></button>
                            </div>
                          ) : <small className="digital-cart-item__fixed-qty">{qty} {qty === 1 ? 'paket' : 'paket (tergabung)'}</small>}
                          <button type="button" className="digital-cart-item__remove"
                            aria-label={formatCopy(copy.remove2, { product: item.variantName })} title={copy.removeProduct}
                            onClick={() => remove(item)}><Trash2 size={18} strokeWidth={1.8} aria-hidden="true" /></button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {items.some(item => item.fulfillmentMethod === 'MANUAL_LOGIN') && (
              <div className="digital-login-cart-rule">
                <strong>{copy.topUpByLogin}</strong>
                <p>{copy.removeUnavailableTopUpByLoginPackages}</p>
              </div>
            )}
          </section>

          <aside className="digital-cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">{copy.paymentSummary}</h2>
            <div><span>{copy.productSubtotal}</span><strong>{rupiah(pricing.subtotal)}</strong></div>
            <div>
              <span className="digital-cart-summary__fee">{copy.serviceFee}
                <span className="digital-cart-fee-help">
                  <button type="button" aria-label={copy.serviceFeeInformation} title={copy.digitalCheckoutCurrentlyHasNoServiceFee}>
                    <Info size={15} aria-hidden="true" />
                  </button>
                  <span role="tooltip">{copy.digitalCheckoutCurrentlyHasNoServiceFee2}</span>
                </span>
              </span>
              <strong>{rupiah(pricing.serviceFee)}</strong>
            </div>
            {pricing.discount > 0 && <div className="digital-cart-summary__discount"><span>{copy.productDiscount}</span><strong>−{rupiah(pricing.discount)}</strong></div>}
            <hr />
            <div className="digital-cart-summary__total"><span>{copy.paymentTotal}</span><strong>{rupiah(pricing.total)}</strong></div>
            <button type="button" className="digital-cart-checkout"
              disabled={!canCheckout}
              onClick={() => { if (canCheckout) { if (readCustomerSession()) window.location.href = '/checkout'; else setAuthMode('login') } }}>
              {readCustomerSession() ? copy.continueToCheckout : copy.logInToCheckOut}
            </button>
            {problems.length > 0 ? (
              <p className="digital-cart-summary__warning" role="alert"><CircleAlert size={15} aria-hidden="true" />{copy.reviewOrderDetails} {problems[0].message}</p>
            ) : checkingCatalog ? <p role="status">{copy.verifyingTheCatalogBeforeCheckout}</p>
              : <p>{items.length ? copy.pricesAndPromotionsWillBeCheckedAgain : copy.addAProductToContinue}</p>}
            {status && <p className="digital-cart-summary__success" role="status"><CheckCircle2 size={15} />{status}</p>}
          </aside>
        </div>
      </main>

      {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)}
        onAuthenticated={async response => {
          try {
            setCustomerSession(response)
            await activateCustomerCart()
            if (getCartSyncStatus().state !== 'synced') throw new Error(copy.yourCartIsStillSyncing)
            window.location.href = '/checkout'
          } catch (error) {
            setStatus(error?.message || copy.yourCartIsnTReadyReviewIt)
          }
        }} />}
      {editing && (
        <AccountEditModal key={editing.cartKey} item={editing}
          requirements={requirements[editing.productSlug]}
          onClose={() => setEditingKey(null)} onSave={saveAccount}
        />
      )}

      {removed && (
        <div className="digital-cart-undo" role="status" aria-live="polite">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{removed.item.variantName} {copy.wasRemoved}</span>
          <button type="button" onClick={undo}>{copy.undo}</button>
          <button type="button" className="digital-cart-undo__close" onClick={() => setRemoved(null)}
            aria-label={copy.dismissNotification}><X size={16} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  )
}
