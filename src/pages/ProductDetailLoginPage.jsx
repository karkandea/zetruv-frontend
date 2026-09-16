import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { productDetailLoginAssets as media } from '../data/productDetailLoginAssets'
import { getCatalogProduct } from '../services/catalogService'
import { addCartItem } from '../services/cartService'
import '../styles/product-detail-login.css'

const SERVICE_FEE = 2000
const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const fallbackProduct = {
  id: 'genshin-login-preview',
  slug: 'genshin-impact',
  name: 'Genshin Impact',
  kind: 'TopUpLogin',
  fulfillmentMethod: 'MANUAL_LOGIN',
  thumbnailUrl: media.gameCover,
  game: { name: 'Genshin Impact', publisher: 'HoYoverse', imageUrl: media.gameCover },
  variants: [
    { id: '60', name: '60 Genesis Crystals', price: 16500, effectivePrice: 16500, isAvailable: true },
    { id: '300', name: '300+30 Genesis Crystals', price: 81000, effectivePrice: 81000, isAvailable: true },
    { id: '980', name: '980+110 Genesis Crystals', price: 255000, effectivePrice: 255000, isAvailable: true },
    { id: '1980', name: '1980+260 Genesis Crystals', price: 489000, effectivePrice: 489000, isAvailable: true },
    { id: '3280', name: '3280+600 Genesis Crystals', price: 815000, effectivePrice: 815000, isAvailable: true },
    { id: 'welkin', name: 'Blessing of the Welkin Moon', price: 81000, effectivePrice: 81000, isAvailable: true },
  ],
}

function HeroStars() {
  return <span className="login-product-stars" aria-label="4.6 out of 5 stars"><span>★</span><span>★</span><span>★</span><span>★</span><span className="partial">★</span></span>
}

export default function ProductDetailLoginPage({ slug = 'genshin-impact' }) {
  const [product, setProduct] = useState(fallbackProduct)
  const [selectedId, setSelectedId] = useState('980')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    getCatalogProduct(slug).then((data) => {
      if (cancelled) return
      if (data.kind !== 'TopUpLogin') { window.location.replace(`/product/${data.slug}`); return }
      const normalized = { ...fallbackProduct, ...data, variants: data.variants?.length ? data.variants : fallbackProduct.variants }
      setProduct(normalized)
      const preferred = normalized.variants.find((item) => item.isAvailable && /980\s*\+\s*110/i.test(item.name || ''))
      const first = preferred || normalized.variants.find((item) => item.isAvailable) || normalized.variants[0]
      setSelectedId(first?.id || '980')
    }).catch(() => setProduct(fallbackProduct))
    return () => { cancelled = true }
  }, [slug])

  const selected = useMemo(() => product.variants.find((item) => item.id === selectedId) || product.variants[0], [product, selectedId])
  const unitPrice = selected?.effectivePrice ?? selected?.price ?? 0
  const subtotal = unitPrice * quantity
  const total = subtotal + SERVICE_FEE
  const maxQuantity = selected?.stockQuantity ?? 99

  function addToCart(goToCart) {
    if (!selected?.isAvailable) return
    addCartItem({
      accountKey: 'default', productId: product.id, productSlug: product.slug, productName: product.name,
      productKind: product.kind, fulfillmentMethod: 'MANUAL_LOGIN', requiresGameAccountValidation: false,
      thumbnailUrl: media.gameCover, gameName: product.game?.name || 'Genshin Impact', variantId: selected.id,
      variantName: selected.name, unitPrice, regularPrice: selected.price ?? unitPrice, quantity, maxQuantity,
    })
    if (goToCart) window.location.href = '/cart'
    else setNotice('Produk ditambahkan ke keranjang.')
  }

  return <div className="login-product-shell"><Navbar variant="loginCatalog"/><main className="login-product-page">
    <section className="login-product-hero">
      <img className="login-product-hero__background" src={media.heroBackground} alt="" />
      <div className="login-product-hero__shade" />
      <div className="login-product-container login-product-hero__content">
        <div className="login-product-cover"><img src={media.gameCover} alt="Genshin Impact" /></div>
        <div className="login-product-hero__copy"><div className="login-product-title-block"><h1>Genshin Impact</h1><div className="login-product-rating-line"><strong>HoYoverse</strong><span className="login-product-rating-group"><b>4,6</b><HeroStars/><em>(2rb)</em></span></div></div><div className="login-product-benefits"><span>⚡ Proses Cepat</span><span>▣ Dukungan Chat 24/7</span><span>◎ Global Region</span></div></div>
      </div>
    </section>
    <div className="login-product-body"><div className="login-product-container login-product-layout">
      <section className="login-package-panel"><h2>Pilih Paket</h2><p className="login-package-description">Pilih paket dulu. Data login game baru diminta setelah kamu masuk ke checkout.</p><div className="login-package-grid">{product.variants.slice(0,6).map((item)=>{const active=selectedId===item.id;return <button type="button" key={item.id} className={`login-package-card${active?' active':''}`} onClick={()=>{setSelectedId(item.id);setQuantity(1);setNotice('')}} disabled={!item.isAvailable}><span className="login-package-card__icon"><img src={media.genesisCrystal} alt=""/></span><span className="login-package-card__copy"><strong>{item.name}</strong><small>{rupiah(item.effectivePrice ?? item.price)}</small></span></button>})}</div><div className="login-product-info-banner"><span className="login-info-dot">i</span><p>Credential akun hanya diminta saat checkout dan tidak disimpan di Product Detail atau Cart.</p></div></section>
      <aside className="login-product-summary"><h2>Ringkasan</h2><div className="login-selected-package"><div><strong>{selected.name}</strong><span>{rupiah(unitPrice)} / item</span></div><div className="login-quantity-stepper"><button onClick={()=>setQuantity(v=>Math.max(1,v-1))}>−</button><strong>{quantity}</strong><button onClick={()=>setQuantity(v=>Math.min(maxQuantity,v+1))}>＋</button></div></div><div className="login-summary-row"><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div><div className="login-summary-row"><span>Biaya layanan</span><strong>{rupiah(SERVICE_FEE)}</strong></div><div className="login-summary-divider"/><div className="login-summary-total"><span>Total</span><strong>{rupiah(total)}</strong></div>{notice&&<p className="pdp-action-message is-success">{notice}</p>}<div className="login-product-actions"><button className="secondary" onClick={()=>addToCart(false)}>Tambah ke Keranjang</button><button className="primary" onClick={()=>addToCart(true)}>Tambah &amp; Lihat Keranjang</button></div></aside>
    </div></div>
  </main></div>
}
