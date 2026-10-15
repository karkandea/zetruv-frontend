import { useRef, useState } from 'react'
import { ArrowRight, ClipboardList, CircleAlert, Mail, PackageSearch, RefreshCw, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import { apiRequest } from '../api/httpClient'
import '../styles/shared-order-status.css'

const ORDER_STATUS = ['Menunggu proses', 'Diproses', 'Selesai', 'Dibatalkan']
const PAYMENT_STATUS = ['Belum dibayar', 'Dibayar', 'Gagal', 'Dikembalikan']
const FULFILLMENT_STATUS = ['Menunggu', 'Diproses', 'Selesai', 'Gagal', 'Dibatalkan']

function enumLabel(value, labels, fallback) {
  if (typeof value === 'number') return labels[value] || fallback
  const match = ['pending', 'processing', 'completed', 'cancelled', 'paid', 'failed', 'refunded']
  const text = String(value || '').trim().toLowerCase()
  if (labels === PAYMENT_STATUS) return ({ pending: 'Belum dibayar', paid: 'Dibayar', failed: 'Gagal', refunded: 'Dikembalikan' })[text] || fallback
  if (labels === FULFILLMENT_STATUS) return ({ pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal', cancelled: 'Dibatalkan' })[text] || fallback
  return ({ pending: 'Menunggu proses', processing: 'Diproses', completed: 'Selesai', cancelled: 'Dibatalkan' })[text] || fallback
}

function money(amount, currency = 'IDR') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return currency === 'IDR' ? 'Rp' + new Intl.NumberFormat('id-ID').format(value) : new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(value)
}

function dateTime(value) {
  if (!value) return '—'
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return '—'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(timestamp) + ' WIB'
}

function OrderLookupResult({ order, onReset }) {
  const payment = enumLabel(order.paymentStatus, PAYMENT_STATUS, 'Belum diketahui')
  const status = enumLabel(order.status, ORDER_STATUS, 'Belum diketahui')
  const isPaid = payment === 'Dibayar'
  const isComplete = status === 'Selesai'
  return <section className="sos-lookup-result" aria-label="Hasil cek pesanan">
    <header className="sos-lookup-result__header">
      <div>
        <span className="sos-lookup-eyebrow">Pesanan terverifikasi</span>
        <h2>{order.orderNumber}</h2>
        <p>Dibuat pada {dateTime(order.createdAt)}</p>
      </div>
      <button type="button" className="sos-lookup-secondary" onClick={onReset}><RefreshCw size={16} aria-hidden="true" /> Cek pesanan lain</button>
    </header>
    <div className="sos-lookup-statuses">
      <div><span>Status Pesanan</span><strong className={isComplete ? 'is-success' : ''}>{status}</strong></div>
      <div><span>Pembayaran</span><strong className={isPaid ? 'is-success' : ''}>{payment}</strong></div>
      <div><span>Total Pembayaran</span><strong>{money(order.grandTotal, order.currency)}</strong></div>
    </div>
    {order.hasFulfillmentIssue && <p className="sos-lookup-warning" role="status"><CircleAlert size={17} aria-hidden="true" /> Ada kendala pemrosesan pada salah satu item. Silakan hubungi bantuan Zetruv dengan nomor pesanan di atas.</p>}
    <div className="sos-lookup-items">
      <h3>Produk ({order.items?.length || 0})</h3>
      {(order.items || []).map((item, index) => (
        <article className="sos-lookup-item" key={String(item.productSlug || item.productName) + '-' + index}>
          {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <span className="sos-lookup-item__fallback"><PackageSearch size={24} aria-hidden="true" /></span>}
          <div className="sos-lookup-item__copy"><strong>{item.productName}</strong><span>{item.variantName || item.gameName || 'Produk Zetruv'} · {Number(item.quantity) || 1} item</span><small>{enumLabel(item.fulfillmentStatus, FULFILLMENT_STATUS, 'Belum diketahui')}</small></div>
          <strong>{money(item.lineTotal, order.currency)}</strong>
        </article>
      ))}
    </div>
    <div className="sos-lookup-summary">
      <div><span>Subtotal</span><strong>{money(order.subtotal, order.currency)}</strong></div>
      {Number(order.discountAmount) > 0 && <div><span>Diskon</span><strong>-{money(order.discountAmount, order.currency)}</strong></div>}
      {Number(order.shippingAmount) > 0 && <div><span>Pengiriman</span><strong>{money(order.shippingAmount, order.currency)}</strong></div>}
      <div className="sos-lookup-summary__total"><span>Total</span><strong>{money(order.grandTotal, order.currency)}</strong></div>
    </div>
    {order.shipment && <section className="sos-lookup-shipment">
      <h3>Informasi pengiriman</h3>
      <p>{order.shipment.provider || 'Kurir'} {order.shipment.serviceName || ''}</p>
      <p>{order.shipment.trackingNumber ? 'Nomor resi: ' + order.shipment.trackingNumber : 'Nomor resi belum tersedia'}</p>
    </section>}
    <p className="sos-lookup-security"><ShieldCheck size={15} aria-hidden="true" /> Status ini berasal dari server Zetruv. Bukti pembayaran dan status terkini mengikuti konfirmasi backend, bukan data contoh.</p>
  </section>
}

export default function SharedOrderStatusPage() {
  const [number, setNumber] = useState('')
  const [method, setMethod] = useState('email')
  const [contact, setContact] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  function clearResult() {
    requestId.current += 1
    setOrder(null)
    setError('')
    setLoading(false)
  }

  async function handleLookup(event) {
    event.preventDefault()
    if (loading) return
    const orderNumber = number.trim().replace(/^#/, '')
    const detail = contact.trim()
    if (!orderNumber || !detail) {
      setError('Isi nomor pesanan dan email atau nomor HP yang digunakan saat checkout.')
      return
    }
    const id = ++requestId.current
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const result = await apiRequest('/orders/lookup', {
        method: 'POST', cache: 'no-store',
        body: JSON.stringify({
          orderNumber,
          customerEmail: method === 'email' ? detail : null,
          customerPhone: method === 'phone' ? detail : null,
        }),
      })
      if (id !== requestId.current) return
      if (!result?.orderNumber) throw new Error('Informasi pesanan belum tersedia.')
      // The lookup can include a short-lived payment access grant; it is not needed
      // to display status and must not be persisted or exposed in the UI.
      const { orderAccessToken: unusedToken, orderAccessTokenExpiresAt: unusedExpiry, ...safeOrder } = result
      setOrder(safeOrder)
    } catch (issue) {
      if (id !== requestId.current) return
      setError(issue?.status === 404
        ? 'Pesanan tidak ditemukan. Pastikan nomor pesanan dan kontak sesuai dengan yang dipakai saat checkout.'
        : issue?.status === 429
          ? 'Terlalu banyak percobaan. Coba lagi beberapa saat.'
          : 'Belum bisa mengambil status pesanan. Periksa koneksi lalu coba lagi.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  return <div className="sos-shell">
    <Navbar variant="account" />
    <main className="sos-lookup-page">
      <div className="sos-lookup-intro">
        <span className="sos-lookup-intro__icon"><ClipboardList size={28} aria-hidden="true" /></span>
        <h1>Cek Pesanan</h1>
        <p>Masukkan nomor pesanan dan kontak yang kamu pakai saat checkout untuk melihat status pembayaran dan produk secara langsung.</p>
      </div>

      <form className="sos-lookup-form" onSubmit={handleLookup}>
        <label htmlFor="sos-order-number">Nomor Pesanan</label>
        <input id="sos-order-number" name="orderNumber" type="text" autoComplete="off" maxLength={41}
          placeholder="Contoh format: ZTR-..." required value={number}
          onChange={e => { setNumber(e.target.value); clearResult() }} />
        <fieldset className="sos-lookup-contact-method">
          <legend>Verifikasi dengan</legend>
          <label><input type="radio" name="method" value="email" checked={method === 'email'} onChange={() => { setMethod('email'); setContact(''); clearResult() }} /> Email</label>
          <label><input type="radio" name="method" value="phone" checked={method === 'phone'} onChange={() => { setMethod('phone'); setContact(''); clearResult() }} /> Nomor HP</label>
        </fieldset>
        <label htmlFor="sos-contact">{method === 'email' ? 'Email saat Checkout' : 'Nomor HP saat Checkout'}</label>
        <input id="sos-contact" name="contact" type={method === 'email' ? 'email' : 'tel'} autoComplete={method === 'email' ? 'email' : 'tel'}
          placeholder={method === 'email' ? 'nama@email.com' : '08xxxxxxxxxx'} required value={contact}
          onChange={e => { setContact(e.target.value); clearResult() }} />
        {error && <p className="sos-lookup-error" role="alert"><CircleAlert size={17} aria-hidden="true" /> {error}</p>}
        <button className="sos-lookup-submit" type="submit" disabled={loading}>
          {loading ? 'Memeriksa pesanan…' : 'Cek Status Pesanan'}
          {!loading && <ArrowRight size={18} aria-hidden="true" />}
        </button>
        <p className="sos-lookup-note"><Mail size={15} aria-hidden="true" /> Gunakan kontak yang sama dengan saat transaksi. Kami tidak akan menampilkan pesanan hanya dari nomor pesanan.</p>
      </form>
      {order && <OrderLookupResult order={order} onReset={() => { clearResult(); setNumber(''); setContact(''); document.getElementById('sos-order-number')?.focus() }} />}
      {!order && !loading && <div className="sos-lookup-help"><strong>Belum punya pesanan?</strong><span>Pilih produk dulu, lalu lanjutkan checkout.</span><a href="/search">Jelajahi Produk <ArrowRight size={15} aria-hidden="true" /></a></div>}
    </main>
  </div>
}
