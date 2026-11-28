import { LoginPurchaseProgress } from '../components/LoginPurchaseProgress'
import GameItemAdminContact from '../components/GameItemAdminContact'
import { Bone, LoadingRegion, SkeletonLines } from '../components/Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, ExternalLink, RefreshCw, ShieldCheck, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import { apiRequest } from '../api/httpClient'
import { restoreCustomerSession, readCustomerSession } from '../services/customerCartSync'
import {
  getCheckoutPaymentOptions, getOrderPaymentStatus, startOrderPayment,
} from '../services/checkoutGatewayService'
import {
  readPaymentContext, normalizePaymentState, mayInitiatePayment,
  formatPaymentCountdown, paymentLink, isMidtransMethod, midtransPaymentLink, midtransQrisImage, paymentThumbnail, enrichPaymentItems, QRIS_SIMULATOR_URL,
} from '../services/paymentSession'
import '../styles/digital-commerce.css'
import '../styles/payment-session.css'

const rupiah = value => 'Rp' + new Intl.NumberFormat('id-ID').format(Number(value) || 0)
const labels = {
  MIDTRANS_SNAP:'Midtrans',
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
  const [summaryItems,setSummaryItems] = useState(()=>context?.items || [])
  const [copiedQr,setCopiedQr]=useState(false)
  const pageRef=useRef(null)

  useLayoutEffect(()=>{
    const main=pageRef.current
    const nav=main?.parentElement?.querySelector('header.navbar')
    if(!main || !nav) return
    const measure=()=>{
      const style=getComputedStyle(nav)
      const top=Number.parseFloat(style.top)||0
      main.style.setProperty('--payment-top-space', (style.position==='fixed' ? Math.max(0,nav.offsetHeight+top)+24 : 24)+'px')
    }
    measure()
    const observer=new ResizeObserver(measure)
    observer.observe(nav)
    window.addEventListener('resize',measure)
    return ()=>{observer.disconnect();window.removeEventListener('resize',measure)}
  },[context])

  useEffect(()=>{
    if(!context || context.items.every(i=>i.thumbnailUrl && i.kind)) return
    const controller=new AbortController()
    ;(async()=>{
      if(!readCustomerSession()?.accessToken) await restoreCustomerSession()
      const token=readCustomerSession()?.accessToken
      if(!token || controller.signal.aborted) return
      const detail=await apiRequest('/me/orders/'+encodeURIComponent(context.orderId), {cache:'no-store',signal:controller.signal,headers:{Authorization:'Bearer '+token}})
      if(!controller.signal.aborted && detail.id===context.orderId)
        setSummaryItems(enrichPaymentItems(context.items,detail.items))
    })().catch(()=>{})
    return ()=>controller.abort()
  },[context])
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
      <Navbar variant="default"  homepageMobileMenu />
      <main className="payment-session-page" ref={pageRef}>
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
  const qrImage = active && context.methodCode === 'MIDTRANS_OTHER_QRIS' ? midtransQrisImage(payment.paymentUrl) : null
  const candidateUrl = active && !qrImage ? paymentLink(payment.paymentUrl) : null
  const url = isMidtransMethod(context.methodCode) && candidateUrl
    ? midtransPaymentLink(candidateUrl)
    : candidateUrl
  const countdown = active ? formatPaymentCountdown(payment.expiresAt, now) : null
  const testPayment = isDev && isMidtransMethod(context.methodCode)
  const title = testPayment && state==='Paid' ? copy.loginPurchasePaymentTestSuccess : copy[statusText[state]?.[0]] || copy.checkingPayment
  const description = testPayment && state==='Paid' ? copy.loginPurchasePaymentTestPaid : copy[statusText[state]?.[1]] || copy.weReCheckingTheLatestPaymentStatus

  return <div className="digital-shell">
    <Navbar variant="default"  homepageMobileMenu />
    <main className="payment-session-page" ref={pageRef}>
      <header className="payment-session-heading">
        <div>
          <a className="payment-session-back" href="/account/orders"><ArrowLeft size={18} aria-hidden="true" /> {copy.myOrders}</a>
          <h1>{state==='Paid' ? title : copy.completeYourPayment}</h1>
          <p>{copy.orderNumber2} <strong>{context.orderNumber}</strong></p>
        </div>
        <span className="payment-session-method">{context.methodCode === 'BCA_VA' ? copy.virtualAccount : labels[context.methodCode] || (isMidtransMethod(context.methodCode) ? context.methodCode.replace('MIDTRANS_','').replace('OTHER_QRIS','QRIS').replaceAll('_',' ') : context.methodCode)}</span>
      </header>

      <LoginPurchaseProgress current={2}/>
      <div className="payment-session-layout">
        <section className="payment-session-card payment-session-instructions" aria-live="polite">
          {loading ? <LoadingRegion label={copy.checkingTheLatestPaymentStatus}>
            <div className="payment-session-status"><Bone variant="circle" /><SkeletonLines /></div>
            {context.methodCode === 'QRIS' && <div className="payment-session-qr">
              <Bone variant="control" width="240px" height="240px" />
            </div>}
            <div className="payment-session-actions"><Bone variant="control" width="150px" /></div>
          </LoadingRegion>
            : <>
              <div className="payment-session-status">
                {state === 'Paid' ? <CheckCircle2 size={28} className="is-paid" />
                  : <Clock3 size={28} />}
                <div><h2>{error && !payment ? copy.statusCouldnTBeVerified : title}</h2><p>{error && !payment ? error : description}</p></div>
              </div>
              <GameItemAdminContact paid={state === 'Paid'} phone={payment?.gameItemSupportPhone} orderNumber={context.orderNumber} />
              {active ? <>
                {countdown !== null && <p className="payment-session-expiry"><Clock3 size={16} /> {copy.timeRemainingToPay} <strong>{countdown}</strong></p>}
                {qrImage && <div className="payment-session-qr payment-session-native-qr">
                  <strong>{copy.nativeQrisAmount} <span>{rupiah(context.grandTotal)}</span></strong>
                  <img src={qrImage} alt={copy.qrisFromThePaymentProvider} width="240" height="240" referrerPolicy="no-referrer"/>
                  <p>{copy.nativeQrisSandboxInstruction}</p>
                  <a className="payment-session-action-link" href={QRIS_SIMULATOR_URL} target="_blank" rel="noopener noreferrer">{copy.nativeQrisSimulator} <ExternalLink size={16}/></a>
                  <button type="button" className="payment-session-copy-qr" onClick={async()=>{try{await navigator.clipboard.writeText(qrImage);setCopiedQr(true);setError('')}catch{setError(copy.nativeQrisCopyError)}}}>{copiedQr?copy.copied:copy.nativeQrisCopyLink}</button>
                </div>}
                {qr && <div className="payment-session-qr">
                  <QRCodeSVG value={qr} size={240} level="M" marginSize={2} title={copy.qrisFromThePaymentProvider} />
                  <p>{copy.scanTheProviderSQrisCodeDon}</p>
                </div>}
                {url && <a className="payment-session-action-link" href={url} target="_self" rel="noreferrer">
                  {isMidtransMethod(context.methodCode) ? copy.openMidtransSandboxPayment
                    : context.methodCode === 'GOPAY' ? copy.openGopayPayment : copy.openPaymentInstructions} <ExternalLink size={16} />
                </a>}
                {!qr && !qrImage && !url && <p className="payment-session-notice"><AlertCircle size={17} /> {copy.paymentInstructionsAreUnavailableCheckTheStatus}</p>}
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
          
          <div className="payment-session-lines">
            {summaryItems.map((item, index) => {
              const category={Joki:copy.gameBoosting,TopUpLogin:copy.topUpByLogin,TopUpId:copy.topUpById,GameItem:copy.gameItems,GameAccount:copy.gameAccount,GameVoucher:copy.gameVouchers,Merchandise:copy.merchandise}[item.kind]
              const thumb=paymentThumbnail(item.thumbnailUrl)
              return <article key={index} className="payment-session-line">
                <span className="payment-session-thumb">{thumb?<img src={thumb} alt="" onError={e=>{e.currentTarget.hidden=true}}/>:null}<Package size={22} aria-hidden="true"/></span>
                <div className="payment-session-item-copy">{category&&<small className="payment-session-item-category">{category}</small>}<strong>{item.productName}</strong><span>{item.variantName} · {item.quantity} {copy.items}</span></div>
                <strong className="payment-session-line-price">{rupiah(item.lineTotal)}</strong>
              </article>
            })}
          </div>
          <div className="payment-session-total"><span>{copy.orderTotal}</span><strong>{rupiah(context.grandTotal)}</strong></div>
          {state!=='Paid' && <small>{copy.weLlUpdateThePaymentStatusOnce}</small>}
        </aside>
      </div>
    </main>
  </div>
}
