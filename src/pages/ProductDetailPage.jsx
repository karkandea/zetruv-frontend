import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { productDetailAssets as media } from '../data/productDetailAssets'
import { getCatalogProduct } from '../services/catalogService'
import '../styles/product-detail.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function variantIcon(name = '') {
  if (/\b5\b/.test(name)) return media.diamond5
  if (/\b50\b/.test(name)) return media.diamond50
  if (/\b100\b/.test(name)) return media.diamond100
  if (/\b250\b/.test(name)) return media.diamond250
  if (/\b500\b/.test(name)) return media.diamond500
  return media.diamond100
}

export default function ProductDetailPage({ slug = 'mobile-legends' }) {
  const [product, setProduct] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [userId, setUserId] = useState('')
  const [zone, setZone] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    getCatalogProduct(slug)
      .then((data) => {
        if (cancelled) return
        if (data.kind === 'TopUpLogin') {
          window.location.replace(`/product/${data.slug}/login`)
          return
        }
        setProduct(data)
        const first = data.variants?.find((item) => item.isAvailable) || data.variants?.[0]
        setSelectedId(first?.id || '')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Product could not be loaded.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [slug])

  const selected = useMemo(
    () => product?.variants?.find((item) => item.id === selectedId) || product?.variants?.[0] || null,
    [product, selectedId],
  )

  const unitPrice = selected?.effectivePrice ?? selected?.price ?? 0
  const regularPrice = selected?.price ?? unitPrice
  const subtotal = unitPrice * quantity
  const discount = Math.max(0, regularPrice - unitPrice) * quantity
  const serviceFee = 0
  const total = subtotal + serviceFee
  const maxQuantity = selected?.stockQuantity ?? 99
  const accountVerified = false

  function selectSku(id) {
    setSelectedId(id)
    setQuantity(1)
  }

  if (loading || error || !product || !selected) {
    return (
      <div className="product-detail-shell">
        <Navbar variant="loginCatalog" />
        <main className="product-detail-page">
          <div className="product-detail-container product-detail-layout">
            <div className="sku-empty">{loading ? 'Loading product…' : error || 'Product is not available.'}</div>
          </div>
        </main>
      </div>
    )
  }

  const cover = product.thumbnailUrl || product.game?.imageUrl || media.gameCover
  const hero = product.images?.[0]?.url || media.heroBackground
  const publisher = product.game?.publisher || product.game?.name || product.category?.name

  return (
    <div className="product-detail-shell">
      <Navbar variant="loginCatalog" />

      <main className="product-detail-page">
        <section className="product-hero" style={{ backgroundImage: `url(${hero})` }}>
          <div className="product-hero__shade" />
          <div className="product-detail-container product-hero__content">
            <div className="product-game-cover">
              <img src={cover} alt={product.name} />
            </div>
            <div className="product-hero__copy">
              <h1>{product.name}</h1>
              <div className="product-rating-line"><strong>{publisher}</strong></div>
              <div className="product-benefits">
                <span><img src={media.badgeFast} alt="" />Proses Cepat</span>
                <span><img src={media.badgeSupport} alt="" />Dukungan Chat 24/7</span>
                <span><img src={media.badgeGlobal} alt="" />Global Region</span>
              </div>
            </div>
          </div>
        </section>

        <div className="product-detail-container product-detail-layout">
          <section className="product-selection-panel">
            <div className="product-selection-heading">
              <h2>Pilih Item</h2>
              <div className="product-category-tabs"><button className="active" type="button" disabled>{product.category?.name || 'Item'}</button></div>
            </div>

            <div className="sku-grid">
              {product.variants.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`sku-card${selectedId === item.id ? ' active' : ''}`}
                  onClick={() => selectSku(item.id)}
                  disabled={!item.isAvailable}
                >
                  {item.isOnSale && <span className="sku-flash"><img src={media.fire} alt="" />Flashsale</span>}
                  <img className="sku-card__icon" src={variantIcon(item.name)} alt="" />
                  <span className="sku-card__copy">
                    <strong>{item.name}</strong>
                    <small>{rupiah(item.effectivePrice ?? item.price)}</small>
                  </span>
                </button>
              ))}
            </div>

            <section className="product-reviews">
              <h2>Ulasan Produk</h2>
              <div className="sku-empty">Ulasan belum tersedia untuk produk ini.</div>
            </section>
          </section>

          <aside className="product-order-panel">
            {product.requiresGameAccountValidation && (
              <div className="product-account-fields">
                <label>
                  <span>User ID</span>
                  <div className="product-input-wrap">
                    <img src={media.userIcon} alt="" />
                    <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
                  </div>
                </label>
                <label>
                  <span>Zona</span>
                  <input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="(ID Zona)" />
                </label>
              </div>
            )}

            <div className="selected-item-box">
              <div className="selected-item-row">
                <div>
                  <strong>{selected.name}</strong>
                  <span>{rupiah(unitPrice)} / item</span>
                </div>
                <div className="quantity-stepper">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><img src={media.minus} alt="" /></button>
                  <strong>{quantity}</strong>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity} aria-label="Increase quantity"><img src={media.plus} alt="" /></button>
                </div>
              </div>
              <small>{selected.isOnSale ? `Promo aktif sampai ${new Date(selected.promotionEndsAt).toLocaleString('id-ID')}` : selected.name}</small>
            </div>

            <div className="order-summary">
              <h2>Ringkasan</h2>
              <div><span>Subtotal</span><strong>{rupiah(regularPrice * quantity)}</strong></div>
              <div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div>
              <div><span>Diskon</span><strong className="discount">-{rupiah(discount)}</strong></div>
            </div>

            <div className="order-separator" />
            <div className="order-total"><strong>Total</strong><b>{rupiah(total)}</b></div>

            <div className="product-cta-stack">
              <button type="button" disabled={!accountVerified || !selected.isAvailable}>Tambah ke Keranjang</button>
              <button type="button" disabled={!accountVerified || !selected.isAvailable}>Tambah &amp; Lihat Keranjang</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
