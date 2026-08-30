import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { productDetailAssets as media } from '../data/productDetailAssets'
import '../styles/product-detail.css'

const skuOptions = [
  { id: '5', name: '5 Diamond', price: 1234, image: media.diamond5, flashSale: true },
  { id: '50', name: '50 Diamond', price: 10234, image: media.diamond50 },
  { id: '100', name: '100 Diamond', price: 3234, image: media.diamond100 },
  { id: '250', name: '250 Diamond', price: 3234, image: media.diamond250 },
  { id: '500', name: '500 Diamond', price: 3234, image: media.diamond500 },
]

const reviews = [
  { name: 'D***h', tags: ['Proses cepat', 'Produk sesuai'] },
  { name: 'A***n', tags: ['Akun langsung masuk', 'Respon cepat'] },
  { name: 'R***a', tags: ['Transaksi mudah', 'Direkomendasikan'] },
]

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function Stars({ size = 'large' }) {
  const star = size === 'small' ? media.reviewStarFilled : media.star
  return (
    <span className={`product-stars product-stars--${size}`} aria-label="4.6 out of 5 stars">
      {[0, 1, 2, 3].map((index) => <img src={star} alt="" key={index} />)}
      <img src={size === 'small' ? star : media.starPartial} alt="" />
    </span>
  )
}

function RatingDistribution() {
  const rows = [
    { score: 5, width: '86%' },
    { score: 4, width: '11%' },
    { score: 3, width: '2%' },
    { score: 2, width: '0.7%' },
    { score: 1, width: '0.5%' },
  ]

  return (
    <div className="rating-distribution">
      {rows.map((row) => (
        <div className="rating-row" key={row.score}>
          <span>{row.score}</span>
          <img src={media.reviewStarSmall} alt="" />
          <i><b style={{ width: row.width }} /></i>
        </div>
      ))}
    </div>
  )
}

export default function ProductDetailPage() {
  const [category, setCategory] = useState('diamonds')
  const [selectedId, setSelectedId] = useState('5')
  const [quantity, setQuantity] = useState(1)
  const [userId, setUserId] = useState('')
  const [zone, setZone] = useState('')

  const selected = useMemo(
    () => skuOptions.find((item) => item.id === selectedId) || skuOptions[0],
    [selectedId],
  )

  const subtotal = selected.price * quantity
  const serviceFee = 2000
  const total = subtotal + serviceFee
  const accountVerified = false

  function selectSku(id) {
    setSelectedId(id)
    setQuantity(1)
  }

  return (
    <div className="product-detail-shell">
      <Navbar variant="loginCatalog" />

      <main className="product-detail-page">
        <section className="product-hero" style={{ backgroundImage: `url(${media.heroBackground})` }}>
          <div className="product-hero__shade" />
          <div className="product-detail-container product-hero__content">
            <div className="product-game-cover">
              <img src={media.gameCover} alt="Mobile Legends: Bang Bang" />
            </div>
            <div className="product-hero__copy">
              <h1>Mobile Legends: Bang Bang</h1>
              <div className="product-rating-line">
                <strong>Moonton</strong>
                <span className="product-rating-number">4,6</span>
                <Stars />
                <span>(2rb)</span>
              </div>
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
              <div className="product-category-tabs">
                <button className={category === 'diamonds' ? 'active' : ''} type="button" onClick={() => setCategory('diamonds')}>Diamonds</button>
                <button className={category === 'starlight' ? 'active' : ''} type="button" onClick={() => setCategory('starlight')}>Starlight</button>
              </div>
            </div>

            {category === 'diamonds' ? (
              <div className="sku-grid">
                {skuOptions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`sku-card${selectedId === item.id ? ' active' : ''}`}
                    onClick={() => selectSku(item.id)}
                  >
                    {item.flashSale && (
                      <span className="sku-flash"><img src={media.fire} alt="" />Flashsale</span>
                    )}
                    <img className="sku-card__icon" src={item.image} alt="" />
                    <span className="sku-card__copy">
                      <strong>{item.name}</strong>
                      <small>{rupiah(item.price)}</small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="sku-empty">Produk Starlight akan tampil di sini setelah data backend tersedia.</div>
            )}

            <section className="product-reviews">
              <h2>Ulasan Produk</h2>
              <div className="rating-summary">
                <div className="rating-summary__score">
                  <div><img src={media.reviewStar} alt="" /><strong>4.8</strong><span>/5</span></div>
                  <small>394 Ulasan</small>
                </div>
                <RatingDistribution />
              </div>

              <div className="review-divider" />
              <h3>Ulasan Terakhir</h3>
              <div className="review-grid">
                {reviews.map((review) => (
                  <article className="review-card" key={review.name}>
                    <div className="review-card__top">
                      <strong>{review.name}</strong>
                      <Stars size="small" />
                      <span>Hari ini</span>
                    </div>
                    <div className="review-tags">
                      {review.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="product-order-panel">
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

            <div className="selected-item-box">
              <div className="selected-item-row">
                <div>
                  <strong>{selected.name}</strong>
                  <span>{rupiah(selected.price)} / item</span>
                </div>
                <div className="quantity-stepper">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><img src={media.minus} alt="" /></button>
                  <strong>{quantity}</strong>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><img src={media.plus} alt="" /></button>
                </div>
              </div>
              <small>Total saat ini: {Number(selected.id) * quantity} Diamond</small>
            </div>

            <div className="order-summary">
              <h2>Ringkasan</h2>
              <div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
              <div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div>
              <div><span>Diskon</span><strong className="discount">Rp0</strong></div>
            </div>

            <div className="order-separator" />
            <div className="order-total"><strong>Total</strong><b>{rupiah(total)}</b></div>

            <div className="product-cta-stack">
              <button type="button" disabled={!accountVerified}>Tambah ke Keranjang</button>
              <button type="button" disabled={!accountVerified}>Tambah &amp; Lihat Keranjang</button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
