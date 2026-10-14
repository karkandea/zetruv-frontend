import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, Minus, Pencil, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import { getCatalogProduct } from '../services/catalogService'
import { activateCustomerCart, refreshCustomerCart, readCustomerSession, getCartSyncStatus, CART_SYNC_EVENT } from '../services/customerCartSync'
import {
  cartCount, cartItemLimit, onCartChange, readCart, removeCartItem,
  restoreCartItem, supportsCartQuantity, updateCartAccount, updateCartQuantity,
} from '../services/cartService'
import { getDigitalPricing } from '../services/digitalCartPricing'
import { viaLoginServiceStatus, VIA_LOGIN_UNAVAILABLE_LABEL } from '../services/digitalServiceAvailability'
import { getManualLoginReadiness } from '../services/digitalPurchaseCapabilities'
import { accountRequirements, checkCartDestination, getCartItemProblem } from '../services/digitalCartValidation'
import '../styles/digital-commerce.css'
import '../styles/digital-cart-improvements.css'
import '../styles/service-unavailable-polish.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const methodLabel = {
  AUTO_ID: 'Top Up Via ID',
  MANUAL_LOGIN: 'Top Up Via Login',
  VOUCHER_CODE: 'Voucher Game',
  JOKI_MANUAL: 'Joki Game',
}
const fallbackImages = {
  TopUpGame: '/assets/home/category-topup.png',
  TopUpLogin: '/assets/home/category-topup.png',
  GameVoucher: '/assets/home/category-voucher.png',
  Joki: '/assets/search/category-joki.webp',
  GameAccount: '/assets/home/category-account.png',
}
const clean = (value) => String(value ?? '').trim()

function itemContext(item) {
  if (item.fulfillmentMethod === 'MANUAL_LOGIN') return 'Informasi akun game diisi saat checkout jika layanan tersedia.'
  if (item.fulfillmentMethod === 'VOUCHER_CODE') return 'Kode voucher dikirim setelah pembayaran berhasil.'
  if (item.fulfillmentMethod === 'JOKI_MANUAL') return 'Detail layanan akan dilengkapi saat checkout.'
  if (item.productKind === 'GameAccount') return 'Akun game akan diverifikasi sebelum pemrosesan.'
  return 'Produk digital'
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
  const [value, setValue] = useState({
    userId: item.accountFields?.userId || '',
    zone: item.accountFields?.zone || '',
  })
  const fields = requirements || []
  const invalid = checkCartDestination({ ...item, accountFields: value }, fields)
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
          <div><h2 id="cart-edit-title">Edit Data Akun Tujuan</h2><p>{item.productName} · {item.variantName}</p></div>
          <button type="button" aria-label="Tutup modal" onClick={onClose}><X size={19} aria-hidden="true" /></button>
        </header>
        {fields.length ? (
          <form onSubmit={(event) => { event.preventDefault(); if (invalid.valid) onSave(value, fields) }}>
            {fields.map((field) => (
              <label key={field.key}>
                {field.label}{!field.required && <span> (opsional)</span>}
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
              <button className="digital-cart-modal__cancel" type="button" onClick={onClose}>Batal</button>
              <button className="digital-cart-modal__save" type="submit" disabled={!invalid.valid}>Simpan Perubahan</button>
            </footer>
          </form>
        ) : (
          <p className="digital-cart-modal__error" role="alert">
            Definisi field akun belum tersedia dari katalog. Periksa koneksi lalu muat ulang halaman.
          </p>
        )}
      </section>
    </div>
  )
}

export default function CartPage() {
  const [items, setItems] = useState(readCart)
  const [requirements, setRequirements] = useState({})
  const [catalogErrors, setCatalogErrors] = useState({})
  const [catalogProducts, setCatalogProducts] = useState({})
  const [serviceReadiness, setServiceReadiness] = useState({})
  const [editingKey, setEditingKey] = useState(null)
  const [removed, setRemoved] = useState(null)
  const [status, setStatus] = useState('')
  const [cartSync,setCartSync] = useState(getCartSyncStatus)
  const undoTimer = useRef(null)
  const accountSlugs = useMemo(() => [...new Set(items
    .filter((item) => ['AUTO_ID','MANUAL_LOGIN'].includes(item.fulfillmentMethod))
    .map((item) => item.productSlug).filter(Boolean))].sort().join('|'), [items])

  useEffect(() => onCartChange(setItems), [])
  useEffect(()=>{
    const handler=event=>setCartSync(event.detail||getCartSyncStatus())
    window.addEventListener(CART_SYNC_EVENT,handler)
    if(readCustomerSession())activateCustomerCart().catch(()=>{})
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
        if (product.slug !== slug) throw new Error('Produk tidak sesuai.')
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
          setCatalogErrors((prev) => ({ ...prev, [slug]: 'Gagal memuat aturan data akun. Coba muat ulang halaman.' }))
        }
      }
    }))
    return () => { active = false }
  }, [accountSlugs])

  const pricing = useMemo(() => getDigitalPricing(items), [items])
  const itemCount = cartCount(items)
  const problems = items.map(item => ({
    key: item.cartKey,
    message: item.fulfillmentMethod === 'MANUAL_LOGIN' &&
      !viaLoginServiceStatus(catalogProducts[item.productSlug],item,serviceReadiness[item.productSlug]).available
        ? `${VIA_LOGIN_UNAVAILABLE_LABEL}. Hapus paket ini untuk melanjutkan.`
        : catalogErrors[item.productSlug] || getCartItemProblem(item, requirements),
  })).filter(problem => problem.message)
  const canCheckout = items.length > 0 && problems.length === 0 &&
    !['loading','saving','error'].includes(cartSync.state)
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
    setStatus('Data akun tujuan berhasil diperbarui.')
  }

  return (
    <div className="digital-shell">
      <Navbar />
      <main className="digital-cart-page digital-container">
        <header className="digital-page-heading">
          <div><h1>Keranjang Digital</h1><p>Periksa produk dan akun tujuan sebelum checkout.</p></div>
          <a href="/search">Lanjut Belanja</a>
        </header>

        {readCustomerSession() && <section className="digital-info-strip" role="status" aria-live="polite">
          <Info size={18}/>
          <span>{cartSync.state==='synced'?'Keranjang tersimpan di akun Zetruv dan dapat diakses di perangkat lain.':
            cartSync.state==='saving'?'Menyimpan perubahan keranjang ke server...':
            cartSync.state==='loading'?'Memuat dan menggabungkan keranjang akun...':
            cartSync.state==='error'?(cartSync.message||'Gagal menyinkronkan keranjang.'): 'Memuat keranjang akun...'}</span>
          <button type="button" disabled={cartSync.state==='saving'||cartSync.state==='loading'}
            onClick={()=>activateCustomerCart().catch(()=>{})}>Sinkronkan ulang</button>
        </section>}
        <div className="digital-info-strip">
          <Info size={18} aria-hidden="true" />
          <span>User ID dan Zona/Server adalah <strong>tujuan top-up</strong> yang dapat diedit di keranjang. Password dan OTP bukan data tujuan top-up dan jangan dimasukkan di sini. Kredensial untuk layanan Via Login/Joki baru dilengkapi saat checkout.</span>
        </div>

        <div className="digital-cart-layout">
          <section className="digital-cart-list-card" aria-labelledby="digital-cart-title">
            <div className="digital-cart-list-head">
              <strong id="digital-cart-title">Keranjang ({items.length} produk)</strong>
              <span>{itemCount} item</span>
            </div>

            {items.length === 0 ? (
              <div className="digital-empty-cart">
                <ShoppingCart size={32} strokeWidth={1.6} aria-hidden="true" />
                <strong>Keranjang digital masih kosong</strong>
                <p>Pilih Top Up, Voucher, atau Joki Game untuk mulai transaksi.</p>
                <a href="/search">Lihat Produk</a>
              </div>
            ) : (
              <div className="digital-cart-items">
                {items.map(item => {
                  const qty = Math.max(1, Number(item.quantity) || 1)
                  const lineTotal = Number(item.unitPrice || 0) * qty
                  const allowsQuantity = supportsCartQuantity(item)
                  const loginUnavailable = item.fulfillmentMethod==='MANUAL_LOGIN' &&
                    !viaLoginServiceStatus(catalogProducts[item.productSlug],item,serviceReadiness[item.productSlug]).available
                  const issue = loginUnavailable ? `${VIA_LOGIN_UNAVAILABLE_LABEL}. Hapus paket ini untuk melanjutkan.`
                    : catalogErrors[item.productSlug] || getCartItemProblem(item, requirements)
                  const isAccount = item.fulfillmentMethod === 'AUTO_ID'
                  const target = item.accountFields || {}
                  return (
                    <article className="digital-cart-item" key={item.cartKey}>
                      <CartThumbnail item={item} />
                      <div className="digital-cart-item__copy">
                        <span className="digital-cart-item__badge">{methodLabel[item.fulfillmentMethod] || item.productKind || 'Digital Product'}</span>
                        <h2>{item.gameName || item.productName}</h2>
                        <strong className="digital-cart-item__variant">{item.variantName}</strong>
                        <span className="digital-cart-item__unit">Harga satuan: {rupiah(Number(item.unitPrice) || 0)}</span>

                        {isAccount ? (
                          <div className="digital-cart-item__target">
                            <span>
                              <strong>Tujuan:</strong> {clean(target.userId) || 'User ID belum diisi'}
                              {clean(target.zone) && <> · Zona: {clean(target.zone)}</>}
                            </span>
                            <button type="button" onClick={() => setEditingKey(item.cartKey)}
                              aria-label={`Edit data akun tujuan ${item.variantName}`}>
                              <Pencil size={13} aria-hidden="true" /> Edit
                            </button>
                          </div>
                        ) : <p>{itemContext(item)}</p>}
                        {issue && <p className="digital-cart-item__warning"><CircleAlert size={13} aria-hidden="true" />{issue}</p>}
                        {loginUnavailable && <div className="digital-cart-item__unavailable-actions">
                          <button type="button" onClick={() => remove(item)}>Hapus paket ini</button>
                          <a href="/search">Cari produk lain</a>
                        </div>}
                      </div>
                      <div className="digital-cart-item__side">
                        <div className="digital-cart-item__subtotal">
                          <small>Subtotal</small>
                          <strong>{rupiah(lineTotal)}</strong>
                        </div>
                        <div className="digital-cart-item__actions">
                          {allowsQuantity ? (
                            <div className="digital-qty" role="group" aria-label={`Jumlah ${item.variantName}`}>
                              <button type="button" aria-label="Kurangi jumlah" disabled={qty <= 1}
                                onClick={() => changeQty(item, qty - 1)}><Minus size={15} aria-hidden="true" /></button>
                              <output aria-label="Jumlah item">{qty}</output>
                              <button type="button" aria-label="Tambah jumlah" disabled={qty >= cartItemLimit(item)}
                                onClick={() => changeQty(item, qty + 1)}><Plus size={15} aria-hidden="true" /></button>
                            </div>
                          ) : <small className="digital-cart-item__fixed-qty">{qty} {qty === 1 ? 'paket' : 'paket (tergabung)'}</small>}
                          <button type="button" className="digital-cart-item__remove"
                            aria-label={`Hapus produk ${item.variantName}`} title="Hapus produk"
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
                <strong>Top Up Via Login</strong>
                <p>Paket Via Login yang belum tersedia perlu dihapus sebelum melanjutkan. Informasi akun game tidak disimpan di keranjang.</p>
              </div>
            )}
          </section>

          <aside className="digital-cart-summary" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title">Ringkasan Pembayaran</h2>
            <div><span>Subtotal produk</span><strong>{rupiah(pricing.subtotal)}</strong></div>
            <div>
              <span className="digital-cart-summary__fee">Biaya layanan
                <span className="digital-cart-fee-help">
                  <button type="button" aria-label="Info biaya layanan" title="Backend belum mengenakan biaya layanan untuk checkout digital.">
                    <Info size={15} aria-hidden="true" />
                  </button>
                  <span role="tooltip">Checkout digital belum mengenakan biaya layanan. Total final mengikuti harga dan promo yang divalidasi backend.</span>
                </span>
              </span>
              <strong>{rupiah(pricing.serviceFee)}</strong>
            </div>
            {pricing.discount > 0 && <div className="digital-cart-summary__discount"><span>Diskon produk</span><strong>−{rupiah(pricing.discount)}</strong></div>}
            <hr />
            <div className="digital-cart-summary__total"><span>Total pembayaran</span><strong>{rupiah(pricing.total)}</strong></div>
            <button type="button" className="digital-cart-checkout"
              disabled={!canCheckout}
              onClick={() => { if (canCheckout) window.location.href = '/checkout' }}>
              Lanjut ke Checkout
            </button>
            {problems.length > 0 ? (
              <p className="digital-cart-summary__warning" role="alert"><CircleAlert size={15} aria-hidden="true" />Periksa data pesanan: {problems[0].message}</p>
            ) : <p>{items.length ? 'Harga dan promo akan diperiksa kembali pada checkout.' : 'Tambahkan produk untuk melanjutkan.'}</p>}
            {status && <p className="digital-cart-summary__success" role="status"><CheckCircle2 size={15} />{status}</p>}
          </aside>
        </div>
      </main>

      {editing && (
        <AccountEditModal key={editing.cartKey} item={editing}
          requirements={requirements[editing.productSlug]}
          onClose={() => setEditingKey(null)} onSave={saveAccount}
        />
      )}

      {removed && (
        <div className="digital-cart-undo" role="status" aria-live="polite">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{removed.item.variantName} dihapus.</span>
          <button type="button" onClick={undo}>Undo</button>
          <button type="button" className="digital-cart-undo__close" onClick={() => setRemoved(null)}
            aria-label="Tutup notifikasi"><X size={16} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  )
}
