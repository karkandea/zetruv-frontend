import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { searchAssets } from '../data/searchAssets'
import { productDetailAssets } from '../data/productDetailAssets'
import voucherSteam from '../assets/special/voucher-steam.png'
import { addCartItem } from '../services/cartService'
import '../styles/special-product.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const SPECIAL_PRODUCTS = {
  voucher: {
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
  },
  joki: {
    'mobile-legends-rank-push': {
      id: 'joki-mobile-legends',
      name: 'Mobile Legends Rank Push',
      publisher: 'Zetruv Joki',
      kind: 'Joki',
      fulfillmentMethod: 'JOKI_MANUAL',
      image: searchAssets.mobileLegends,
      hero: productDetailAssets.heroBackground,
      badge: 'JOKI GAME',
      description: 'Pilih target rank. Data akun diminta secara aman saat checkout.',
      variants: [
        { id: 'ml-5star', name: 'Mythic +5★', price: 99000 },
        { id: 'ml-10star', name: 'Mythic +10★', price: 179000 },
        { id: 'ml-15star', name: 'Mythic +15★', price: 259000 },
        { id: 'ml-20star', name: 'Mythic +20★', price: 339000 },
      ],
    },
    'valorant-rank-boost': {
      id: 'joki-valorant',
      name: 'Valorant Rank Boost',
      publisher: 'Zetruv Joki',
      kind: 'Joki',
      fulfillmentMethod: 'JOKI_MANUAL',
      image: searchAssets.valorant,
      hero: searchAssets.valorant,
      badge: 'JOKI GAME',
      description: 'Rank boost dengan progress update melalui status pesanan.',
      variants: [
        { id: 'val-1', name: '1 Division', price: 145000 },
        { id: 'val-2', name: '2 Divisions', price: 269000 },
        { id: 'val-3', name: '3 Divisions', price: 389000 },
      ],
    },
    'genshin-daily-abyss': {
      id: 'joki-genshin-daily-abyss',
      name: 'Genshin Daily & Abyss',
      publisher: 'Zetruv Joki',
      kind: 'Joki',
      fulfillmentMethod: 'JOKI_MANUAL',
      image: searchAssets.genshinImpact,
      hero: searchAssets.genshinImpact,
      badge: 'JOKI GAME',
      description: 'Layanan bantuan Daily Commission dan Spiral Abyss Genshin Impact; pilih layanan sesuai kebutuhan.',
      variants: [
        { id: 'genshin-daily-3', name: 'Daily Commission · 3 hari', price: 29000 },
        { id: 'genshin-daily-7', name: 'Daily Commission · 7 hari', price: 59000 },
        { id: 'genshin-abyss', name: 'Spiral Abyss · 1 clear', price: 99000 },
      ],
    },
  },
}

function resolveProduct(type, slug) {
  const group = SPECIAL_PRODUCTS[type] || {}
  return group[slug] || null
}

export default function SpecialProductPage({ type = 'voucher', slug }) {
  const product = resolveProduct(type, slug)
  const [selectedId, setSelectedId] = useState(product?.variants[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const selected = useMemo(() => product?.variants.find((item) => item.id === selectedId) || product?.variants[0], [product, selectedId])
  const serviceFee = 2000
  const subtotal = (selected?.price || 0) * quantity

  function add(goToCart) {
    if (!product || !selected) return
    addCartItem({
      accountKey: 'checkout-required',
      productId: product.id,
      productSlug: slug,
      productName: product.name,
      productKind: product.kind,
      fulfillmentMethod: product.fulfillmentMethod,
      thumbnailUrl: product.image,
      gameName: product.name,
      variantId: selected.id,
      variantName: selected.name,
      unitPrice: selected.price,
      regularPrice: selected.price,
      quantity,
      maxQuantity: 9,
    })
    if (goToCart) window.location.href = '/cart'
    else setNotice('Produk ditambahkan ke keranjang.')
  }

  if (!product || !selected) return (
    <div className="special-product-shell"><Navbar /><main className="special-product-page" style={{textAlign: 'center', minHeight: '65vh', paddingTop: 180}}>
      <h1>Produk tidak ditemukan</h1><p>Katalog produk ini belum tersedia.</p><a href="/search">Kembali ke katalog</a>
    </main></div>
  )

  return (
    <div className="special-product-shell">
      <Navbar variant="catalog" />
      <main className="special-product-page">
        <section className={`special-product-hero special-product-hero--${type}`}>
          <img className="special-product-hero__background" src={product.hero || product.image} alt="" />
          <div className="special-product-hero__scrim" />
          <div className="special-product-hero__content">
            <div className="special-product-hero__visual"><img src={product.image} alt="" /></div>
            <div className="special-product-hero__copy">
              <span>{product.badge}</span>
              <h1>{product.name}</h1>
              <p>{product.publisher} · 4.9 ★ · Proses aman melalui Zetruv</p>
              <small>{product.description}</small>
            </div>
          </div>
        </section>

        <div className="special-product-layout">
          <section className="special-product-packages">
            <h2>{type === 'joki' ? 'Pilih Paket Joki' : 'Pilih Nominal Voucher'}</h2>
            <p>{type === 'joki' ? 'Target dan credential baru dilengkapi saat checkout.' : 'Kode digital dikirim setelah pembayaran berhasil.'}</p>
            <div className="special-product-grid">
              {product.variants.map((item) => (
                <button className={selectedId === item.id ? 'is-active' : ''} type="button" onClick={() => { setSelectedId(item.id); setQuantity(1) }} key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{rupiah(item.price)}</span>
                </button>
              ))}
            </div>
            <div className="special-product-note"><b>i</b><span>{type === 'joki' ? 'Jangan kirim credential melalui chat. Data akun hanya diminta di checkout.' : 'Pastikan region voucher sesuai dengan akun yang akan digunakan.'}</span></div>
          </section>

          <aside className="special-product-summary">
            <h2>Ringkasan</h2>
            <div className="special-product-selected">
              <div><strong>{selected.name}</strong><span>{rupiah(selected.price)} / item</span></div>
              <div className="special-product-qty"><button onClick={() => setQuantity((v) => Math.max(1, v - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity((v) => Math.min(9, v + 1))}>+</button></div>
            </div>
            <div className="special-summary-row"><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
            <div className="special-summary-row"><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div>
            <hr />
            <div className="special-summary-total"><span>Total</span><strong>{rupiah(subtotal + serviceFee)}</strong></div>
            {notice && <p className="special-product-success">{notice}</p>}
            <button className="special-secondary" type="button" onClick={() => add(false)}>Tambah ke Keranjang</button>
            <button className="special-primary" type="button" onClick={() => add(true)}>Tambah &amp; Lihat Keranjang</button>
          </aside>
        </div>
      </main>
    </div>
  )
}
