import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import { readCustomerSession, setCustomerSession } from '../services/customerCartSync'
import { isFavorite, toggleFavorite, subscribeFavorites } from '../services/favoritesService'
import { searchAssets } from '../data/searchAssets'
import jerseyCard from '../assets/physical/jersey-card.webp'
import jerseyPro from '../assets/physical/jersey-pro.webp'
import keychain from '../assets/physical/keychain.webp'
import scarf from '../assets/physical/scarf.webp'
import jerseyMain from '../assets/physical/jersey-main.webp'
import '../styles/physical-purchase.css'

const PHYSICAL_CART_KEY = 'zetruv-physical-cart-v1'

const PRODUCTS = [
  {
    slug: 'zetruv-gaming-jersey',
    category: 'Jersey',
    badge: 'JERSEY',
    stock: 'In stock',
    stockTone: 'ok',
    name: 'Zetruv Gaming Jersey',
    meta: 'Black · Size S–XL',
    price: 249000,
    sold: 128,
    rating: '4.9',
    image: jerseyCard,
  },
  {
    slug: 'zetruv-pro-jersey',
    category: 'Jersey',
    badge: 'JERSEY',
    stock: 'In stock',
    stockTone: 'ok',
    name: 'Zetruv Pro Jersey',
    meta: 'Black · Size M–XXL',
    price: 279000,
    sold: 86,
    rating: '4.9',
    image: jerseyPro,
  },
  {
    slug: 'zetruv-crest-keychain',
    category: 'Keychain',
    badge: 'KEYCHAIN',
    stock: 'In stock',
    stockTone: 'ok',
    name: 'Zetruv Crest Keychain',
    meta: 'Navy · Metal',
    price: 79000,
    sold: 54,
    rating: '4.9',
    image: keychain,
  },
  {
    slug: 'zetruv-supporter-scarf',
    category: 'Fan Gear',
    badge: 'FAN GEAR',
    stock: 'Low stock',
    stockTone: 'low',
    name: 'Zetruv Supporter Scarf',
    meta: 'Navy · One size',
    price: 129000,
    sold: 41,
    rating: '4.9',
    image: scarf,
  },
]

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function readPhysicalCart() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.sessionStorage.getItem(PHYSICAL_CART_KEY) || 'null')
  } catch {
    return null
  }
}

function writePhysicalCart(value) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PHYSICAL_CART_KEY, JSON.stringify(value))
}

function PhysicalButton({ children, tone = 'primary', onClick, href, disabled = false, className = '' }) {
  const cn = `physical-btn physical-btn--${tone} ${className}`.trim()
  if (href && !disabled) return <a className={cn} href={href}>{children}</a>
  return <button className={cn} type="button" onClick={onClick} disabled={disabled}>{children}</button>
}

function ProductCard({ product }) {
  const favoriteId = `merchandise:${product.slug}`
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))
  useEffect(() => subscribeFavorites(() => setSaved(isFavorite(favoriteId))), [favoriteId])
  return (
    <article className="physical-product-card">
      <a className="physical-product-card__link" href={`/merchandise/${encodeURIComponent(product.slug)}`} aria-label={`Lihat ${product.name}`}>
        <div className="physical-product-card__image"><img src={product.image} alt="" /></div>
        <div className="physical-product-card__meta">
          <span className="physical-badge">{product.badge}</span>
          <span className={`physical-stock physical-stock--${product.stockTone}`}>{product.stock}</span>
        </div>
        <strong className="physical-product-card__name">{product.name}</strong>
        <span className="physical-product-card__variant">{product.meta}</span>
        <strong className="physical-product-card__price">{rupiah(product.price)}</strong>
      </a>
      <button type="button" className={`physical-product-card__favorite${saved ? ' is-saved' : ''}`}
        aria-label={saved ? `Hapus ${product.name} dari favorit` : `Simpan ${product.name} ke favorit`}
        aria-pressed={saved}
        onClick={() => setSaved(toggleFavorite({
          id: favoriteId, name: product.name, type: 'Merchandise',
          price: rupiah(product.price), href: `/merchandise/${product.slug}`, image: product.image,
        }))}>
        {saved ? '♥' : '♡'}
      </button>
    </article>
  )
}

export function PhysicalCatalogPage() {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('Sort: Newest')

  const visible = useMemo(() => {
    const rows = category === 'All' ? PRODUCTS : PRODUCTS.filter((item) => item.category === category)
    if (sort === 'Sort: Price Low') return [...rows].sort((a, b) => a.price - b.price)
    if (sort === 'Sort: Price High') return [...rows].sort((a, b) => b.price - a.price)
    return rows
  }, [category, sort])

  const categories = [
    ['Top Up Games Via ID', searchAssets.categoryPlayerId, '/search'],
    ['Top Up Games Via Login', searchAssets.categoryLogin, '/search?kind=TopUpLogin'],
    ['Voucher Game', searchAssets.categoryItems, '/search?kind=GameVoucher'],
    ['Joki Game', searchAssets.categoryJoki, '/search?kind=Joki'],
    ['Game Accounts', searchAssets.categoryAccounts, '/game-accounts'],
    ['Merchandise', searchAssets.categoryMerchandise, '/merchandise'],
  ]

  return (
    <div className="physical-shell">
      <Navbar />
      <main className="physical-catalog">
        <div className="physical-catalog-layout">
          <aside className="physical-catalog-sidebar">
            <h2>Categories</h2>
            <nav>
              {categories.map(([label, icon, href]) => (
                <a className={label === 'Merchandise' ? 'is-active' : ''} href={href} key={label}>
                  <span><img src={icon} alt="" /></span>
                  <strong>{label}</strong>
                  {label === 'Merchandise' && <i aria-hidden="true" />}
                </a>
              ))}
            </nav>
            <a className="physical-catalog-help" href="/order-status">
              <strong>Need Help?</strong>
              <span>Chat with our support team.</span>
            </a>
          </aside>

          <section className="physical-catalog-content">
            <header className="physical-catalog__heading">
              <div>
                <h1>Merchandise</h1>
                <p>Jerseys and fan gear for every match day.</p>
              </div>
              <span>{PRODUCTS.length} products</span>
            </header>

            <div className="physical-catalog__toolbar">
              <div className="physical-filter-pills">
                {['All', 'Jersey', 'Keychain', 'Fan Gear'].map((item) => (
                  <button className={category === item ? 'is-active' : ''} type="button" onClick={() => setCategory(item)} key={item}>{item}</button>
                ))}
              </div>
              <label className="physical-sort">
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option>Sort: Newest</option>
                  <option>Sort: Price Low</option>
                  <option>Sort: Price High</option>
                </select>
              </label>
            </div>

            <div className="physical-catalog__context">
              <strong>{category === 'All' ? 'All products' : category}</strong>
              <span>•</span>
              <span>Variant availability is shown on each product page</span>
            </div>

            <div className="physical-product-grid">
              {visible.map((product) => <ProductCard product={product} key={product.slug} />)}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

const jerseyGallery = [
  { src: jerseyMain, alt: 'Zetruv Gaming Jersey — product view', position: 'center center', scale: 1 },
  { src: jerseyCard, alt: 'Zetruv Gaming Jersey — model preview', position: 'center center', scale: 1 },
  { src: jerseyMain, alt: 'Zetruv Gaming Jersey — fabric detail', position: 'center 40%', scale: 1.65 },
  { src: jerseyCard, alt: 'Zetruv Gaming Jersey — jersey detail', position: 'center 30%', scale: 1.55 },
]

function JerseyProductPage() {
  const [color, setColor] = useState('Black')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const favoriteId = 'merchandise:zetruv-gaming-jersey'
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => subscribeFavorites(() => setSaved(isFavorite(favoriteId))), [])

  const addToCart = () => {
    if (!size) return
    writePhysicalCart({
      slug: 'zetruv-gaming-jersey',
      name: 'Zetruv Gaming Jersey',
      color,
      size,
      qty,
      price: 249000,
      image: jerseyCard,
    })
    window.location.href = '/cart?flow=physical'
  }

  return (
    <div className="physical-shell">
      <Navbar />
      <main className="physical-pdp">
        <div className="physical-breadcrumb">Merchandise <span>/</span> Jersey <span>/</span> Zetruv Gaming Jersey</div>
        <div className="physical-pdp__main">
          <section className="physical-gallery">
            <div className="physical-gallery__thumbs">
              {jerseyGallery.map((item, index) => <button
                className={activeImage === index ? 'is-active' : ''}
                type="button"
                key={index}
                aria-label={item.alt}
                aria-pressed={activeImage === index}
                onClick={() => setActiveImage(index)}
              ><img src={item.src} alt="" style={{ objectPosition: item.position, transform: `scale(${item.scale})` }} /></button>)}
            </div>
            <div className="physical-gallery__primary"><img
              key={activeImage}
              src={jerseyGallery[activeImage].src}
              alt={jerseyGallery[activeImage].alt}
              style={{ objectPosition: jerseyGallery[activeImage].position, transform: `scale(${jerseyGallery[activeImage].scale})` }}
            /></div>
          </section>

          <section className="physical-purchase-panel">
            <div className="physical-purchase-panel__top">
              <span className="physical-badge">JERSEY</span>
              <span className="physical-stock physical-stock--ok">18 in stock</span>
            </div>
            <h1>Zetruv Gaming Jersey</h1>
            <div className="physical-rating-line"><strong>★ 4.9</strong><span>128 reviews</span><i>•</i><span>128 sold</span></div>
            <strong className="physical-pdp__price">Rp249.000</strong>
            <hr />

            <div className="physical-option-heading"><strong>Color · {color}</strong><span>Choose color</span></div>
            <div className="physical-color-options">
              {['Black','Navy'].map((item) => (
                <button className={color === item ? 'is-active' : ''} type="button" onClick={() => setColor(item)} key={item}>
                  <i className={`is-${item.toLowerCase()}`} />{item}
                </button>
              ))}
            </div>

            <div className="physical-option-heading physical-option-heading--size"><strong>Ukuran · {size || 'Belum dipilih'}</strong><a href="#size-guide">Panduan ukuran</a></div>
            <div className="physical-size-options">
              {['S','M','L','XL','XXL'].map((item) => (
                <button className={size === item ? 'is-active' : ''} type="button" aria-pressed={size === item} disabled={item === 'XXL'} title={item === 'XXL' ? 'Ukuran ini tidak tersedia' : `Pilih ukuran ${item}`} onClick={() => setSize(item)} key={item}>{item}</button>
              ))}
            </div>

            <div className="physical-qty-save">
              <div className="physical-qty">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((value) => Math.min(9, value + 1))}>+</button>
              </div>
              <button
                className={saved ? 'physical-save is-saved' : 'physical-save'}
                type="button"
                aria-pressed={saved}
                aria-label={saved ? 'Hapus dari Favorit' : 'Tambahkan ke Favorit'}
                onClick={() => setSaved(toggleFavorite({
                  id: favoriteId,
                  name: 'Zetruv Gaming Jersey',
                  type: 'Merchandise',
                  price: rupiah(249000),
                  href: '/merchandise/zetruv-gaming-jersey',
                  image: jerseyCard,
                  code: 'JRSY',
                }))}
              ><span>{saved ? '♥' : '♡'}</span> {saved ? 'Tersimpan' : 'Favorit'}</button>
            </div>

            <div className="physical-shipping-estimate" role="note"><strong>Ongkir & estimasi belum tersedia</strong><span>Biaya dan waktu kirim harus dihitung berdasarkan alamat dan layanan logistik yang terverifikasi. Belum ada estimasi resmi untuk ditampilkan.</span></div>
            <PhysicalButton className="physical-add-cart" onClick={addToCart} disabled={!size}>{size ? 'Tambah ke Keranjang' : 'Pilih Ukuran Dulu'}</PhysicalButton>
          </section>
        </div>

        <div className="physical-product-info">
          <section><strong>Description</strong><p>Lightweight dry-fit fabric designed for everyday wear.</p></section>
          <section id="size-guide"><strong>Panduan ukuran</strong><p>Pilih ukuran S, M, L, atau XL di atas. Tabel ukuran resmi (lingkar dada dan panjang baju) belum tersedia, jadi jangan mengandalkan perkiraan. Konfirmasi ukuran dengan admin sebelum membeli.</p></section>
          <section><strong>Shipping</strong><p>Ships from Zetruv’s origin address via supported RajaOngkir services.</p></section>
        </div>
      </main>
    </div>
  )
}


export function PhysicalProductPage({ slug = 'zetruv-gaming-jersey' }) {
  if (slug === 'zetruv-gaming-jersey') return <JerseyProductPage />
  return <PhysicalAccessoryProductPage slug={slug} />
}

function PhysicalAccessoryProductPage({ slug }) {
  const product = PRODUCTS.find((item) => item.slug === slug)
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const favoriteId = `merchandise:${slug}`
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))
  useEffect(() => subscribeFavorites(() => setSaved(isFavorite(favoriteId))), [favoriteId])

  if (!product) {
    return <div className="physical-shell"><Navbar /><main className="physical-pdp"><h1>Produk tidak ditemukan</h1><a href="/merchandise">Kembali ke Merchandise</a></main></div>
  }

  const isJersey = product.category === 'Jersey'
  const selectedSize = isJersey ? size : 'One Size'
  const gallery = [
    { src: product.image, zoom: 1, position: 'center center' },
    { src: product.image, zoom: 1.6, position: 'center 45%' },
  ]

  function addToCart() {
    if (isJersey && !size) return
    writePhysicalCart({
      slug: product.slug,
      name: product.name,
      category: product.category,
      color: product.category === 'Keychain' ? 'Navy' : 'Black',
      size: selectedSize,
      qty,
      price: product.price,
      image: product.image,
    })
    window.location.href = '/cart?flow=physical'
  }

  return <div className="physical-shell">
    <Navbar />
    <main className="physical-pdp">
      <div className="physical-breadcrumb"><a href="/merchandise">Merchandise</a> <span>/</span> {product.category} <span>/</span> {product.name}</div>
      <div className="physical-pdp__main">
        <section className="physical-gallery">
          <div className="physical-gallery__thumbs">
            {gallery.map((image, index) => <button
              type="button"
              key={index}
              className={index === selectedImage ? 'is-active' : ''}
              aria-label={`Lihat gambar ${index + 1}`}
              aria-pressed={selectedImage === index}
              onClick={() => setSelectedImage(index)}
            ><img src={image.src} alt="" style={{ transform: `scale(${image.zoom})`, objectPosition: image.position }} /></button>)}
          </div>
          <div className="physical-gallery__primary">
            <img key={selectedImage} src={gallery[selectedImage].src} alt={product.name} style={{ transform: `scale(${gallery[selectedImage].zoom})`, objectPosition: gallery[selectedImage].position }} />
          </div>
        </section>
        <section className="physical-purchase-panel">
          <div className="physical-purchase-panel__top">
            <span className="physical-badge">{product.badge}</span>
            <span className={`physical-stock physical-stock--${product.stockTone}`}>{product.stock}</span>
          </div>
          <h1>{product.name}</h1>
          <div className="physical-rating-line"><strong>★ {product.rating}</strong><span>{product.sold} sold</span></div>
          <strong className="physical-pdp__price">{rupiah(product.price)}</strong>
          <hr />
          <div className="physical-option-heading"><strong>Variant</strong><span>{product.meta}</span></div>
          {isJersey ? <>
            <div className="physical-option-heading physical-option-heading--size"><strong>Ukuran · {size || 'Belum dipilih'}</strong><a href="#size-guide">Panduan ukuran</a></div>
            <div className="physical-size-options">{['S','M','L','XL','XXL'].map((value) =>
              <button type="button" key={value} className={size === value ? 'is-active' : ''} aria-pressed={size === value} onClick={() => setSize(value)}>{value}</button>)}
            </div>
          </> : <p className="physical-accessory-description">One size · {product.meta}. Produk fisik dikirim ke alamat yang dipilih pada checkout.</p>}
          <div className="physical-qty-save">
            <div className="physical-qty">
              <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((v) => Math.min(9, v + 1))}>+</button>
            </div>
            <button type="button" className={saved ? 'physical-save is-saved' : 'physical-save'}
              onClick={() => setSaved(toggleFavorite({
                id: favoriteId, name: product.name, type: 'Merchandise', price: rupiah(product.price),
                href: `/merchandise/${product.slug}`, image: product.image,
              }))}>{saved ? '♥ Tersimpan' : '♡ Favorit'}</button>
          </div>
          <div className="physical-shipping-estimate" role="note"><strong>Ongkir belum dihitung</strong><span>Biaya dan estimasi kirim hanya dapat ditentukan dari layanan logistik yang aktif dan alamat pengiriman.</span></div>
          <PhysicalButton className="physical-add-cart" onClick={addToCart} disabled={isJersey && !size}>
            {isJersey && !size ? 'Pilih Ukuran Dulu' : 'Tambah ke Keranjang'}
          </PhysicalButton>
        </section>
      </div>
      <div className="physical-product-info">
        <section><strong>Description</strong><p>{product.name} · {product.meta}</p></section>
        <section id="size-guide"><strong>{isJersey ? 'Panduan ukuran' : 'Detail produk'}</strong><p>{isJersey ? 'Tabel ukuran resmi belum tersedia. Konfirmasikan lingkar dada dan panjang baju dengan admin sebelum membeli.' : `${product.category} · ${product.meta}.`}</p></section>
        <section><strong>Shipping</strong><p>Shipping rates appear at checkout.</p></section>
      </div>
    </main>
  </div>
}

export function PhysicalCartPage() {
  const [item, setItem] = useState(() => readPhysicalCart())
  const [authMode, setAuthMode] = useState(null)

  const updateQty = (qty) => {
    const next = { ...item, qty: Math.max(1, Math.min(9, qty)) }
    setItem(next)
    writePhysicalCart(next)
  }

  const continueCheckout = () => {
    const authed = Boolean(readCustomerSession())
    if (authed) {
      window.location.href = '/checkout?flow=physical'
      return
    }
    setAuthMode('login')
  }

  return (
    <div className="physical-shell">
      <Navbar />
      <main className="physical-cart">
        <header className="physical-cart__heading">
          <div><h1>Merchandise Cart</h1><p>{item ? '1 physical item' : '0 physical items'}</p></div>
          <a href="/merchandise">Continue shopping</a>
        </header>
        <div className="physical-cart-notice"><strong>INFO</strong><span>Digital products and merchandise cannot be combined in one cart or transaction.</span></div>

        <div className="physical-cart-layout">
          <div className="physical-cart-left">
            {item ? (
              <article className="physical-cart-item">
                <img src={item.image || jerseyCard} alt="" />
                <div className="physical-cart-item__copy">
                  <span className="physical-badge">{item.category?.toUpperCase() || 'MERCHANDISE'}</span>
                  <h2>{item.name}</h2>
                  <p>{item.color} · {item.size === 'One Size' ? 'One Size' : `Size ${item.size}`}</p>
                  <strong className="physical-stock physical-stock--ok">In stock</strong>
                  <div><a href={`/merchandise/${encodeURIComponent(item.slug)}`}>Edit variant</a><button type="button" onClick={() => { setItem(null); window.sessionStorage.removeItem(PHYSICAL_CART_KEY) }}>Remove</button></div>
                </div>
                <div className="physical-cart-item__price">
                  <strong>{rupiah(item.price)}</strong>
                  <div className="physical-qty"><button type="button" onClick={() => updateQty(item.qty - 1)}>−</button><span>{item.qty}</span><button type="button" onClick={() => updateQty(item.qty + 1)}>+</button></div>
                </div>
              </article>
            ) : (
              <div className="physical-cart-empty"><strong>Your merchandise cart is empty</strong><a href="/merchandise">Continue shopping</a></div>
            )}

            <div className="physical-cart-assurance">
              <strong>Shipping is calculated at checkout</strong>
              <p>Choose your address at checkout to see available services, ETA, and final cost.</p>
              <p>You can still update quantity or variant before checkout.</p>
            </div>
          </div>

          <aside className="physical-cart-summary">
            <h2>Order Summary</h2>
            <div><span>Subtotal</span><strong>{rupiah(item ? item.price * item.qty : 0)}</strong></div>
            <div><span>Shipping</span><span>Calculated at checkout</span></div>
            <hr />
            <div className="physical-cart-summary__total"><strong>Estimated total</strong><b>{rupiah(item ? item.price * item.qty : 0)}</b></div>
            <PhysicalButton onClick={continueCheckout} disabled={!item}>{readCustomerSession() ? 'Lanjut ke Checkout' : 'Masuk untuk Checkout'}</PhysicalButton>
            <div className="physical-login-note"><strong>{readCustomerSession() ? 'Periksa pesananmu' : 'Login diperlukan untuk checkout'}</strong><span>{readCustomerSession() ? 'Ongkir belum termasuk subtotal.' : 'Login dahulu; keranjangmu tetap tersimpan selama sesi browser ini.'}</span></div>
          </aside>
        </div>
      </main>
      {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={(response) => { setCustomerSession(response); window.location.href = '/checkout?flow=physical' }} />}
    </div>
  )
}

function PhysicalFlowUnavailable({ title, description }) {
  const item = readPhysicalCart()
  return <div className="physical-shell">
    <Navbar variant="account" />
    <main className="physical-checkout">
      <header><h1>{title}</h1><p>{description}</p></header>
      <section className="physical-flow-unavailable" role="status">
        <strong>Belum bisa diproses</strong>
        <p>Pengiriman, voucher, dan pembayaran merchandise belum terhubung ke layanan transaksi yang memvalidasi alamat, ongkir, stok, dan pembayaran. Tidak ada pesanan atau tagihan yang dibuat.</p>
        {item && <div className="physical-flow-unavailable__item">
          <img src={item.image || jerseyCard} alt="" />
          <div><strong>{item.name}</strong><span>{item.color} · {item.size} · {item.qty} item</span><span>Subtotal keranjang: {rupiah(item.price * item.qty)} (belum termasuk ongkir)</span></div>
        </div>}
        <a className="physical-btn" href={item ? '/cart?flow=physical' : '/merchandise'}>{item ? 'Kembali ke Keranjang' : 'Lihat Merchandise'}</a>
        <a className="physical-btn physical-btn--outline" href="/order-status">Cek Pesanan Digital</a>
      </section>
    </main>
  </div>
}

export function PhysicalCheckoutPage() {
  return <PhysicalFlowUnavailable title="Checkout Merchandise" description="Checkout akan tersedia setelah alamat dan tarif pengiriman resmi terintegrasi." />
}

export function PhysicalPaymentPage() {
  return <PhysicalFlowUnavailable title="Pembayaran Merchandise" description="Status pembayaran hanya dapat dikonfirmasi dari transaksi backend yang valid." />
}

export function PhysicalOrderTrackingPage() {
  return <PhysicalFlowUnavailable title="Lacak Merchandise" description="Nomor resi dan status pengiriman akan berasal dari pesanan yang benar-benar diproses." />
}
