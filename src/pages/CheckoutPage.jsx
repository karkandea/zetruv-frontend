import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { clearCartGroup, readCart } from '../services/cartService'
import { createCheckoutOrder, initiatePayment, validateGameAccount } from '../services/commerceService'
import '../styles/commerce.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const labels = { AUTO_ID: 'Top Up Via ID', MANUAL_LOGIN: 'Top Up Via Login', MANUAL: 'Layanan Manual' }
const LAST_ORDER_KEY = 'zetruv-last-order-v1'

function isValidationFresh(item) {
  return item.validationId && item.validationExpiresAt && new Date(item.validationExpiresAt).getTime() > Date.now() + 15000
}

export default function CheckoutPage() {
  const requestedMethod = new URLSearchParams(window.location.search).get('method') || ''
  const cart = readCart()
  const method = requestedMethod || cart[0]?.fulfillmentMethod || ''
  const items = useMemo(() => cart.filter((item) => item.fulfillmentMethod === method), [cart, method])
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [credentials, setCredentials] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  function setCredential(cartKey, key, value) {
    setCredentials((current) => ({ ...current, [cartKey]: { ...(current[cartKey] || {}), [key]: value } }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!items.length || submitting) return
    if (!customer.email.trim() && !customer.phone.trim()) {
      setError('Isi email atau nomor WhatsApp agar order bisa dicek kembali.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const checkoutItems = []
      for (const item of items) {
        let gameAccountValidationId = item.validationId || null
        if (method === 'AUTO_ID' && !isValidationFresh(item)) {
          const validation = await validateGameAccount(item.productId, item.accountFields || {})
          gameAccountValidationId = validation.validationId
        }

        let loginCredentials = null
        if (method === 'MANUAL_LOGIN') {
          const value = credentials[item.cartKey] || {}
          if (!value.login?.trim() || !value.password?.trim()) {
            throw new Error(`Login dan password wajib diisi untuk ${item.productName} · ${item.variantName}.`)
          }
          loginCredentials = { login: value.login.trim(), password: value.password }
          if (value.server?.trim()) loginCredentials.server = value.server.trim()
        }

        checkoutItems.push({
          productVariantId: item.variantId,
          quantity: item.quantity,
          gameAccountValidationId,
          loginCredentials,
        })
      }

      const order = await createCheckoutOrder({
        customerName: customer.name.trim() || null,
        customerEmail: customer.email.trim() || null,
        customerPhone: customer.phone.trim() || null,
        items: checkoutItems,
      })

      let payment = null
      let paymentError = ''
      try {
        payment = await initiatePayment(order.id, order.orderAccessToken)
      } catch (err) {
        paymentError = err.message || 'Payment could not be initiated.'
      }

      window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ order, payment, paymentError, customer }))
      clearCartGroup(method)
      window.location.href = `/order-status?order=${encodeURIComponent(order.orderNumber)}`
    } catch (err) {
      setError(err.message || 'Checkout gagal. Coba lagi.')
      setSubmitting(false)
    }
  }

  return (
    <div className="commerce-shell">
      <Navbar variant="loginCatalog" />
      <main className="commerce-page commerce-container">
        <header className="commerce-heading"><div><small>CHECKOUT</small><h1>{labels[method] || 'Checkout'}</h1><p>Credential login hanya dikirim saat checkout dan tidak disimpan di cart browser.</p></div><a href="/cart">← Kembali ke cart</a></header>
        {!items.length ? <section className="commerce-empty"><h2>Tidak ada item untuk layanan ini</h2><a href="/cart">Buka keranjang</a></section> : (
          <form className="checkout-layout" onSubmit={submit}>
            <div className="checkout-main">
              <section className="checkout-card"><h2>Kontak order</h2><div className="checkout-fields"><label>Nama<input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Nama kamu" /></label><label>Email<input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="nama@email.com" /></label><label>WhatsApp<input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></label></div></section>

              <section className="checkout-card"><h2>Item</h2>{items.map((item) => (
                <article className="checkout-item" key={item.cartKey}>
                  <img src={item.thumbnailUrl || '/assets/home/category-topup.png'} alt="" />
                  <div><strong>{item.productName}</strong><span>{item.variantName} · ×{item.quantity}</span>{item.accountLabel && <small>Akun: {item.accountLabel}</small>}</div>
                  <b>{rupiah(item.unitPrice * item.quantity)}</b>
                </article>
              ))}</section>

              {method === 'MANUAL_LOGIN' && <section className="checkout-card"><h2>Data login game</h2><p className="checkout-note">Data ini dienkripsi oleh backend dan otomatis dibersihkan setelah fulfillment selesai / expired.</p>{items.map((item) => <div className="credential-block" key={item.cartKey}><strong>{item.productName} · {item.variantName}</strong><div className="checkout-fields"><label>Email / Username<input autoComplete="off" value={credentials[item.cartKey]?.login || ''} onChange={(e) => setCredential(item.cartKey, 'login', e.target.value)} /></label><label>Password<input type="password" autoComplete="new-password" value={credentials[item.cartKey]?.password || ''} onChange={(e) => setCredential(item.cartKey, 'password', e.target.value)} /></label><label>Server / Region (opsional)<input value={credentials[item.cartKey]?.server || ''} onChange={(e) => setCredential(item.cartKey, 'server', e.target.value)} /></label></div></div>)}</section>}
            </div>

            <aside className="checkout-summary"><small>RINGKASAN</small>{items.map((item) => <div key={item.cartKey}><span>{item.variantName} ×{item.quantity}</span><strong>{rupiah(item.unitPrice * item.quantity)}</strong></div>)}<hr /><div className="checkout-grand"><span>Total</span><strong>{rupiah(total)}</strong></div>{error && <p className="checkout-error">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? 'Memproses…' : 'Buat order & lanjut bayar'}</button><small>Harga final divalidasi ulang oleh backend saat order dibuat.</small></aside>
          </form>
        )}
      </main>
    </div>
  )
}
