import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { lookupOrder } from '../services/commerceService'
import '../styles/commerce.css'

const LAST_ORDER_KEY = 'zetruv-last-order-v1'
const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function readSaved() {
  try { return JSON.parse(window.sessionStorage.getItem(LAST_ORDER_KEY) || 'null') } catch { return null }
}

export default function OrderStatusPage() {
  const queryOrder = new URLSearchParams(window.location.search).get('order') || ''
  const saved = readSaved()
  const [form, setForm] = useState({ orderNumber: queryOrder || saved?.order?.orderNumber || '', email: saved?.customer?.email || '', phone: saved?.customer?.phone || '' })
  const [status, setStatus] = useState(saved?.order || null)
  const [payment, setPayment] = useState(saved?.payment || null)
  const [error, setError] = useState(saved?.paymentError || '')
  const [loading, setLoading] = useState(false)

  async function refresh(event) {
    event?.preventDefault()
    if (!form.orderNumber.trim() || (!form.email.trim() && !form.phone.trim())) {
      setError('Order number dan email/WhatsApp diperlukan.')
      return
    }
    setLoading(true); setError('')
    try {
      const result = await lookupOrder({ orderNumber: form.orderNumber.trim(), customerEmail: form.email.trim() || null, customerPhone: form.phone.trim() || null })
      setStatus(result)
    } catch (err) { setError(err.message || 'Order tidak ditemukan.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (queryOrder && form.orderNumber && (form.email || form.phone)) refresh()
    // initial refresh only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const paymentUrl = payment?.paymentUrl
  const externalPayment = paymentUrl && /^https?:\/\//i.test(paymentUrl)

  return (
    <div className="commerce-shell"><Navbar variant="loginCatalog" /><main className="commerce-page commerce-container">
      <header className="commerce-heading"><div><small>ORDER STATUS</small><h1>{status?.orderNumber || 'Cek transaksi'}</h1><p>Status payment dan fulfillment berasal langsung dari backend.</p></div><a href="/search">Belanja lagi</a></header>
      <div className="status-layout">
        <section className="checkout-card">
          {status ? <><div className="status-pills"><span>Order: <b>{status.status}</b></span><span>Payment: <b>{status.paymentStatus}</b></span></div><div className="status-total"><small>Total</small><strong>{rupiah(status.grandTotal)}</strong></div>{(status.items || []).map((item, index) => <div className="status-item" key={`${item.productSlug}-${index}`}><div><strong>{item.productName}</strong><span>{item.variantName} · ×{item.quantity}</span></div><span>{item.fulfillmentStatus}</span></div>)}</> : <p>Masukkan data order untuk melihat status.</p>}
          {payment && <div className="payment-box"><small>PAYMENT CREATED</small><strong>{payment.provider} · {payment.providerReference}</strong><span>Expired: {payment.expiresAt ? new Date(payment.expiresAt).toLocaleString('id-ID') : '—'}</span>{externalPayment ? <a href={paymentUrl}>Buka halaman pembayaran</a> : <p>DEV menggunakan mock payment. Tidak ada payment page eksternal.</p>}</div>}
          {error && <p className="checkout-error">{error}</p>}
        </section>
        <form className="checkout-card status-lookup" onSubmit={refresh}><h2>Refresh status</h2><label>Order number<input value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>WhatsApp<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><button type="submit" disabled={loading}>{loading ? 'Mengecek…' : 'Periksa status'}</button></form>
      </div>
    </main></div>
  )
}
