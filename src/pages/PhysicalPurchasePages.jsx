import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
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

function defaultCart() {
  return {
    slug: 'zetruv-gaming-jersey',
    name: 'Zetruv Gaming Jersey',
    color: 'Black',
    size: 'L',
    qty: 1,
    price: 249000,
    image: jerseyCard,
  }
}

function PhysicalButton({ children, tone = 'primary', onClick, href, disabled = false, className = '' }) {
  const cn = `physical-btn physical-btn--${tone} ${className}`.trim()
  if (href && !disabled) return <a className={cn} href={href}>{children}</a>
  return <button className={cn} type="button" onClick={onClick} disabled={disabled}>{children}</button>
}

function ProductCard({ product }) {
  return (
    <a className="physical-product-card" href={`/merchandise/${encodeURIComponent(product.slug)}`}>
      <div className="physical-product-card__image">
        <img src={product.image} alt="" />
      </div>
      <div className="physical-product-card__meta">
        <span className="physical-badge">{product.badge}</span>
        <span className={`physical-stock physical-stock--${product.stockTone}`}>{product.stock}</span>
      </div>
      <strong className="physical-product-card__name">{product.name}</strong>
      <span className="physical-product-card__variant">{product.meta}</span>
      <strong className="physical-product-card__price">{rupiah(product.price)}</strong>
      <div className="physical-product-card__foot">
        <span>{product.sold} sold</span>
        <span>{product.rating} <b>★</b></span>
      </div>
    </a>
  )
}

export function PhysicalCatalogPage() {
  const [category, setCategory] = useState('Jersey')
  const [sort, setSort] = useState('Sort: Newest')

  const visible = useMemo(() => {
    const rows = category === 'All' || category === 'Jersey' ? PRODUCTS : PRODUCTS.filter((item) => item.category === category)
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
              <span>24 products</span>
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

export function PhysicalProductPage() {
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

            <div className="physical-option-heading physical-option-heading--size"><strong>Size · {size || 'Select a size'}</strong><a href="#size-guide">Size guide</a></div>
            <div className="physical-size-options">
              {['S','M','L','XL','XXL'].map((item) => (
                <button className={size === item ? 'is-active' : ''} type="button" disabled={item === 'XXL'} onClick={() => setSize(item)} key={item}>{item}</button>
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

            <div className="physical-shipping-estimate"><strong>Shipping from Rp18,000 · 2–4 days</strong><span>Final shipping cost is calculated from your address and selected service at checkout.</span></div>
            <PhysicalButton className="physical-add-cart" onClick={addToCart} disabled={!size}>{size ? 'Add to Cart' : 'Select a size'}</PhysicalButton>
          </section>
        </div>

        <div className="physical-product-info">
          <section><strong>Description</strong><p>Lightweight dry-fit fabric designed for everyday wear.</p></section>
          <section><strong>Details & Care</strong><p>Gentle wash. Size and color follow the selected variant.</p></section>
          <section><strong>Shipping</strong><p>Ships from Zetruv’s origin address via supported RajaOngkir services.</p></section>
        </div>
      </main>
    </div>
  )
}

export function PhysicalCartPage() {
  const [item, setItem] = useState(() => readPhysicalCart() || defaultCart())
  const [authMode, setAuthMode] = useState(null)

  const updateQty = (qty) => {
    const next = { ...item, qty: Math.max(1, Math.min(9, qty)) }
    setItem(next)
    writePhysicalCart(next)
  }

  const continueCheckout = () => {
    const authed = typeof window !== 'undefined' && window.sessionStorage.getItem('zetruv-auth-preview') === '1'
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
                  <span className="physical-badge">JERSEY</span>
                  <h2>{item.name}</h2>
                  <p>{item.color} · Size {item.size}</p>
                  <strong className="physical-stock physical-stock--ok">In stock</strong>
                  <div><a href="/merchandise/zetruv-gaming-jersey">Edit variant</a><button type="button" onClick={() => { setItem(null); window.sessionStorage.removeItem(PHYSICAL_CART_KEY) }}>Remove</button></div>
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
            <PhysicalButton onClick={continueCheckout} disabled={!item}>Continue to Checkout</PhysicalButton>
            <div className="physical-login-note"><strong>Sign in required before checkout</strong><span>After sign-in, you’ll return to merchandise checkout with your cart saved.</span></div>
          </aside>
        </div>
      </main>
      {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={() => { window.sessionStorage.setItem('zetruv-auth-preview','1'); window.location.href = '/checkout?flow=physical' }} />}
    </div>
  )
}

function CheckoutStateCard({ tone = 'neutral', title, description, action, onAction }) {
  return (
    <div className={`physical-checkout-state physical-checkout-state--${tone}`}>
      <strong>{title}</strong>
      <span>{description}</span>
      {action && <button type="button" onClick={onAction}>{action}</button>}
    </div>
  )
}

function ShippingServices({ state, onStateChange, selected, onSelect }) {
  if (state === 'address-required') {
    return <CheckoutStateCard title="Address required" description="Do not request rates until a shipping address exists." action="Add shipping address" onAction={() => onStateChange('loading')} />
  }
  if (state === 'loading') {
    return (
      <div className="physical-checkout-state physical-checkout-state--loading">
        <strong>Loading rates</strong>
        <span>Disable service selection while rates are loading.</span>
        <div className="physical-rate-skeleton"><i /><i /><i /></div>
        <button type="button" onClick={() => onStateChange('rates')}>Show available rates</button>
      </div>
    )
  }
  if (state === 'no-service') {
    return <CheckoutStateCard tone="warning" title="No service available" description="No supported service for the selected address/cart." action="Change address" onAction={() => onStateChange('rates')} />
  }
  if (state === 'unavailable') {
    return <CheckoutStateCard tone="error" title="Shipping unavailable" description="Temporary RajaOngkir/API failure. Your checkout data is preserved." action="Retry rates" onAction={() => onStateChange('loading')} />
  }

  const services = [
    { id: 'jne', name: 'JNE Regular', eta: '2–4 days', price: 18000 },
    { id: 'jnt', name: 'J&T EZ', eta: '2–3 days', price: 20000 },
    { id: 'sicepat', name: 'SiCepat BEST', eta: '1–2 days', price: 29000 },
  ]

  return (
    <div className="physical-shipping-services">
      {services.map((service) => (
        <button className={selected === service.id ? 'is-active' : ''} type="button" onClick={() => onSelect(service.id)} key={service.id}>
          <strong>{service.name}</strong><span>{service.eta}</span><b>{rupiah(service.price)}</b>
        </button>
      ))}
    </div>
  )
}

function VoucherArea({ state, setState, value, setValue }) {
  const apply = () => {
    const normalized = value.trim().toUpperCase()
    if (normalized === 'SAVE25') setState('discount')
    else if (normalized === 'FREESHIP') setState('free-shipping')
    else if (normalized === 'EXPIRED') setState('invalid')
    else if (normalized) setState('ineligible')
  }

  if (state === 'discount') return <CheckoutStateCard tone="success" title="Applied · Rp25,000 off" description="SAVE25 is applied to this order." action="Remove" onAction={() => { setState('default'); setValue('') }} />
  if (state === 'free-shipping') return <CheckoutStateCard tone="success" title="Applied · Free shipping" description="Free shipping applied" action="Remove" onAction={() => { setState('default'); setValue('') }} />

  return (
    <>
      <div className="physical-voucher-input">
        <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Enter voucher code" />
        <button type="button" onClick={apply}>Apply</button>
      </div>
      {state === 'invalid' && <p className="physical-voucher-message is-error">Voucher is invalid or expired</p>}
      {state === 'ineligible' && <p className="physical-voucher-message is-warning">Voucher is not eligible</p>}
    </>
  )
}

export function PhysicalCheckoutPage() {
  const params = new URLSearchParams(window.location.search)
  const [shippingState, setShippingState] = useState(params.get('shipping') || 'rates')
  const [voucherState, setVoucherState] = useState(params.get('voucher') || 'default')
  const [voucherCode, setVoucherCode] = useState(voucherState === 'discount' ? 'SAVE25' : voucherState === 'free-shipping' ? 'FREESHIP' : '')
  const [shippingService, setShippingService] = useState('jne')
  const item = readPhysicalCart() || defaultCart()

  const shippingPrice = voucherState === 'free-shipping' ? 0 : shippingService === 'jnt' ? 20000 : shippingService === 'sicepat' ? 29000 : 18000
  const discount = voucherState === 'discount' ? 25000 : 0
  const subtotal = item.price * item.qty
  const total = subtotal + shippingPrice - discount
  const ratesReady = shippingState === 'rates'

  return (
    <div className="physical-shell">
      <Navbar variant="account" />
      <main className="physical-checkout">
        <header><h1>Checkout Merchandise</h1><p>Review your contact, address, shipping, voucher, and payment details before continuing.</p></header>
        <div className="physical-checkout-layout">
          <section className="physical-checkout-form">
            <div className="physical-section-heading"><h2>Contact Information</h2><button type="button">Prefilled from profile · Edit</button></div>
            <div className="physical-contact-grid">
              <div><small>WhatsApp*</small><strong>+62 812 3456 7890</strong></div>
              <div><small>Account email</small><strong>user@example.com</strong></div>
            </div>

            <div className="physical-section-heading physical-section-heading--address"><h2>Shipping Address</h2><button type="button" onClick={() => setShippingState('address-required')}>Change</button></div>
            {shippingState !== 'address-required' && (
              <div className="physical-address-card"><strong>Home — Arkandea</strong><span>Jl. Contoh No. 12, Jakarta Selatan, DKI Jakarta 12345</span><span>+62 812 3456 7890</span></div>
            )}

            <div className="physical-section-heading physical-section-heading--shipping"><h2>Shipping Service</h2><span>RajaOngkir</span></div>
            <ShippingServices state={shippingState} onStateChange={setShippingState} selected={shippingService} onSelect={setShippingService} />

            <div className="physical-section-heading physical-section-heading--voucher"><h2>Voucher</h2><span>fixed discount / free shipping</span></div>
            <VoucherArea state={voucherState} setState={setVoucherState} value={voucherCode} setValue={setVoucherCode} />
            <p className="physical-whatsapp-note">Order updates will be sent to this WhatsApp number.</p>
          </section>

          <aside className="physical-checkout-summary">
            <h2>Order Summary</h2>
            <div className="physical-checkout-product"><img src={item.image || jerseyCard} alt="" /><div><strong>{item.name}</strong><span>{item.color} · Size {item.size} · Qty {item.qty}</span><b>{rupiah(subtotal)}</b></div></div>
            <div className="physical-section-heading physical-section-heading--payment"><h3>Payment Method</h3><button type="button">Change</button></div>
            <div className="physical-payment-method"><strong>QRIS</strong><span>Processed by Xendit</span></div>
            <dl className="physical-checkout-prices">
              <div><dt>Subtotal</dt><dd>{rupiah(subtotal)}</dd></div>
              <div><dt>Shipping</dt><dd>{ratesReady ? rupiah(shippingPrice) : '—'}</dd></div>
              <div><dt>Voucher</dt><dd>{discount ? `- ${rupiah(discount)}` : voucherState === 'free-shipping' ? 'Free shipping' : 'Rp0'}</dd></div>
            </dl>
            <hr />
            <div className="physical-checkout-total"><strong>Total</strong><b>{ratesReady ? rupiah(total) : '—'}</b></div>
            <PhysicalButton href="/payment?flow=physical&state=pending" disabled={!ratesReady}>Continue to QRIS Payment</PhysicalButton>
            <p className="physical-xendit-note">You’ll continue to Xendit to complete your QRIS payment, then return here to see the latest status.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}

const PAYMENT_STATES = {
  pending: {
    title: 'Payment Pending',
    subtitle: 'Complete your QRIS payment before the payment window expires.',
    badge: 'PENDING',
    tone: 'pending',
    panelTitle: 'QRIS via Xendit',
    panelDesc: 'Your payment session is ready.',
    label: 'Payment expires in',
    status: '14:32',
    statusTone: 'pending',
    helper: 'If the payment window expires, create a new payment session from this order.',
    primary: 'Open QRIS Payment',
    primaryHref: '/payment?flow=physical&state=success',
    secondary: 'Change payment method',
    secondaryHref: '/checkout?flow=physical',
    foot: 'After payment, return to this page or refresh to see the latest payment status.',
  },
  success: {
    title: 'Payment Successful',
    subtitle: 'Your payment has been confirmed. Your order is ready to move forward.',
    badge: 'SUCCESS',
    tone: 'success',
    panelTitle: 'Payment received',
    panelDesc: 'QRIS payment confirmed by Xendit.',
    label: 'Payment status',
    status: 'Successful',
    statusTone: 'success',
    helper: 'No further payment action is required. Continue to your order details.',
    primary: 'View Order',
    primaryHref: '/order-status?flow=physical&state=shipped',
    secondary: 'Back to Home',
    secondaryHref: '/',
    foot: 'Your order can now continue to fulfillment.',
  },
  failed: {
    title: 'Payment Failed',
    subtitle: 'We couldn’t complete your payment. Your order has not entered fulfillment.',
    badge: 'FAILED',
    tone: 'failed',
    panelTitle: 'Payment unsuccessful',
    panelDesc: 'No successful payment was recorded.',
    label: 'Payment status',
    status: 'Failed',
    statusTone: 'failed',
    helper: 'Try the payment again or choose another available payment method.',
    primary: 'Retry Payment',
    primaryHref: '/payment?flow=physical&state=pending',
    secondary: 'Change payment method',
    secondaryHref: '/checkout?flow=physical',
    foot: 'Your cart and order details remain available while you retry.',
  },
  expired: {
    title: 'Payment Expired',
    subtitle: 'This payment session is no longer active. Create a new payment to continue.',
    badge: 'EXPIRED',
    tone: 'expired',
    panelTitle: 'QRIS session expired',
    panelDesc: 'The previous payment window can no longer be used.',
    label: 'Payment status',
    status: 'Expired',
    statusTone: 'expired',
    helper: 'Create a new payment session from this order, or choose another payment method.',
    primary: 'Create New Payment',
    primaryHref: '/payment?flow=physical&state=pending',
    secondary: 'Change payment method',
    secondaryHref: '/checkout?flow=physical',
    foot: 'Your order details are preserved; only the payment session needs renewal.',
  },
}

export function PhysicalPaymentPage({ state = 'pending' }) {
  const config = PAYMENT_STATES[state] || PAYMENT_STATES.pending
  const item = readPhysicalCart() || defaultCart()
  const subtotal = item.price * item.qty
  return (
    <div className="physical-shell">
      <Navbar variant="account" />
      <main className="physical-payment-page">
        <header className="physical-payment-heading">
          <div><h1>{config.title}</h1><p>{config.subtitle}</p></div>
          <span className={`physical-payment-badge physical-payment-badge--${config.tone}`}>{config.badge}</span>
        </header>

        <div className="physical-payment-layout">
          <section className="physical-payment-summary">
            <h2>Order Summary</h2>
            <div className="physical-payment-order"><span>Order</span><strong>#ZTR-PHY-240901</strong></div>
            <div className="physical-payment-product"><img src={item.image || jerseyCard} alt="" /><div><strong>{item.name}</strong><span>{item.color} · Size {item.size} · Qty {item.qty}</span><b>{rupiah(subtotal)}</b></div></div>
            <div className="physical-payment-row"><span>Shipping</span><strong>Rp18.000</strong></div>
            <div className="physical-payment-total"><strong>Total</strong><b>{rupiah(subtotal + 18000)}</b></div>
          </section>

          <section className="physical-payment-action">
            <div className="physical-payment-provider"><strong>{config.panelTitle}</strong><span>{config.panelDesc}</span></div>
            <span className="physical-payment-label">{config.label}</span>
            <strong className={`physical-payment-status physical-payment-status--${config.statusTone}`}>{config.status}</strong>
            {state === 'expired' && <div className="physical-payment-countdown"><span>Countdown</span><strong>00:00</strong></div>}
            <p>{config.helper}</p>
            <PhysicalButton href={config.primaryHref}>{config.primary}</PhysicalButton>
            <PhysicalButton tone="outline" href={config.secondaryHref}>{config.secondary}</PhysicalButton>
            <small>{config.foot}</small>
          </section>
        </div>
      </main>
    </div>
  )
}

const TRACKING_BASE = [
  ['Picked up by courier','1 Sep 2026 · 19:16','Pickup completed and tracking is active.'],
  ['Ready to ship','1 Sep 2026 · 18:02','Shipping label created; package is waiting for pickup.'],
  ['Order processing','1 Sep 2026 · 14:12','Payment confirmed. Your order is being prepared.'],
  ['Order created','1 Sep 2026 · 14:08','Merchandise checkout was created successfully.'],
]

function TrackingHistory({ delivered }) {
  const items = delivered
    ? [['Delivered','Sep 4, 2026 · 15:42','Package delivered to the shipping address.'], ...TRACKING_BASE]
    : [['In transit to destination city','2 Sep 2026 · 08:42','Package has left the Jakarta hub.'], ...TRACKING_BASE]
  return (
    <section className="physical-tracking-history">
      <header><h2>Tracking history</h2><span>via RajaOngkir</span></header>
      <div className="physical-tracking-timeline">
        {items.map((item, index) => (
          <article className={index === 0 && !delivered ? 'is-current' : ''} key={item[0]}>
            <i />
            <div><strong>{item[0]}</strong><p>{item[2]}</p></div>
            <span>{item[1]}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PhysicalOrderTrackingPage({ state = 'shipped' }) {
  const delivered = state === 'delivered'
  const item = readPhysicalCart() || defaultCart()
  const copyTracking = async () => {
    try { await navigator.clipboard.writeText('JNE240901982173') } catch {}
  }

  return (
    <div className="physical-shell">
      <Navbar variant="account" />
      <main className="physical-order-page">
        <header className="physical-order-heading">
          <div><h1>Order Details</h1><p>#ZTR-PHY-240901 · created 1 Sep 2026, 14:08</p></div>
          <div><span className="physical-order-badge is-paid">PAYMENT SUCCESSFUL</span><span className="physical-order-badge is-shipped">{delivered ? 'DELIVERED' : 'SHIPPED'}</span></div>
        </header>

        <section className="physical-tracking-summary">
          <div><small>Courier</small><strong>JNE Regular</strong></div>
          <div><small>Tracking / AWB</small><strong>JNE240901982173</strong></div>
          <div><small>{delivered ? 'Delivered' : 'Estimated delivery'}</small><strong>{delivered ? 'Sep 4, 2026 · 15:42' : '4 Sep 2026'}</strong></div>
          <div className="physical-tracking-summary__actions"><PhysicalButton tone="outline" onClick={copyTracking}>Copy tracking no.</PhysicalButton><PhysicalButton>{delivered ? 'Delivery details' : 'Track package'}</PhysicalButton></div>
        </section>

        <div className="physical-order-layout">
          <TrackingHistory delivered={delivered} />
          <aside className="physical-order-aside">
            <h2>Order</h2>
            <div className="physical-order-product"><img src={item.image || jerseyCard} alt="" /><div><strong>{item.name}</strong><span>{item.color} · Size {item.size} · Qty {item.qty}</span><b>{rupiah(item.price * item.qty)}</b></div></div>
            <h3>Shipping Address</h3>
            <div className="physical-order-address"><strong>Home — Arkandea</strong><span>Jl. Contoh No. 12, Jakarta Selatan, DKI Jakarta 12345</span><span>+62 812 3456 7890</span></div>
            <h3>Summary</h3>
            <dl><div><dt>Subtotal</dt><dd>{rupiah(item.price * item.qty)}</dd></div><div><dt>Shipping</dt><dd>Rp18.000</dd></div><div><dt>Total</dt><dd>{rupiah(item.price * item.qty + 18000)}</dd></div></dl>
            {delivered ? <PhysicalButton href="/order-status?view=merch-review">Write a Review</PhysicalButton> : <PhysicalButton tone="outline" href="#support">Need help? Contact Support</PhysicalButton>}
            {delivered && <p className="physical-review-note">Available after delivery when the transaction is eligible for review.</p>}
          </aside>
        </div>
      </main>
    </div>
  )
}
