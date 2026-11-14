import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
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
  BCA_VA:'virtualAccount',
}
const statusText = {
  NotStarted: ['paymentNotStarted','yourOrderWasCreatedStartPaymentWhen'],
  Pending: ['awaitingPayment','followThePaymentProviderSOfficialInstructions'],
  Paid: ['paymentConfirmed','yourPaymentIsConfirmedWeLlNow'],
  Failed: ['paymentFailed','noPaymentWasConfirmedCheckTheStatus'],
  Expired: ['paymentExpired','thePreviousPaymentInstructionsHaveExpiredDo'],
  Refunded: ['paymentRefunded','theRefundStatusHasBeenUpdated'],
  Cancelled: ['orderCancelled','thisOrderCanTBePaidAgain'],
}
const isDev = import.meta.env.MODE === 'dev'

export default function PaymentPage() {
  const copy = useStorefrontCopy()
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
        ? copy.theOrderSessionIsInvalidOrExpired
        : copy.weCouldnTConfirmThePaymentStatus)
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
        throw new Error(copy.devPaymentsMustUseTheConfiguredSandbox)
      }
      const selected = options.canAcceptLivePayments &&
        options.availableMethods?.find(item => item.code === context.methodCode && item.paymentFee != null)
      if (!selected) throw new Error(copy.thisPaymentMethodIsUnavailableDoNot)

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
      setError(copy.weCouldnTStartYourPaymentCheck)
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
          <h1>{copy.noPaymentSession}</h1>
          <p>{copy.thisPageIsAvailableOnceAnOrder}</p>
          <div className="payment-session-actions">
            <a href="/cart">{copy.backToCart2}</a><a className="is-secondary" href="/order-status">{copy.checkOrder2}</a>
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
  const title = copy[statusText[state]?.[0]] || copy.checkingPayment
  const description = copy[statusText[state]?.[1]] || copy.weReCheckingTheLatestPaymentStatus

  return <div className="digital-shell">
    <Navbar variant="default" />
    <main className="payment-session-page">
      <header className="payment-session-heading">
        <div>
          <a className="payment-session-back" href="/order-status"><ArrowLeft size={16} /> {copy.checkOrder2}</a>
          <h1>{copy.completeYourPayment}</h1>
          <p>{copy.orderNumber2} <strong>{context.orderNumber}</strong></p>
        </div>
        <span className="payment-session-method">{context.methodCode === 'BCA_VA' ? copy.virtualAccount : labels[context.methodCode] || context.methodCode}</span>
      </header>

      <div className="payment-session-layout">
        <section className="payment-session-card payment-session-instructions" aria-live="polite">
          {loading ? <div className="payment-session-loading"><LoaderCircle size={30} className="checkout-spinner" /><p>{copy.checkingTheLatestPaymentStatus}</p></div>
            : <>
              <div className="payment-session-status">
                {state === 'Paid' ? <CheckCircle2 size={28} className="is-paid" />
                  : <Clock3 size={28} />}
                <div><h2>{error && !payment ? copy.statusCouldnTBeVerified : title}</h2><p>{error && !payment ? error : description}</p></div>
              </div>
              {active ? <>
                {countdown !== null && <p className="payment-session-expiry"><Clock3 size={16} /> {copy.timeRemainingToPay} <strong>{countdown}</strong></p>}
                {qr && <div className="payment-session-qr">
                  <QRCodeSVG value={qr} size={240} level="M" marginSize={2} title={copy.qrisFromThePaymentProvider} />
                  <p>{copy.scanTheProviderSQrisCodeDon}</p>
                </div>}
                {url && <a className="payment-session-action-link" href={url}>
                  {context.methodCode === 'GOPAY' ? copy.openGopayPayment : copy.openPaymentInstructions} <ExternalLink size={16} />
                </a>}
                {!qr && !url && <p className="payment-session-notice"><AlertCircle size={17} /> {copy.paymentInstructionsAreUnavailableCheckTheStatus}</p>}
              </> : null}
              {expiredInBrowser && <p className="payment-session-notice"><AlertCircle size={17} /> {copy.thePaymentWindowHasEndedCheckThe}</p>}
              {payment && <p className="payment-session-checked"><ShieldCheck size={15} /> {copy.statusFromZetruvLastChecked} {new Date(payment.checkedAt || now).toLocaleTimeString('id-ID')}.</p>}
              {error && payment && <p className="payment-session-notice" role="alert">{error}</p>}
              <div className="payment-session-actions">
                <button type="button" disabled={refreshing || retrying} className="is-secondary"
                  onClick={() => refreshStatus()}><RefreshCw size={16} /> {refreshing ? 'Memeriksa...' : copy.checkStatus}</button>
                {mayInitiatePayment(payment) && <button type="button" disabled={retrying || refreshing}
                  onClick={retryPayment}>{retrying ? copy.contactingThePaymentProvider2 : state === 'NotStarted' ? copy.startPayment : copy.tryPayingAgain}</button>}
                {state === 'Paid' && <a href={`/account/orders/${context.orderId}`}>{copy.viewOrderStatus}</a>}
              </div>
            </>}
        </section>

        <aside className="payment-session-card payment-session-summary">
          <h2>{copy.orderSummary}</h2>
          <p>{copy.yourInvoiceIsIssuedOnceCheckoutIs}</p>
          <div className="payment-session-lines">
            {context.items.map((item, index) => <div key={index} className="payment-session-line">
              <div><strong>{item.productName}</strong><span>{item.variantName} · {item.quantity} {copy.items}</span></div>
              <strong>{rupiah(item.lineTotal)}</strong>
            </div>)}
          </div>
          <div className="payment-session-total"><span>{copy.orderTotal}</span><strong>{rupiah(context.grandTotal)}</strong></div>
          <small>{copy.weLlUpdateThePaymentStatusOnce}</small>
        </aside>
      </div>
    </main>
  </div>
}
