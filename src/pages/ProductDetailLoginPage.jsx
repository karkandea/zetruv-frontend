import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { productDetailLoginAssets as media } from '../data/productDetailLoginAssets'
import { getCatalogProduct } from '../services/catalogService'
import { addCartItem } from '../services/cartService'
import '../styles/product-detail-login.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

export default function ProductDetailLoginPage({ slug = 'genshin-impact' }) {
  const [product, setProduct] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false; setLoading(true); setError('')
    getCatalogProduct(slug).then((data) => {
      if (cancelled) return
      if (data.kind !== 'TopUpLogin') { window.location.replace(`/product/${data.slug}`); return }
      setProduct(data)
      const first = data.variants?.find((item) => item.isAvailable) || data.variants?.[0]
      setSelectedId(first?.id || '')
    }).catch((err) => { if (!cancelled) setError(err.message || 'Product could not be loaded.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  const selected = useMemo(() => product?.variants?.find((item) => item.id === selectedId) || product?.variants?.[0] || null, [product, selectedId])
  const unitPrice = selected?.effectivePrice ?? selected?.price ?? 0
  const regularPrice = selected?.price ?? unitPrice
  const subtotal = unitPrice * quantity
  const discount = Math.max(0, regularPrice - unitPrice) * quantity
  const maxQuantity = selected?.stockQuantity ?? 99

  function selectPackage(id) { setSelectedId(id); setQuantity(1); setNotice('') }
  function addToCart(goToCart) {
    if (!selected?.isAvailable) return
    addCartItem({ accountKey: 'default', productId: product.id, productSlug: product.slug, productName: product.name, productKind: product.kind, fulfillmentMethod: product.fulfillmentMethod, requiresGameAccountValidation: false, thumbnailUrl: product.thumbnailUrl || product.game?.imageUrl || null, gameName: product.game?.name || null, variantId: selected.id, variantName: selected.name, unitPrice, regularPrice, isOnSale: selected.isOnSale, quantity, maxQuantity })
    if (goToCart) window.location.href = '/cart'
    else setNotice(`${selected.name} ditambahkan ke keranjang.`)
  }

  if (loading || error || !product || !selected) return <div className="login-product-shell"><Navbar variant="loginCatalog" /><main className="login-product-page"><div className="login-product-body"><div className="login-product-container"><p className="login-package-description">{loading ? 'Loading product…' : error || 'Product is not available.'}</p></div></div></main></div>

  const cover = product.thumbnailUrl || product.game?.imageUrl || media.gameCover
  const hero = product.images?.[0]?.url || media.heroBackground
  const publisher = product.game?.publisher || product.game?.name || product.category?.name

  return <div className="login-product-shell"><Navbar variant="loginCatalog" /><main className="login-product-page"><section className="login-product-hero"><img className="login-product-hero__background" src={hero} alt="" /><div className="login-product-hero__shade" /><div className="login-product-container login-product-hero__content"><div className="login-product-cover"><img src={cover} alt={product.name} /></div><div className="login-product-hero__copy"><div className="login-product-title-block"><h1>{product.name}</h1><div className="login-product-rating-line"><strong>{publisher}</strong></div></div><div className="login-product-benefits"><span><img className="login-product-benefit-fast" src={media.badgeFast} alt="" />Proses Cepat</span><span><img src={media.badgeSupport} alt="" />Dukungan Chat 24/7</span><span><img src={media.badgeGlobal} alt="" />Global Region</span></div></div></div></section>
    <div className="login-product-body"><div className="login-product-container login-product-layout"><section className="login-package-panel"><h2>Pilih Paket</h2><p className="login-package-description">Pilih paket dulu. Data login game baru diminta setelah kamu masuk ke checkout.</p><div className="login-package-grid">{product.variants.map((item) => { const active = selectedId === item.id; return <button type="button" key={item.id} className={`login-package-card${active ? ' active' : ''}`} onClick={() => selectPackage(item.id)} disabled={!item.isAvailable}><span className="login-package-card__icon"><img src={active ? media.genesisCrystalSelected : media.genesisCrystal} alt="" /></span><span className="login-package-card__copy"><strong>{item.name}</strong><small>{rupiah(item.effectivePrice ?? item.price)}</small></span></button> })}</div><div className="login-product-info-banner"><img src={media.info} alt="" /><p>Credential akun hanya diminta saat checkout dan tidak disimpan di Product Detail atau Cart.</p></div></section>
      <aside className="login-product-summary"><h2>Ringkasan</h2><div className="login-selected-package"><div><strong>{selected.name}</strong><span>{rupiah(unitPrice)} / item</span></div><div className="login-quantity-stepper"><button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))}><img src={media.minus} alt="" /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((v) => Math.min(maxQuantity, v + 1))} disabled={quantity >= maxQuantity}><img src={media.plus} alt="" /></button></div></div><div className="login-summary-row"><span>Subtotal</span><strong>{rupiah(regularPrice * quantity)}</strong></div>{discount > 0 && <div className="login-summary-row"><span>Diskon</span><strong>-{rupiah(discount)}</strong></div>}<div className="login-summary-divider" /><div className="login-summary-total"><span>Total</span><strong>{rupiah(subtotal)}</strong></div>{notice && <p className="pdp-action-message is-success">{notice}</p>}<div className="login-product-actions"><button type="button" className="secondary" disabled={!selected.isAvailable} onClick={() => addToCart(false)}>Tambah ke Keranjang</button><button type="button" className="primary" disabled={!selected.isAvailable} onClick={() => addToCart(true)}>Tambah &amp; Lihat Keranjang</button></div></aside>
    </div></div></main></div>
}
