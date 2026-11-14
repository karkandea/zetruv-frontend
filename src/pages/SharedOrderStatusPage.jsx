import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useRef, useState } from 'react'
import { ArrowRight, ClipboardList, CircleAlert, Mail, PackageSearch, RefreshCw, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import { apiRequest } from '../api/httpClient'
import '../styles/shared-order-status.css'

const ORDER_STATES = ['pending', 'processing', 'completed', 'cancelled']
const PAYMENT_STATES = ['pending', 'paid', 'failed', 'refunded']
const FULFILLMENT_STATES = ['pending', 'processing', 'completed', 'failed', 'cancelled']

function stateKey(value, states) {
  return typeof value === 'number' ? states[value] : String(value || '').trim().toLowerCase()
}

function stateLabel(state, copy, pending) {
  return { pending, processing: copy.processing, completed: copy.completed, cancelled: copy.cancelled,
    paid: copy.paid, failed: copy.failed, refunded: copy.refunded }[state] || copy.unknown
}

function money(amount, currency = 'IDR') {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return currency === 'IDR' ? 'Rp' + new Intl.NumberFormat('id-ID').format(value) : new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(value)
}

function dateTime(value, language) {
  if (!value) return '—'
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return '—'
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(timestamp) + ' WIB'
}

function OrderLookupResult({ order, onReset }) {
  const language = useNavbarLanguage()
  const copy = useStorefrontCopy()
  const paymentState = stateKey(order.paymentStatus, PAYMENT_STATES)
  const payment = stateLabel(paymentState, copy, copy.unpaid)
  const orderState = stateKey(order.status, ORDER_STATES)
  const status = stateLabel(orderState, copy, copy.awaitingProcessing)
  const isPaid = paymentState === 'paid'
  const isComplete = orderState === 'completed'
  return <section className="sos-lookup-result" aria-label={copy.orderLookupResult}>
    <header className="sos-lookup-result__header">
      <div>
        <span className="sos-lookup-eyebrow">{copy.verifiedOrder}</span>
        <h2>{order.orderNumber}</h2>
        <p>{copy.createdOn} {dateTime(order.createdAt, language)}</p>
      </div>
      <button type="button" className="sos-lookup-secondary" onClick={onReset}><RefreshCw size={16} aria-hidden="true" /> {copy.checkAnotherOrder}</button>
    </header>
    <div className="sos-lookup-statuses">
      <div><span>{copy.orderStatus}</span><strong className={isComplete ? 'is-success' : ''}>{status}</strong></div>
      <div><span>{copy.payment2}</span><strong className={isPaid ? 'is-success' : ''}>{payment}</strong></div>
      <div><span>{copy.paymentTotal2}</span><strong>{money(order.grandTotal, order.currency)}</strong></div>
    </div>
    {order.hasFulfillmentIssue && <p className="sos-lookup-warning" role="status"><CircleAlert size={17} aria-hidden="true" /> {copy.weHadTroubleProcessingAnItemContact}</p>}
    <div className="sos-lookup-items">
      <h3>{copy.products}{order.items?.length || 0})</h3>
      {(order.items || []).map((item, index) => (
        <article className="sos-lookup-item" key={String(item.productSlug || item.productName) + '-' + index}>
          {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <span className="sos-lookup-item__fallback"><PackageSearch size={24} aria-hidden="true" /></span>}
          <div className="sos-lookup-item__copy"><strong>{item.productName}</strong><span>{item.variantName || item.gameName || copy.zetruvProduct} · {Number(item.quantity) || 1} {copy.items}</span><small>{stateLabel(stateKey(item.fulfillmentStatus, FULFILLMENT_STATES), copy, copy.pending)}</small></div>
          <strong>{money(item.lineTotal, order.currency)}</strong>
        </article>
      ))}
    </div>
    <div className="sos-lookup-summary">
      <div><span>{copy.subtotal}</span><strong>{money(order.subtotal, order.currency)}</strong></div>
      {Number(order.discountAmount) > 0 && <div><span>{copy.discount}</span><strong>-{money(order.discountAmount, order.currency)}</strong></div>}
      {Number(order.shippingAmount) > 0 && <div><span>{copy.shipping}</span><strong>{money(order.shippingAmount, order.currency)}</strong></div>}
      <div className="sos-lookup-summary__total"><span>{copy.total}</span><strong>{money(order.grandTotal, order.currency)}</strong></div>
    </div>
    {order.shipment && <section className="sos-lookup-shipment">
      <h3>{copy.shippingInformation}</h3>
      <p>{order.shipment.provider || copy.courier} {order.shipment.serviceName || ''}</p>
      <p>{order.shipment.trackingNumber ? copy.trackingNumber + order.shipment.trackingNumber : copy.trackingNumberIsUnavailable}</p>
    </section>}
    <p className="sos-lookup-security"><ShieldCheck size={15} aria-hidden="true" /> {copy.orderAndPaymentStatusAreConfirmedBy}</p>
  </section>
}

export default function SharedOrderStatusPage() {
  const copy = useStorefrontCopy()
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
      setError('enterTheOrderNumberAndTheEmail')
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
      if (!result?.orderNumber) throw new Error(copy.orderInformationIsUnavailable)
      // The lookup can include a short-lived payment access grant; it is not needed
      // to display status and must not be persisted or exposed in the UI.
      const { orderAccessToken: unusedToken, orderAccessTokenExpiresAt: unusedExpiry, ...safeOrder } = result
      setOrder(safeOrder)
    } catch (issue) {
      if (id !== requestId.current) return
      setError(issue?.status === 404
        ? 'orderNotFoundCheckTheOrderNumber'
        : issue?.status === 429
          ? 'tooManyAttemptsTryAgainInA'
          : 'weCouldnTGetTheOrderStatus')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  return <div className="sos-shell">
    <Navbar variant="account" />
    <main className="sos-lookup-page">
      <div className="sos-lookup-intro">
        <span className="sos-lookup-intro__icon"><ClipboardList size={28} aria-hidden="true" /></span>
        <h1>{copy.checkOrder}</h1>
        <p>{copy.enterYourOrderNumberAndCheckoutContact}</p>
      </div>

      <form className="sos-lookup-form" onSubmit={handleLookup}>
        <label htmlFor="sos-order-number">{copy.orderNumber}</label>
        <input id="sos-order-number" name="orderNumber" type="text" autoComplete="off" maxLength={41}
          placeholder={copy.exampleZtr} required value={number}
          onChange={e => { setNumber(e.target.value); clearResult() }} />
        <fieldset className="sos-lookup-contact-method">
          <legend>{copy.verifyUsing}</legend>
          <label><input type="radio" name="method" value="email" checked={method === 'email'} onChange={() => { setMethod('email'); setContact(''); clearResult() }} /> {copy.email}</label>
          <label><input type="radio" name="method" value="phone" checked={method === 'phone'} onChange={() => { setMethod('phone'); setContact(''); clearResult() }} /> {copy.phoneNumber2}</label>
        </fieldset>
        <label htmlFor="sos-contact">{method === 'email' ? copy.checkoutEmailAddress : copy.checkoutPhoneNumber}</label>
        <input id="sos-contact" name="contact" type={method === 'email' ? 'email' : 'tel'} autoComplete={method === 'email' ? 'email' : 'tel'}
          placeholder={method === 'email' ? 'nama@email.com' : '08xxxxxxxxxx'} required value={contact}
          onChange={e => { setContact(e.target.value); clearResult() }} />
        {error && <p className="sos-lookup-error" role="alert"><CircleAlert size={17} aria-hidden="true" /> {copy[error]}</p>}
        <button className="sos-lookup-submit" type="submit" disabled={loading}>
          {loading ? copy.checkingYourOrder : copy.checkOrderStatus}
          {!loading && <ArrowRight size={18} aria-hidden="true" />}
        </button>
        <p className="sos-lookup-note"><Mail size={15} aria-hidden="true" /> {copy.useTheEmailAddressOrPhoneNumber}</p>
      </form>
      {order && <OrderLookupResult order={order} onReset={() => { clearResult(); setNumber(''); setContact(''); document.getElementById('sos-order-number')?.focus() }} />}
      {!order && !loading && <div className="sos-lookup-help"><strong>{copy.noOrderYet}</strong><span>{copy.chooseAProductAndContinueToCheckout}</span><a href="/search">{copy.browseProducts} <ArrowRight size={15} aria-hidden="true" /></a></div>}
    </main>
  </div>
}
