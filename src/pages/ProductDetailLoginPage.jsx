import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { productDetailLoginAssets as media } from '../data/productDetailLoginAssets'
import '../styles/product-detail-login.css'

const packages = [
  { id: '60', name: '60 Genesis Crystals', price: 16500 },
  { id: '330', name: '300+30 Genesis Crystals', price: 81000 },
  { id: '1090', name: '980+110 Genesis Crystals', price: 255000 },
  { id: '2240', name: '1980+260 Genesis Crystals', price: 489000 },
  { id: '3880', name: '3280+600 Genesis Crystals', price: 815000 },
  { id: 'welkin', name: 'Blessing of the Welkin Moon', price: 81000 },
]

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function HeroStars() {
  return (
    <span className="login-product-stars" aria-label="4.6 out of 5 stars">
      {[0, 1, 2, 3].map((index) => <img src={media.star} alt="" key={index} />)}
      <img src={media.starPartial} alt="" />
    </span>
  )
}

export default function ProductDetailLoginPage() {
  const [selectedId, setSelectedId] = useState('1090')
  const [quantity, setQuantity] = useState(1)

  const selected = useMemo(
    () => packages.find((item) => item.id === selectedId) || packages[2],
    [selectedId],
  )

  const subtotal = selected.price * quantity
  const serviceFee = 2000
  const total = subtotal + serviceFee

  function selectPackage(id) {
    setSelectedId(id)
    setQuantity(1)
  }

  return (
    <div className="login-product-shell">
      <Navbar variant="loginCatalog" />

      <main className="login-product-page">
        <section className="login-product-hero" style={{ backgroundImage: `url(${media.heroBackground})` }}>
          <div className="login-product-hero__shade" />
          <div className="login-product-container login-product-hero__content">
            <div className="login-product-cover">
              <img src={media.gameCover} alt="Genshin Impact" />
            </div>
            <div className="login-product-hero__copy">
              <h1>Genshin Impact</h1>
              <div className="login-product-rating-line">
                <strong>HoYoverse</strong>
                <span>4,6</span>
                <HeroStars />
                <span>(2rb)</span>
              </div>
              <div className="login-product-benefits">
                <span><img src={media.badgeFast} alt="" />Proses Cepat</span>
                <span><img src={media.badgeSupport} alt="" />Dukungan Chat 24/7</span>
                <span><img src={media.badgeGlobal} alt="" />Global Region</span>
              </div>
            </div>
          </div>
        </section>

        <div className="login-product-body">
          <div className="login-product-container login-product-layout">
            <section className="login-package-panel">
              <div className="login-package-heading">
                <h2>Pilih Paket</h2>
                <p>Pilih paket dulu. Data login game baru diminta setelah kamu masuk ke checkout.</p>
              </div>

              <div className="login-package-grid">
                {packages.map((item) => {
                  const active = selectedId === item.id
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`login-package-card${active ? ' active' : ''}`}
                      onClick={() => selectPackage(item.id)}
                    >
                      <span className="login-package-card__icon">
                        <img src={active ? media.genesisCrystalSelected : media.genesisCrystal} alt="" />
                      </span>
                      <span className="login-package-card__copy">
                        <strong>{item.name}</strong>
                        <small>{rupiah(item.price)}</small>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="login-product-info-banner">
                <img src={media.info} alt="" />
                <p>Credential akun hanya diminta saat checkout dan tidak disimpan di Product Detail atau Cart.</p>
              </div>
            </section>

            <aside className="login-product-summary">
              <h2>Ringkasan</h2>

              <div className="login-selected-package">
                <div>
                  <strong>{selected.name}</strong>
                  <span>{rupiah(selected.price)} / item</span>
                </div>
                <div className="login-quantity-stepper">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Kurangi jumlah">
                    <img src={media.minus} alt="" />
                  </button>
                  <strong>{quantity}</strong>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Tambah jumlah">
                    <img src={media.plus} alt="" />
                  </button>
                </div>
              </div>

              <div className="login-summary-row"><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
              <div className="login-summary-row"><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div>
              <div className="login-summary-divider" />
              <div className="login-summary-total"><span>Total</span><strong>{rupiah(total)}</strong></div>

              <div className="login-product-actions">
                <button type="button" className="secondary">Tambah ke Keranjang</button>
                <button type="button" className="primary">Tambah &amp; Lihat Keranjang</button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
