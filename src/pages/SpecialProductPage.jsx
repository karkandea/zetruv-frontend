import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import { searchAssets } from '../data/searchAssets'
import voucherSteam from '../assets/special/voucher-steam.png'
import { getCatalogProduct } from '../services/catalogService'
import { addCartItem, awaitCartPersistence, readCart } from '../services/cartService'
import { getCartSyncStatus, readCustomerSession } from '../services/customerCartSync'
import { getDigitalPricing } from '../services/digitalCartPricing'
import '../styles/special-product.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const VOUCHERS = {
  'steam-wallet-idr': {
    id: 'voucher-steam-wallet',
    name: 'Steam Wallet IDR',
    publisher: 'Steam',
    kind: 'GameVoucher',
    fulfillmentMethod: 'VOUCHER_CODE',
    image: voucherSteam,
    hero: voucherSteam,
    badge: 'VOUCHER GAME',
    description: 'Kode voucher digital dikirim setelah pembayaran berhasil.',
    variants: [
      { id: 'steam-60', name: 'Steam Wallet IDR 60K', price: 65000 },
      { id: 'steam-120', name: 'Steam Wallet IDR 120K', price: 125000 },
      { id: 'steam-250', name: 'Steam Wallet IDR 250K', price: 257000 },
      { id: 'steam-400', name: 'Steam Wallet IDR 400K', price: 408000 },
    ],
  },
  'google-play-gift-code': {
    id: 'voucher-google-play',
    name: 'Google Play Gift Code',
    publisher: 'Google Play',
    kind: 'GameVoucher',
    fulfillmentMethod: 'VOUCHER_CODE',
    image: searchAssets.categoryItems,
    hero: searchAssets.categoryItems,
    badge: 'VOUCHER GAME',
    description: 'Gift code digital untuk akun Google Play region Indonesia.',
    variants: [
      { id: 'gp-50', name: 'Google Play IDR 50K', price: 52000 },
      { id: 'gp-100', name: 'Google Play IDR 100K', price: 103000 },
      { id: 'gp-150', name: 'Google Play IDR 150K', price: 154000 },
    ],
  },
  'playstation-store': {
    id: 'voucher-playstation-store',
    name: 'PlayStation Store Gift Card',
    publisher: 'PlayStation',
    kind: 'GameVoucher',
    fulfillmentMethod: 'VOUCHER_CODE',
    image: searchAssets.categoryItems,
    hero: searchAssets.categoryItems,
    badge: 'VOUCHER GAME',
    description: 'Kode voucher PlayStation Store. Periksa region PSN sebelum membeli.',
    variants: [
      { id: 'psn-100', name: 'PS Store IDR 100K', price: 103000 },
      { id: 'psn-200', name: 'PS Store IDR 200K', price: 206000 },
      { id: 'psn-400', name: 'PS Store IDR 400K', price: 411000 },
    ],
  },
}

function ProductState({ state, retry, joki = false }) {
  const loading = state === 'loading'
  const failed = state === 'error'
  return <div className="special-product-shell"><Navbar />
    <main className="special-product-page special-product-state" aria-busy={loading}>
      <div role={failed ? 'alert' : 'status'}>
        <h1>{loading ? 'Memuat produk…' : failed ? 'Produk belum bisa dimuat' : 'Produk tidak ditemukan'}</h1>
        {state === 'not-found' && <p>Katalog produk ini belum tersedia.</p>}
      </div>
      {failed && <button type="button" className="special-secondary" onClick={retry}>Coba lagi</button>}
      {!loading && <a href={joki ? '/search?kind=Joki' : '/search'}>{joki ? 'Kembali ke Joki Game' : 'Kembali ke katalog'}</a>}
    </main>
  </div>
}

function LiveJokiProduct({ slug }) {
  const [result, setResult] = useState({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getCatalogProduct(slug, { signal: controller.signal }).then((product) => {
      if (controller.signal.aborted) return
      setResult(product?.kind === 'Joki' ? { state: 'ready', product } : { state: 'not-found' })
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ state: error.status === 404 ? 'not-found' : 'error' })
    })
    return () => controller.abort()
  }, [slug, attempt])

  if (result.state !== 'ready') return <ProductState joki state={result.state} retry={() => {
    setResult({ state: 'loading' })
    setAttempt((value) => value + 1)
  }} />

  return <SpecialProduct product={result.product} slug={slug} joki />
}

function packagePrice(variant) {
  return Number(variant.effectivePrice ?? variant.price)
}

function isPurchasable(variant) {
  return variant.isAvailable && (variant.stockQuantity == null || variant.stockQuantity > 0) &&
    Number.isFinite(packagePrice(variant)) && packagePrice(variant) > 0
}

function SpecialProduct({ product, slug, joki = false }) {
  const variants = product.variants || []
  const available = variants.filter((variant) => !joki || (product.isAvailable && isPurchasable(variant)))
  const [selectedId, setSelectedId] = useState(available[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const addGuard = useRef(false)
  const selected = available.find((item) => item.id === selectedId) || available[0]
  const image = joki ? product.thumbnailUrl || product.game?.imageUrl || searchAssets.categoryJoki : product.image
  const hero = joki ? product.images?.[0]?.url || image : product.hero || image
  const publisher = joki ? product.game?.publisher : product.publisher
  const jokiMeta = [publisher, product.rating != null && `${product.rating} ★`].filter(Boolean).join(' · ')
  const description = product.shortDescription || product.description
  const entry = selected ? {
    accountKey: 'checkout-required',
    productId: product.id,
    productSlug: product.slug || slug,
    productName: product.name,
    productKind: product.kind,
    fulfillmentMethod: product.fulfillmentMethod,
    thumbnailUrl: image,
    gameName: joki ? product.game?.name || product.name : product.name,
    variantId: selected.id,
    variantName: selected.name,
    unitPrice: packagePrice(selected),
    regularPrice: selected.price,
    quantity,
    maxQuantity: joki ? 1 : 9,
    requiresGameAccountValidation: Boolean(product.requiresGameAccountValidation),
  } : null
  const pricing = entry ? getDigitalPricing([entry]) : null
  const voucherServiceFee = joki ? 0 : 2000

  async function add(goToCart) {
    if (!entry || addGuard.current) return
    addGuard.current = true
    setSaving(true)
    setNotice('')
    setError('')
    try {
      if (joki && readCustomerSession() && getCartSyncStatus().state !== 'synced') {
        throw Error('Keranjang akun belum tersinkron. Periksa keranjang lalu coba lagi.')
      }
      const alreadyAdded = joki && readCart().some((item) => item.variantId === entry.variantId)
      if (!alreadyAdded) addCartItem(entry)
      if (joki) {
        await awaitCartPersistence()
        const sync = getCartSyncStatus()
        if (sync.state === 'error' || sync.state === 'conflict') throw Error(sync.message)
      }
      if (goToCart) window.location.href = '/cart'
      else setNotice(alreadyAdded ? 'Paket ini sudah ada di keranjang.' : 'Produk ditambahkan ke keranjang.')
    } catch (failure) {
      setError(failure.message || 'Gagal menambahkan paket. Silakan coba lagi.')
    } finally {
      addGuard.current = false
      setSaving(false)
    }
  }

  return (
    <div className="special-product-shell">
      <Navbar variant="catalog" />
      <main className="special-product-page">
        <section className={`special-product-hero special-product-hero--${joki ? 'joki' : 'voucher'}`}>
          <img className="special-product-hero__background" src={hero} alt="" />
          <div className="special-product-hero__scrim" />
          <div className="special-product-hero__content">
            <div className="special-product-hero__visual"><img src={image} alt="" /></div>
            <div className="special-product-hero__copy">
              <span>{joki ? 'JOKI GAME' : product.badge}</span>
              <h1>{product.name}</h1>
              {joki ? (jokiMeta && <p>{jokiMeta}</p>)
                : <p>{publisher} · 4.9 ★ · Proses aman melalui Zetruv</p>}
              {description && <small>{description}</small>}
            </div>
          </div>
        </section>

        <div className="special-product-layout">
          <section className="special-product-packages">
            <h2>{joki ? 'Pilih Paket Joki' : 'Pilih Nominal Voucher'}</h2>
            <p>{joki ? 'Layanan diproses manual setelah pembayaran terkonfirmasi.' : 'Kode digital dikirim setelah pembayaran berhasil.'}</p>
            {!selected && <p role="status">Belum ada paket yang tersedia.</p>}
            <div className="special-product-grid">
              {variants.map((item) => (
                <button className={selected?.id === item.id ? 'is-active' : ''} type="button"
                  disabled={!available.includes(item)} aria-pressed={selected?.id === item.id}
                  onClick={() => { setSelectedId(item.id); setQuantity(1); setNotice(''); setError('') }} key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{available.includes(item) ? rupiah(packagePrice(item)) : 'Tidak tersedia'}</span>
                </button>
              ))}
            </div>
            {!joki && <div className="special-product-note"><b>i</b><span>Pastikan region voucher sesuai dengan akun yang akan digunakan.</span></div>}
          </section>

          {entry && <aside className="special-product-summary">
            <h2>Ringkasan</h2>
            <div className="special-product-selected">
              <div><strong>{selected.name}</strong><span>{rupiah(entry.unitPrice)} / item</span></div>
              {!joki && <div className="special-product-qty"><button onClick={() => setQuantity((v) => Math.max(1, v - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity((v) => Math.min(9, v + 1))}>+</button></div>}
            </div>
            <div className="special-summary-row"><span>Subtotal</span><strong>{rupiah(pricing.subtotal)}</strong></div>
            {pricing.discount > 0 && <div className="special-summary-row"><span>Diskon</span><strong>−{rupiah(pricing.discount)}</strong></div>}
            {!joki && <div className="special-summary-row"><span>Biaya layanan</span><strong>{rupiah(voucherServiceFee)}</strong></div>}
            <hr />
            <div className="special-summary-total"><span>Total</span><strong>{rupiah(pricing.total + voucherServiceFee)}</strong></div>
            {notice && <p role="status" className="special-product-success">{notice}</p>}
            {error && <p role="alert">{error}</p>}
            <button className="special-secondary" type="button" disabled={saving} onClick={() => add(false)}>Tambah ke Keranjang</button>
            <button className="special-primary" type="button" disabled={saving} onClick={() => add(true)}>Tambah &amp; Lihat Keranjang</button>
          </aside>}
        </div>
      </main>
    </div>
  )
}

export default function SpecialProductPage({ type = 'voucher', slug }) {
  if (type === 'joki') return <LiveJokiProduct key={slug} slug={slug} />
  const product = Object.hasOwn(VOUCHERS, slug) ? VOUCHERS[slug] : null
  return product ? <SpecialProduct key={slug} slug={slug} product={product} /> : <ProductState state="not-found" />
}
