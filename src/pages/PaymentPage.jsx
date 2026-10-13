import { useCallback, useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import {
  getCheckoutPaymentOptions, getOrderPaymentStatus, startOrderPayment,
} from '../services/checkoutGatewayService'
import {
  readPaymentContext, normalizePaymentState, mayInitiatePayment,
  formatPaymentCountdown, paymentLink,
} from '../services/paymentSession'
import '../styles/digital-commerce.css'
import '../styles/payment-session.css'

const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(Number(value) || 0)
const labels = {
  QRIS:'QRIS', GOPAY:'GoPay',
  BCA_VA:'Virtual Account',
}
const statusText = {
  NotStarted: ['Pembayaran belum dimulai','Pesanan telah dibuat. Mulai pembayaran hanya setelah metode tersedia.'],
  Pending: ['Menunggu pembayaran','Selesaikan pembayaran melalui instruksi resmi yang diterbitkan penyedia pembayaran.'],
  Paid: ['Pembayaran terkonfirmasi','Pembayaran sudah diverifikasi oleh backend. Pesanan diteruskan ke proses fulfillment.'],
  Failed: ['Pembayaran gagal','Tidak ada pembayaran yang dikonfirmasi. Periksa status sebelum mencoba lagi.'],
  Expired: ['Waktu pembayaran habis','Instruksi pembayaran sebelumnya sudah kedaluwarsa dan tidak boleh digunakan lagi.'],
  Refunded: ['Pembayaran dikembalikan','Status pengembalian dana telah diperbarui oleh sistem.'],
  Cancelled: ['Pesanan dibatalkan','Pesanan ini tidak dapat dibayar kembali.'],
}
const isDev = import.meta.env.MODE === 'dev'

export default function PaymentPage() {
  const [context] = useState(() => readPaymentContext(window.sessionStorage))
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(Boolean(context))
  const [refreshing, setRefreshing] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const statusFlight = useRef(false)
  const retryFlight = useRef(false)
  const expiredChecked = useRef(new Set())

  const refreshStatus = useCallback(async (quiet = false) => {
    if (!context || statusFlight.current) return
    statusFlight.current = true
    if (!quiet) setRefreshing(true)
    try {
      const response = await getOrderPaymentStatus({
        id:context.orderId, orderAccessToken:context.orderAccessToken,
      })
      const verified = normalizePaymentState(response, context.orderId)
      setPayment(verified)
      setError('')
    } catch (e) {
      // A stale success state must not survive failed authorization/status checks.
      setPayment(null)
      setError(e.status === 404
        ? 'Sesi order tidak valid atau sudah kedaluwarsa. Buka kembali pesanan dari akun Zetruv.'
        : 'Status pembayaran belum dapat dikonfirmasi. Periksa koneksi, lalu coba lagi.')
    } finally {
      statusFlight.current = false
      setLoading(false)
      if (!quiet) setRefreshing(false)
    }
  }, [context])

  useEffect(() => {
    if (context) refreshStatus()
  }, [context, refreshStatus])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (payment?.state !== 'Pending') return undefined
    const timer = window.setInterval(() => refreshStatus(true), 12000)
    return () => window.clearInterval(timer)
  }, [payment?.state, refreshStatus])

  useEffect(() => {
    if (payment?.state !== 'Pending' || !payment.expiresAt) return
    const expiry = Date.parse(payment.expiresAt)
    if (Number.isFinite(expiry) && now >= expiry &&
      !expiredChecked.current.has(payment.expiresAt)) {
      expiredChecked.current.add(payment.expiresAt)
      refreshStatus(true)
    }
  }, [payment?.state, payment?.expiresAt, now, refreshStatus])

  const retryPayment = async () => {
    if (!context || !mayInitiatePayment(payment) || retryFlight.current || statusFlight.current) return
    retryFlight.current = true
    setRetrying(true)
    setError('')
    try {
      // Read the newest server state first. A refresh/retry must never create a
      // second provider session while the previous attempt is still active.
      const latest = normalizePaymentState(await getOrderPaymentStatus({
        id:context.orderId, orderAccessToken:context.orderAccessToken,
      }), context.orderId)
      setPayment(latest)
      if (!mayInitiatePayment(latest)) return

      const options = await getCheckoutPaymentOptions()
      if (isDev && !options.isSandbox) {
        throw new Error('DEV hanya boleh memulai pembayaran dengan gateway sandbox yang terkonfigurasi.')
      }
      const selected = options.canAcceptLivePayments &&
        options.availableMethods?.find(item => item.code === context.methodCode && item.paymentFee != null)
      if (!selected) throw new Error('Metode pembayaran ini belum tersedia. Jangan membuat pembayaran baru.')

      // Only explicit user interaction can call this POST. Backend performs
      // order-level locking and returns an existing active session when present.
      await startOrderPayment({
        id:context.orderId, orderAccessToken:context.orderAccessToken,
      }, context.methodCode)
      const refreshed = normalizePaymentState(await getOrderPaymentStatus({
        id:context.orderId, orderAccessToken:context.orderAccessToken,
      }), context.orderId)
      setPayment(refreshed)
    } catch (e) {
      // A provider timeout may have created a session; always recover with GET.
      try {
        const recovered = normalizePaymentState(await getOrderPaymentStatus({
          id:context.orderId, orderAccessToken:context.orderAccessToken,
        }), context.orderId)
        setPayment(recovered)
      } catch {
        setPayment(null)
      }
      setError(e.message || 'Pembayaran tidak dapat dimulai. Periksa status sebelum mengulang.')
    } finally {
      retryFlight.current = false
      setRetrying(false)
    }
  }

  if (!context) {
    return <div className="digital-shell">
      <Navbar variant="default" />
      <main className="payment-session-page">
        <section className="payment-session-empty" role="status">
          <AlertCircle size={32} />
          <h1>Tidak ada sesi pembayaran</h1>
          <p>Halaman pembayaran hanya dapat dibuka setelah order berhasil dibuat. Tidak ada invoice atau QR yang diterbitkan.</p>
          <div className="payment-session-actions">
            <a href="/cart">Kembali ke keranjang</a><a className="is-secondary" href="/order-status">Cek pesanan</a>
          </div>
        </section>
      </main>
    </div>
  }

  const state = payment?.state
  const pending = state === 'Pending' && payment?.hasActivePaymentSession
  const deadline = Date.parse(payment?.expiresAt || '')
  const expiredInBrowser = pending && Number.isFinite(deadline) && now >= deadline
  const active = pending && !expiredInBrowser
  const qr = active && context.methodCode === 'QRIS' && typeof payment.qrString === 'string' &&
    payment.qrString.length > 0 && payment.qrString.length <= 4096 ? payment.qrString : null
  const url = active ? paymentLink(payment.paymentUrl) : null
  const countdown = active ? formatPaymentCountdown(payment.expiresAt, now) : null
  const title = statusText[state]?.[0] || 'Memeriksa pembayaran'
  const description = statusText[state]?.[1] || 'Status pembayaran sedang diperiksa ke backend.'

  return <div className="digital-shell">
    <Navbar variant="default" />
    <main className="payment-session-page">
      <header className="payment-session-heading">
        <div>
          <a className="payment-session-back" href="/order-status"><ArrowLeft size={16} /> Cek pesanan</a>
          <h1>Selesaikan Pembayaran</h1>
          <p>Nomor pesanan: <strong>{context.orderNumber}</strong></p>
        </div>
        <span className="payment-session-method">{labels[context.methodCode] || context.methodCode}</span>
      </header>

      <div className="payment-session-layout">
        <section className="payment-session-card payment-session-instructions" aria-live="polite">
          {loading ? <div className="payment-session-loading"><LoaderCircle size={30} className="checkout-spinner" /><p>Memeriksa status pembayaran dari server...</p></div>
            : <>
              <div className="payment-session-status">
                {state === 'Paid' ? <CheckCircle2 size={28} className="is-paid" />
                  : <Clock3 size={28} />}
                <div><h2>{error && !payment ? 'Status belum dapat diverifikasi' : title}</h2><p>{error && !payment ? error : description}</p></div>
              </div>
              {active ? <>
                {countdown !== null && <p className="payment-session-expiry"><Clock3 size={16} /> Sisa waktu pembayaran <strong>{countdown}</strong></p>}
                {qr && <div className="payment-session-qr">
                  <QRCodeSVG value={qr} size={240} level="M" marginSize={2} title="QRIS dari penyedia pembayaran" />
                  <p>Scan QRIS dari penyedia pembayaran. Jangan bayar lagi jika transaksi sudah terdebit.</p>
                </div>}
                {url && <a className="payment-session-action-link" href={url}>
                  {context.methodCode === 'GOPAY' ? 'Buka pembayaran GoPay' : 'Buka instruksi pembayaran'} <ExternalLink size={16} />
                </a>}
                {!qr && !url && <p className="payment-session-notice"><AlertCircle size={17} /> Provider belum memberikan instruksi pembayaran yang dapat ditampilkan. Periksa status atau hubungi support.</p>}
              </> : null}
              {expiredInBrowser && <p className="payment-session-notice"><AlertCircle size={17} /> Waktu provider sudah terlewati. Konfirmasi ulang status sebelum melakukan pembayaran.</p>}
              {payment && <p className="payment-session-checked"><ShieldCheck size={15} /> Status bersumber dari API Zetruv, terakhir dicek {new Date(payment.checkedAt || now).toLocaleTimeString('id-ID')}.</p>}
              {error && payment && <p className="payment-session-notice" role="alert">{error}</p>}
              <div className="payment-session-actions">
                <button type="button" disabled={refreshing || retrying} className="is-secondary"
                  onClick={() => refreshStatus()}><RefreshCw size={16} /> {refreshing ? 'Memeriksa...' : 'Periksa status'}</button>
                {mayInitiatePayment(payment) && <button type="button" disabled={retrying || refreshing}
                  onClick={retryPayment}>{retrying ? 'Menghubungi provider...' : state === 'NotStarted' ? 'Mulai pembayaran' : 'Coba bayar lagi'}</button>}
                {state === 'Paid' && <a href="/order-status">Lihat status pesanan</a>}
              </div>
            </>}
        </section>

        <aside className="payment-session-card payment-session-summary">
          <h2>Ringkasan Pesanan</h2>
          <p>Invoice diterbitkan oleh backend setelah checkout, bukan dari contoh UI.</p>
          <div className="payment-session-lines">
            {context.items.map((item, index) => <div key={index} className="payment-session-line">
              <div><strong>{item.productName}</strong><span>{item.variantName} · {item.quantity} item</span></div>
              <strong>{rupiah(item.lineTotal)}</strong>
            </div>)}
          </div>
          <div className="payment-session-total"><span>Total order</span><strong>{rupiah(context.grandTotal)}</strong></div>
          <small>Nominal pesanan berasal dari respons create-order backend. Status Paid hanya dapat ditentukan oleh webhook terverifikasi atau rekonsiliasi backend.</small>
        </aside>
      </div>
    </main>
  </div>
}
