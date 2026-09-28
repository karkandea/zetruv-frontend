import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import { orderJourneyAssets } from '../data/orderJourneyAssets'
import '../styles/order-journey.css'

const orderCatalog = {
  'ZTR-260818-1042': {
    kind: 'via-id',
    invoice: 'ZTRID5678123456789INV',
    shortInvoice: 'ZTRID...89INV',
    product: 'Mobile Legends · 12 Diamond',
    productDetail: 'User ID 12345678 · Zona 1234',
    thumb: '12D',
    itemPrice: 'Rp10.234',
    total: 'Rp12.234',
    note: 'Tujuan akun sudah diverifikasi sebelum transaksi dibuat.',
  },
  'ZTR-260818-0988': {
    kind: 'via-login',
    invoice: 'LOGIN5678123456789INV',
    shortInvoice: 'LOGIN...89INV',
    product: 'Game Via Login · 500 Coins',
    productDetail: 'nama@email.com · PlayerLogin · Server Asia',
    thumb: 'GAME',
    itemPrice: 'Rp75.000',
    total: 'Rp76.000',
    note: 'Password tidak ditampilkan kembali pada detail pesanan.',
  },
}

const stateConfig = {
  unpaid: {
    titleSuffix: 'Menunggu pembayaran',
    badge: 'BELUM DIBAYAR',
    badgeTone: 'warning',
    payment: 'Belum Dibayar',
    paymentTone: 'warning',
    fulfillment: 'Belum Diproses',
    fulfillmentTone: 'warning',
    alert: 'Pesanan belum dibayar. Selesaikan pembayaran agar pesanan dapat diproses.',
    alertTone: 'warning',
    statusPill: 'Belum Dibayar',
    statusTone: 'warning',
    steps: [
      { label: 'Menunggu Pembayaran', meta: 'Belum Dibayar', state: 'warning' },
      { label: 'Belum Diproses', meta: 'Setelah pembayaran berhasil', state: 'current' },
      { label: 'Selesai', meta: 'Selesai', state: 'future' },
    ],
  },
  processing: {
    titleSuffix: 'Pesanan sedang diproses.',
    badge: 'DIPROSES',
    badgeTone: 'process',
    payment: 'Dibayar',
    paymentTone: 'success',
    fulfillment: 'Sedang diproses',
    fulfillmentTone: 'process',
    statusPill: 'Diproses',
    statusTone: 'warning',
    steps: [
      { label: 'Pembayaran dikonfirmasi', meta: 'Dibayar', state: 'done' },
      { label: 'Sedang diproses', meta: 'Sedang diproses', state: 'current' },
      { label: 'Selesai', meta: 'Selesai', state: 'future' },
    ],
  },
  failed: {
    titleSuffix: 'Gagal diproses provider.',
    badge: 'GAGAL DIPROSES',
    badgeTone: 'error',
    payment: 'Dibayar',
    paymentTone: 'success',
    fulfillment: 'Gagal Diproses',
    fulfillmentTone: 'error',
    alert: 'Pembayaran berhasil, tetapi fulfillment provider gagal diproses.',
    alertTone: 'success',
    statusPill: 'Gagal',
    statusTone: 'error',
    note: 'Pesanan membutuhkan penanganan lebih lanjut.',
    steps: [
      { label: 'Pembayaran dikonfirmasi', meta: 'Dibayar', state: 'done' },
      { label: 'Gagal Diproses', meta: 'Gagal', state: 'current' },
      { label: 'Ditinjau Manual', meta: 'Jika provider membutuhkan pengecekan', state: 'future' },
      { label: 'Selesai', meta: 'Selesai', state: 'future' },
    ],
  },
  review: {
    titleSuffix: 'Sedang ditinjau untuk pengecekan tambahan.',
    badge: 'DITINJAU MANUAL',
    badgeTone: 'warning',
    payment: 'Dibayar',
    paymentTone: 'success',
    fulfillment: 'Ditinjau Manual',
    fulfillmentTone: 'warning',
    alert: 'Pesanan sedang ditinjau karena membutuhkan pengecekan tambahan.',
    alertTone: 'success',
    statusPill: 'Ditinjau Manual',
    statusTone: 'warning',
    steps: [
      { label: 'Pembayaran dikonfirmasi', meta: 'Dibayar', state: 'done' },
      { label: 'Ditinjau Manual', meta: 'Sedang ditinjau', state: 'current-warning' },
      { label: 'Selesai', meta: 'Selesai', state: 'future' },
    ],
  },
  'need-action': {
    titleSuffix: 'Data login perlu diperbarui.',
    badge: 'PERLU TINDAKAN',
    badgeTone: 'warning',
    payment: 'Dibayar',
    paymentTone: 'success',
    fulfillment: 'Perlu Tindakan',
    fulfillmentTone: 'process',
    alert: 'Data login tidak dapat diverifikasi. Perbarui credential agar admin dapat melanjutkan pesanan.',
    alertTone: 'success',
    statusPill: 'Perlu Tindakan',
    statusTone: 'warning',
    note: 'Alasan: credential tidak dapat diverifikasi. Periksa email/username dan password, lalu kirim ulang. Password tetap tidak ditampilkan kembali.',
    steps: [
      { label: 'Pembayaran dikonfirmasi', meta: 'Dibayar', state: 'done' },
      { label: 'Perlu Tindakan', meta: 'Menunggu pembaruan data', state: 'current' },
      { label: 'Selesai', meta: 'Selesai', state: 'future' },
    ],
  },
  completed: {
    titleSuffix: 'Pesanan selesai. Produk telah berhasil diterima.',
    badge: 'SELESAI',
    badgeTone: 'success',
    payment: 'Dibayar',
    paymentTone: 'success',
    fulfillment: 'Selesai',
    fulfillmentTone: 'process',
    alert: 'Pesanan selesai. Produk telah berhasil diterima.',
    alertTone: 'success',
    statusPill: 'Selesai',
    statusTone: 'success',
    steps: [
      { label: 'Pembayaran dikonfirmasi', meta: 'Dibayar', state: 'done' },
      { label: 'Fulfillment Selesai', meta: 'Selesai', state: 'done' },
    ],
  },
}

function StatusBadge({ label, tone = 'process', className = '' }) {
  return <span className={`order-status-badge order-status-badge--${tone} ${className}`}>{label}</span>
}

function JourneyInfoBanner({ children, tone = 'info', check = false }) {
  return (
    <div className={`journey-info-banner journey-info-banner--${tone}`}>
      {check ? <span className="journey-info-banner__check">✓</span> : <img src={accountIcons.info} alt="" />}
      <span>{children}</span>
    </div>
  )
}

function OrderMeta({ order, config }) {
  return (
    <div className="journey-order-meta">
      <div><small>ORDER ID</small><strong>{order.shortInvoice}</strong></div>
      <div><small>PEMBAYARAN</small><strong className={`is-${config.paymentTone}`}>{config.payment}</strong></div>
      <div><small>FULFILLMENT</small><strong className={`is-${config.fulfillmentTone}`}>{config.fulfillment}</strong></div>
    </div>
  )
}

function ProductRow({ order, completed }) {
  return (
    <div className="journey-product-row">
      <div className={`journey-product-thumb${order.kind === 'via-login' ? ' is-dark' : ''}`}>{order.thumb}</div>
      <div className="journey-product-copy">
        <strong>{order.product}</strong>
        <span>{order.productDetail}</span>
      </div>
      {completed && <a className="journey-review-link" href="#review">Beri Ulasan</a>}
      <strong className="journey-product-price">{order.itemPrice}</strong>
    </div>
  )
}

function OrderTimeline({ config, orderId, state }) {
  return (
    <div className="journey-status-card">
      <h2>Status Pesanan</h2>
      <StatusBadge label={config.statusPill} tone={config.statusTone} />
      <div className="journey-timeline">
        {config.steps.map((step, index) => (
          <div className={`journey-step journey-step--${step.state}`} key={step.label}>
            <span className="journey-step__rail">
              <i>{step.state === 'done' ? <img src={orderJourneyAssets.check} alt="" /> : null}</i>
              {index < config.steps.length - 1 && <b />}
            </span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.meta}</small>
            </div>
          </div>
        ))}
      </div>
      {state === 'unpaid' && (
        <a className="journey-status-pay" href={`/account/orders/${orderId}/payment`}>Bayar Sekarang</a>
      )}
    </div>
  )
}

function DetailActions({ orderId, state, kind }) {
  const isCompleted = state === 'completed'
  const isNeedAction = state === 'need-action'
  return (
    <div className="journey-actions">
      <a className="journey-btn journey-btn--outline" href="/account/orders">Riwayat Pesanan</a>
      {state !== 'unpaid' && !isNeedAction && (
        <a className="journey-btn journey-btn--primary" href="/">Kembali ke Beranda</a>
      )}
      {isNeedAction && (
        <a className="journey-btn journey-btn--primary" href={`/account/orders/${orderId}/update-login`}>Perbarui Data Login</a>
      )}
      {isCompleted && (
        <a className="journey-btn journey-btn--outline journey-btn--help" href="/#contact">Hubungi Bantuan</a>
      )}
    </div>
  )
}

export function AccountOrderDetailPage({ orderId, state = 'unpaid' }) {
  const order = orderCatalog[orderId] || orderCatalog['ZTR-260818-1042']
  const normalizedState = stateConfig[state] ? state : 'unpaid'
  const config = stateConfig[normalizedState]
  const note = config.note || order.note
  const showBanner = Boolean(config.alert)

  return (
    <div className="order-journey-shell">
      <Navbar variant="account" />
      <main className={`order-detail-page${showBanner ? ' has-banner' : ''}`}>
        <div className="journey-page-heading">
          <div>
            <h1>Detail Pesanan</h1>
            <p>{order.invoice} · {config.titleSuffix}</p>
          </div>
          <StatusBadge label={config.badge} tone={config.badgeTone} />
        </div>

        {showBanner && (
          <JourneyInfoBanner tone={config.alertTone} check={normalizedState === 'completed'}>
            {config.alert}
          </JourneyInfoBanner>
        )}

        <div className="journey-detail-grid">
          <section className="journey-order-card">
            <h2>Informasi Pesanan</h2>
            <OrderMeta order={order} config={config} />
            <hr />
            <h3>Produk</h3>
            <ProductRow order={order} completed={normalizedState === 'completed'} />
            <JourneyInfoBanner>{note}</JourneyInfoBanner>
            <div className="journey-total-row"><span>Total</span><strong>{order.total}</strong></div>
          </section>

          <OrderTimeline config={config} orderId={orderId} state={normalizedState} />
        </div>

        <DetailActions orderId={orderId} state={normalizedState} kind={order.kind} />
      </main>
    </div>
  )
}

function InvoiceSummary({ paymentState }) {
  const label = paymentState === 'failed' ? 'Gagal' : paymentState === 'expired' ? 'Kedaluwarsa' : 'Menunggu Pembayaran'
  return (
    <section className="payment-invoice-card">
      <span className="payment-invoice-card__label">Invoice</span>
      <h2>HARY5678123456789INV</h2>
      {paymentState === 'expired' && <strong className="payment-expired-at">Berakhir pukul 23:42</strong>}
      <h3>Detail Pemesanan</h3>
      <dl>
        <div><dt>Produk</dt><dd>2 Produk Digital</dd></div>
        <div><dt>Item 1</dt><dd>172 Diamonds</dd></div>
        <div><dt>Item 2</dt><dd>Game Item</dd></div>
        <div><dt>Metode Pembayaran</dt><dd>QRIS</dd></div>
        <div><dt>Status</dt><dd className={paymentState === 'pending' ? 'is-warning' : 'is-error'}>{label}</dd></div>
      </dl>
      <button className="payment-outline-btn" type="button">Unduh Invoice</button>
    </section>
  )
}

function PaymentPendingCard({ orderId }) {
  return (
    <section className="payment-action-card payment-action-card--pending">
      <h2>QRIS</h2>
      <span>Total pembayaran</span>
      <strong>Rp95.000</strong>
      <p>Scan QR menggunakan aplikasi pembayaran pilihan kamu.</p>
      <div className="payment-expiry"><span>◷</span> Berlaku 23:42:18</div>
      <img className="payment-qr" src={orderJourneyAssets.qr} alt="QRIS" />
      <div className="payment-action-buttons">
        <a className="payment-primary-btn" href={orderJourneyAssets.qr} download="zetruv-qris.png">Unduh QR</a>
        <a className="payment-outline-btn" href={`/account/orders/${orderId}?state=processing`}>Cek Status</a>
      </div>
    </section>
  )
}

function PaymentResultCard({ state, orderId }) {
  const failed = state === 'failed'
  return (
    <section className="payment-action-card payment-action-card--result">
      <h2>{failed ? 'Coba pembayaran lagi' : 'Buat pembayaran baru'}</h2>
      {failed ? (
        <p className="payment-result-intro">Pembayaran tidak berhasil. Order tetap tersimpan dan belum perlu dibuat ulang.</p>
      ) : (
        <>
          <span>Total pembayaran</span>
          <strong>Rp95.000</strong>
        </>
      )}
      <div className="payment-result-message">
        <img src={failed ? orderJourneyAssets.failedIllustration : orderJourneyAssets.expiredIllustration} alt="" />
        <div>
          {failed && <strong>Pembayaran belum berhasil</strong>}
          <p>{failed ? 'Kamu bisa mencoba lagi atau menggunakan metode lain.' : 'Pembayaran sebelumnya sudah kedaluwarsa. Buat pembayaran baru untuk melanjutkan order yang sama.'}</p>
        </div>
      </div>
      <div className="payment-action-buttons">
        <a className="payment-primary-btn" href={`/account/orders/${orderId}/payment?state=pending`}>{failed ? 'Coba Bayar Lagi' : 'Buat Pembayaran Baru'}</a>
        <a className="payment-outline-btn" href={`/account/orders/${orderId}/payment?state=pending`}>Ganti Metode</a>
      </div>
    </section>
  )
}

export function AccountOrderPaymentPage({ orderId, state = 'pending' }) {
  const normalized = ['pending', 'failed', 'expired'].includes(state) ? state : 'pending'
  const heading = normalized === 'pending' ? 'Selesaikan Pembayaran' : normalized === 'failed' ? 'Pembayaran Gagal' : 'Pembayaran Kedaluwarsa'
  const subtitle = normalized === 'pending'
    ? 'Selesaikan sebelum timer habis agar pesanan dapat diproses.'
    : normalized === 'failed'
      ? 'Pembayaran tidak berhasil diproses. Kamu bisa mencoba lagi atau menggunakan metode lain.'
      : 'Waktu pembayaran habis. Buat pembayaran baru untuk melanjutkan order yang sama.'
  const badge = normalized === 'pending' ? 'MENUNGGU PEMBAYARAN' : normalized === 'failed' ? 'GAGAL' : null

  return (
    <main className={`payment-state-page payment-state-page--${normalized}`}>
      <div className="payment-state-page__rule" />
      <header>
        <div><h1>{heading}</h1><p>{subtitle}</p></div>
        {badge && <StatusBadge label={badge} tone={normalized === 'failed' ? 'error' : 'warning'} />}
      </header>
      <div className="payment-state-grid">
        <InvoiceSummary paymentState={normalized} />
        {normalized === 'pending' ? <PaymentPendingCard orderId={orderId} /> : <PaymentResultCard state={normalized} orderId={orderId} />}
      </div>
    </main>
  )
}

const shippingEvents = [
  ['Pesanan dibayar', '11 Agu · 16:42'],
  ['Diproses Zetruv', '11 Agu · 17:10'],
  ['Diserahkan ke J&T', '12 Agu · 10:15'],
  ['Dalam perjalanan', '12 Agu · 15:20'],
  ['Diterima', '13 Agu · 13:20'],
]

export function AccountOrderTrackingPage({ orderId, state = 'transit' }) {
  const delivered = state === 'delivered'
  return (
    <div className="order-journey-shell">
      <Navbar variant="account" />
      <main className="tracking-page">
        <header>
          <div><h1>Lacak Pesanan</h1><p>Invoice PHY-110826-0001</p></div>
          <StatusBadge label={delivered ? 'DITERIMA' : 'DALAM PENGIRIMAN'} tone={delivered ? 'success' : 'shipping'} />
        </header>
        <div className="tracking-grid">
          <section className="tracking-summary-card">
            <h2>Zetruv Gaming Jersey</h2>
            <p>Black · Size L · Qty 1</p>
            <strong>Rp267.000</strong>
            <hr />
            <span>Pengiriman</span>
            <h3>J&T Express · EZ</h3>
            <p>AWB JP1234567890</p>
            <span>Estimasi tiba</span>
            <h3>13–14 Agustus</h3>
            <div className="tracking-actions">
              <a className="journey-btn journey-btn--outline" href={`/account/orders/${orderId}/tracking?state=delivered`}>Refresh tracking</a>
              <a className="journey-btn journey-btn--primary" href="/account/orders">Riwayat Pesanan</a>
            </div>
          </section>
          <section className="tracking-status-card">
            <h2>Status Pengiriman</h2>
            <div className="shipping-timeline">
              {shippingEvents.map(([label, time], index) => {
                const active = delivered || index < 4
                const isLast = index === shippingEvents.length - 1
                return (
                  <div className={`shipping-event${active ? ' is-active' : ''}`} key={label}>
                    <span><i />{!isLast && <b />}</span>
                    <strong>{label}</strong>
                    <small>{active ? time : 'Menunggu'}</small>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export function AccountOrderUpdateLoginPage({ orderId }) {
  return (
    <div className="order-journey-shell">
      <Navbar variant="account" />
      <main className="update-login-page">
        <header>
          <h1>Perbarui Data Login Game</h1>
          <p>Perbarui credential untuk melanjutkan pesanan Via Login yang tertahan.</p>
        </header>
        <div className="update-login-grid">
          <form
            className="update-login-card"
            onSubmit={(event) => {
              event.preventDefault()
              window.location.href = `/account/orders/${orderId}?state=processing`
            }}
          >
            <h2>Data Login Game</h2>
            <p>Data ini hanya dipakai untuk memproses order dan tidak ditampilkan kembali.</p>
            <label><span>Email / username</span><input defaultValue="nama@email.com" /></label>
            <label><span>Password</span><input type="password" defaultValue="password" /></label>
            <JourneyInfoBanner>Credential baru menggantikan data sebelumnya untuk order ini saja.</JourneyInfoBanner>
            <div className="update-login-actions">
              <a className="journey-btn journey-btn--outline" href={`/account/orders/${orderId}?state=need-action`}>Batal</a>
              <button className="journey-btn journey-btn--primary" type="submit">Simpan &amp; Lanjutkan</button>
            </div>
          </form>
          <aside className="held-order-card">
            <h2>Pesanan Tertahan</h2>
            <span>#ZTR-260818-0988</span>
            <div>
              <strong className="held-order-card__thumb">GAME</strong>
              <div><h3>Game Via Login · 500 Coins</h3><p>Status: Perlu Tindakan Customer</p></div>
            </div>
            <p>Setelah disimpan, pesanan kembali ke antrean admin untuk diproses.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}
