import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { getCatalogProduct, getCatalogProducts } from '../services/catalogService'
import { isFavorite, toggleFavorite, subscribeFavorites } from '../services/favoritesService'
import { searchAssets } from '../data/searchAssets'
import '../styles/physical-purchase.css'

const CART_KEY = 'zetruv-physical-cart-v1'
const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(Number(value))}`

function Availability({ available }) {
  return <span className={`physical-stock physical-stock--${available ? 'ok' : 'low'}`}>{available ? 'Tersedia' : 'Tidak tersedia'}</span>
}

function ProductCard({ product }) {
  const favoriteId = `merchandise:${product.slug}`
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))
  useEffect(() => subscribeFavorites(() => setSaved(isFavorite(favoriteId))), [favoriteId])

  return <article className="physical-product-card">
    <a className="physical-product-card__link" href={`/merchandise/${encodeURIComponent(product.slug)}`}>
      <div className="physical-product-card__image">
        {product.thumbnailUrl ? <img src={product.thumbnailUrl} alt="" loading="lazy" /> : <span>Foto belum tersedia</span>}
      </div>
      <div className="physical-product-card__meta"><span className="physical-badge">MERCHANDISE</span><Availability available={product.isAvailable} /></div>
      <strong className="physical-product-card__name">{product.name}</strong>
      <span className="physical-product-card__variant">{product.categorySlug}</span>
      <strong className="physical-product-card__price">{product.minPrice != null ? rupiah(product.minPrice) : 'Harga belum tersedia'}</strong>
    </a>
    <button type="button" className={`physical-product-card__favorite${saved ? ' is-saved' : ''}`}
      aria-label={saved ? `Hapus ${product.name} dari favorit` : `Simpan ${product.name} ke favorit`}
      aria-pressed={saved}
      onClick={() => setSaved(toggleFavorite({
        id: favoriteId, name: product.name, type: 'Merchandise',
        price: product.minPrice != null ? rupiah(product.minPrice) : 'Harga belum tersedia',
        href: `/merchandise/${product.slug}`, image: product.thumbnailUrl,
      }))}>{saved ? '♥' : '♡'}</button>
  </article>
}

export function LivePhysicalCatalogPage() {
  const [products, setProducts] = useState([])
  const [state, setState] = useState('loading')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const controller = new AbortController()
    getCatalogProducts({ kind: 'Merchandise', pageSize: 50, signal: controller.signal })
      .then((page) => { if (!controller.signal.aborted) { setProducts(page.items || []); setState('ready') } })
      .catch(() => { if (!controller.signal.aborted) setState('error') })
    return () => controller.abort()
  }, [])

  const visible = useMemo(() => {
    if (sort === 'low') return [...products].sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity))
    if (sort === 'high') return [...products].sort((a, b) => (b.minPrice ?? -Infinity) - (a.minPrice ?? -Infinity))
    return products
  }, [products, sort])

  const categories = [
    ['Top Up Games Via ID', searchAssets.categoryPlayerId, '/search?kind=TopUpGame'],
    ['Top Up Games Via Login', searchAssets.categoryLogin, '/search?kind=TopUpLogin'],
    ['Voucher Game', searchAssets.categoryItems, '/search?kind=GameVoucher'],
    ['Joki Game', searchAssets.categoryJoki, '/search?kind=Joki'],
    ['Game Accounts', searchAssets.categoryAccounts, '/game-accounts'],
    ['Merchandise', searchAssets.categoryMerchandise, '/merchandise'],
  ]

  return <div className="physical-shell">
    <Navbar />
    <main className="physical-catalog"><div className="physical-catalog-layout">
      <aside className="physical-catalog-sidebar">
        <h2>Categories</h2><nav>{categories.map(([label, icon, href]) => <a className={label === 'Merchandise' ? 'is-active' : ''} href={href} key={label}>
          <span><img src={icon} alt="" /></span><strong>{label}</strong>{label === 'Merchandise' && <i aria-hidden="true" />}
        </a>)}</nav>
      </aside>
      <section className="physical-catalog-content">
        <header className="physical-catalog__heading"><div><h1>Merchandise</h1><p>Produk fisik yang terdaftar di katalog Zetruv.</p></div><span>{products.length} products</span></header>
        <div className="physical-catalog__toolbar">
          <div className="physical-filter-pills"><span>Semua Merchandise</span></div>
          <label className="physical-sort"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Urutkan merchandise">
            <option value="newest">Urutan katalog</option><option value="low">Harga termurah</option><option value="high">Harga tertinggi</option>
          </select></label>
        </div>
        <div className="physical-catalog__context"><strong>Semua produk</strong><span>•</span><span>Harga dan stok berasal dari katalog</span></div>
        {state === 'loading' && <p role="status">Memuat merchandise…</p>}
        {state === 'error' && <p role="alert">Katalog merchandise gagal dimuat. Silakan refresh halaman.</p>}
        {state === 'ready' && visible.length === 0 && <p role="status">Belum ada merchandise yang dipublikasikan di katalog.</p>}
        <div className="physical-product-grid">{state === 'ready' && visible.map((product) => <ProductCard product={product} key={product.id} />)}</div>
      </section>
    </div></main>
  </div>
}

export function LivePhysicalProductPage({ slug }) {
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

  if (state !== 'ready') return <div className="physical-shell"><Navbar /><main className="physical-pdp" role="status">
    <h1>{state === 'loading' ? 'Memuat produk…' : state === 'not-found' ? 'Produk tidak ditemukan' : 'Gagal memuat produk'}</h1>
    <a href="/merchandise">Kembali ke Merchandise</a>
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
      category: 'Merchandise',
    }))
    window.dispatchEvent(new Event('zetruv:physical-cart-changed'))
    setAdded(true)
  }

  return <div className="physical-shell"><Navbar />
    <main className="physical-pdp">
      <div className="physical-breadcrumb"><a href="/merchandise">Merchandise</a> <span>/</span> {product.name}</div>
      <div className="physical-pdp__main">
        <section className="physical-gallery">
          {images.length > 0 && <div className="physical-gallery__thumbs">{images.map((src, index) => <button type="button" className={index === selectedImage ? 'is-active' : ''} key={`${src}-${index}`} onClick={() => setSelectedImage(index)} aria-label={`Lihat gambar ${index + 1}`}><img src={src} alt="" /></button>)}</div>}
          <div className="physical-gallery__primary">{images.length ? <img src={images[Math.min(selectedImage, images.length - 1)]} alt={product.name} /> : <span>Foto produk belum tersedia</span>}</div>
        </section>
        <section className="physical-purchase-panel">
          <div className="physical-purchase-panel__top"><span className="physical-badge">MERCHANDISE</span><Availability available={product.isAvailable} /></div>
          <h1>{product.name}</h1>
          <div className="physical-rating-line">
            {product.rating != null && <strong>★ {product.rating}</strong>}
            {product.reviewCount > 0 && <span>{product.reviewCount} ulasan</span>}
            <span>{product.soldQuantity ?? 0} terjual</span>
          </div>
          <strong className="physical-pdp__price">{unitPrice != null ? rupiah(unitPrice) : 'Harga belum tersedia'}</strong>
          <hr />
          <div className="physical-option-heading"><strong>Pilih varian</strong><span>Stok sesuai katalog</span></div>
          <div className="physical-size-options">{variants.map((item) => <button key={item.id} type="button" disabled={!item.isAvailable} aria-pressed={variantId === item.id} className={variantId === item.id ? 'is-active' : ''} onClick={() => { setVariantId(item.id); setQty(1); setAdded(false) }}>
            {item.name} · {rupiah(item.effectivePrice ?? item.price)}
          </button>)}</div>
          {variants.length === 0 && <p>Belum ada varian aktif.</p>}
          <div className="physical-qty-save">
            <div className="physical-qty"><button type="button" onClick={() => { setQty((v) => Math.max(1, v - 1)); setAdded(false) }}>−</button><span>{qty}</span><button type="button" onClick={() => { setQty((v) => Math.min(stockLimit, v + 1)); setAdded(false) }}>+</button></div>
            <button className={saved ? 'physical-save is-saved' : 'physical-save'} type="button" aria-pressed={saved} onClick={() => setSaved(toggleFavorite({
              id: favoriteId, name: product.name, type: 'Merchandise',
              price: unitPrice != null ? rupiah(unitPrice) : 'Harga belum tersedia',
              href: `/merchandise/${product.slug}`, image: images[0],
            }))}>{saved ? '♥ Tersimpan' : '♡ Favorit'}</button>
          </div>
          <div className="physical-shipping-estimate" role="note"><strong>Keranjang merchandise masih berupa draft</strong><span>Checkout, ongkir, dan pembayaran fisik belum tersedia. Harga dan stok akan perlu divalidasi ulang.</span></div>
          {added && <p role="status" className="physical-add-confirmation">Draft {product.name} · {variant.name} · {qty} item disimpan ke keranjang.</p>}
          <button className="physical-btn physical-btn--primary physical-add-cart" type="button" disabled={!canAdd} onClick={added ? () => { window.location.href = '/cart?flow=physical' } : addToCart}>{added ? 'Lihat Keranjang' : canAdd ? 'Simpan Draft Keranjang' : 'Belum tersedia'}</button>
        </section>
      </div>
      <div className="physical-product-info"><section><strong>Deskripsi</strong><p>{product.description || product.shortDescription || 'Deskripsi belum tersedia.'}</p></section></div>
    </main>
  </div>
}
