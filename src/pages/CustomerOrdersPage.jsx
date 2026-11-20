import { Bone, LoadingRegion, SkeletonItems, SkeletonLines } from '../components/Skeleton'
import { useEffect, useId, useState } from 'react'
import { ArrowLeft, ArrowRight, Package, RefreshCw, Star } from 'lucide-react'
import { apiRequest } from '../api/httpClient'
import AuthModal from '../components/AuthModal'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { activateCustomerCart, restoreCustomerSession, setCustomerSession } from '../services/customerCartSync'
import { formatCopy } from '../services/storefrontCopy'
import { AccountShell, PageHeader, useCustomerSession } from './AccountPages'
import { dateTime, money, OrderDetailsSkeleton, OrderStatusDetails, orderStatusLabel, paymentStatusLabel } from './SharedOrderStatusPage'
import '../styles/customer-orders.css'

const guestLookupUrl = '/order-status?guest=1'
const pageSize = 20
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i

function requestOrder(path, accessToken, signal) {
  return apiRequest(path, {
    cache: 'no-store',
    signal,
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

function OrdersSkeleton({ orderId, label }) {
  if (orderId) return <OrderDetailsSkeleton label={label} />
  return <LoadingRegion label={label}>
    <div className="customer-orders-list">
      <SkeletonItems className="customer-order-card">
        <div className="customer-order-card__header"><Bone width="42%" /></div>
        <div className="customer-order-card__item"><Bone variant="thumb" /><SkeletonLines /></div>
        <div className="customer-order-card__statuses"><Bone width="50%" /></div>
        <div className="customer-order-card__footer"><Bone width="33%" /></div>
      </SkeletonItems>
    </div>
  </LoadingRegion>
}

function OrderMessage({ title, description, children }) {
  return <section className="account-orders-empty" aria-live="polite">
    <img src="/assets/account/orders-empty.svg" alt="" width="132" height="129" />
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {children}
  </section>
}

export function RequireOrderSession({ children }) {
  const copy = useStorefrontCopy()
  const session = useCustomerSession()
  const [restoring, setRestoring] = useState(true)
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    let current = true
    const onRestored = () => { if (current) setRestoring(false) }
    restoreCustomerSession().then(onRestored, onRestored)
    return () => { current = false }
  }, [])

  function signIn(response) {
    setCustomerSession(response)
    activateCustomerCart().catch(() => {})
  }

  if (session?.accessToken) return children

  return <AccountShell active="orders">
    <PageHeader title={copy.myOrders} />
    {restoring ? <OrdersSkeleton label={copy.loadingOrders} /> : <>
      <OrderMessage title={copy.logInToViewOrders} description={copy.accountOrdersIntro}>
        <button type="button" className="account-btn account-btn--primary" aria-haspopup="dialog" onClick={() => setAuthMode('login')}>{copy.login}</button>
      </OrderMessage>
      {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={signIn} />}
    </>}
  </AccountShell>
}

export default function CustomerOrdersPage({ orderId }) {
  const copy = useStorefrontCopy()
  const accessToken = useCustomerSession()?.accessToken
  const [authMode, setAuthMode] = useState(null)
  const group = new URLSearchParams(window.location.search).get('group') === 'history' ? 'history' : 'active'
  const listUrl = window.location.pathname === '/account/orders' || orderId ? '/account/orders' : '/order-status'
  const login = <button type="button" className="account-btn account-btn--primary" aria-haspopup="dialog" onClick={() => setAuthMode('login')}>{copy.login}</button>

  return <AccountShell active="orders">
    {orderId && <a className="customer-orders-back" href={group === 'history' ? '/account/orders?group=history' : '/account/orders'}><ArrowLeft size={16} aria-hidden="true" /> {copy.myOrders}</a>}
    <PageHeader title={orderId ? copy.customerOrderDetailTitle : copy.myOrders} />
    {accessToken && <CustomerOrdersContent key={accessToken} token={accessToken} orderId={orderId} group={group} listUrl={listUrl} login={login} />}
    {!orderId && <a className="customer-orders-guest" href={guestLookupUrl}>{copy.checkGuestOrder} <ArrowRight size={15} aria-hidden="true" /></a>}
    {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={response => {
      setCustomerSession(response)
      activateCustomerCart().catch(() => {})
    }} />}
  </AccountShell>
}

function CustomerOrdersContent({ token, orderId, group, listUrl, login }) {
  const copy = useStorefrontCopy()
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  const path = orderId ? `/me/orders/${encodeURIComponent(orderId)}` : `/me/orders?group=${group}&offset=${offset}&limit=${pageSize}`
  const current = result?.path === path && result.revision === revision ? result : null
  const refresh = () => setRevision(value => value + 1)

  useEffect(() => {
    if (orderId && !uuid.test(orderId)) return
    const controller = new AbortController()
    requestOrder(path, token, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ path, revision, data })
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ path, revision, error })
    })
    return () => controller.abort()
  }, [orderId, path, revision, token])

  const error = current?.error
  let body
  if ((orderId && !uuid.test(orderId)) || error?.status === 404) {
    body = <OrderMessage title={copy.customerOrderNotFound} description={copy.seeAvailableOrders} />
  } else if (error?.status === 401 || error?.status === 403) {
    body = <OrderMessage title={copy.yourSessionHasEnded}>{login}</OrderMessage>
  } else if (error) {
    body = <OrderMessage title={copy.ordersLoadError} description={copy.retryOrdersDescription}>
      <button type="button" className="account-btn account-btn--primary" onClick={refresh}>{copy.tryAgain}</button>
    </OrderMessage>
  } else if (!current) {
    body = <OrdersSkeleton orderId={orderId} label={copy.loadingOrders} />
  } else if (orderId) {
    body = <OrderStatusDetails order={current.data} onRefresh={refresh}
      itemAction={item => <>
        {current.data.paymentState === 'Paid' && item.kind === 'GameVoucher' && item.fulfillmentStatus === 'Completed' &&
          <VoucherCodes orderId={orderId} itemId={item.id} token={token} />}
        {(item.canReview || item.reviewStatus) && <OrderItemReview key={item.id} item={item} token={token} />}
      </>} />
  } else if (!current.data.items.length) {
    body = <OrderMessage title={offset ? copy.noOrdersOnThisPage : group === 'history' ? copy.noPastOrders : copy.noActiveOrders}>
      {offset === 0 && group === 'active' && <a className="account-btn account-btn--primary" href="/search">{copy.browseProducts}</a>}
    </OrderMessage>
  } else {
    body = <ul className="customer-orders-list" aria-label={group === 'history' ? copy.pastOrders : copy.activeOrders}>
      {current.data.items.map(order => <li key={order.id}><OrderCard order={order} group={group} /></li>)}
    </ul>
  }

  return <>
    {!orderId && <div className="customer-orders-toolbar">
      <nav aria-label={copy.orderFilters} className="customer-orders-tabs">
        <a href={listUrl} aria-current={group === 'active' ? 'page' : undefined}>{copy.activeOrders}</a>
        <a href={`${listUrl}?group=history`} aria-current={group === 'history' ? 'page' : undefined}>{copy.pastOrders}</a>
      </nav>
      <button type="button" className="account-btn account-btn--outline" onClick={refresh}><RefreshCw size={15} aria-hidden="true" /> {copy.refreshOrders}</button>
    </div>}
    {body}
    {!orderId && (offset > 0 || current?.data?.hasMore) && <nav className="customer-orders-pagination" aria-label={copy.orderPages}>
      <button type="button" className="account-btn account-btn--outline" disabled={offset === 0} onClick={() => setOffset(value => value - pageSize)}>{copy.previous}</button>
      <span>{copy.page} {offset / pageSize + 1}</span>
      <button type="button" className="account-btn account-btn--outline" disabled={!current?.data?.hasMore} onClick={() => setOffset(value => value + pageSize)}>{copy.next}</button>
    </nav>}
  </>
}

function OrderCard({ order, group }) {
  const copy = useStorefrontCopy()
  const language = useNavbarLanguage()
  const item = order.firstItem
  return <article className="customer-order-card">
    <div className="customer-order-card__header">
      <h2>{order.orderNumber}</h2>
      <span>{dateTime(order.createdAt, language)}</span>
    </div>
    <div className="customer-order-card__item">
      {item?.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <span className="customer-order-card__image"><Package size={23} aria-hidden="true" /></span>}
      <div>
        <strong>{item?.productName || copy.zetruvProduct}</strong>
        <span>{[item?.variantName, `${order.itemCount} ${order.itemCount === 1 ? copy.singleOrderItem : copy.items}`].filter(Boolean).join(' · ')}</span>
      </div>
    </div>
    <div className="customer-order-card__statuses">
      <span>{copy.orderStatus} · <strong>{orderStatusLabel(order.status, copy)}</strong></span>
      <span>{copy.payment2} · <strong>{paymentStatusLabel(order, copy)}</strong></span>
      {order.hasFulfillmentIssue && <span className="customer-order-card__issue">{copy.orderFulfillmentProblem}</span>}
    </div>
    <div className="customer-order-card__footer">
      <strong>{money(order.grandTotal, order.currency)}</strong>
      <a className="account-btn account-btn--outline" href={`/account/orders/${order.id}${group === 'history' ? '?group=history' : ''}`} aria-label={formatCopy(copy.orderDetailLink, { number: order.orderNumber })}>{copy.viewDetails} <ArrowRight size={15} aria-hidden="true" /></a>
    </div>
  </article>
}

const reviewMessages = { Pending: 'reviewPending', Published: 'reviewPublished', Hidden: 'reviewHidden', Duplicate: 'reviewDuplicate' }
const reviewRatings = [1, 2, 3, 4, 5]

function OrderItemReview({ item, token }) {
  const copy = useStorefrontCopy()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const statusMessage = reviewMessages[submitted || item.reviewStatus]

  async function send(event) {
    event.preventDefault()
    if (sending || !rating) return
    setSending(true)
    setError(false)
    try {
      await apiRequest('/me/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderItemId: item.id, rating, comment: comment.trim() || null }),
      })
      setSubmitted('Pending')
    } catch (failure) {
      if (failure.status === 409) setSubmitted('Duplicate')
      else setError(true)
    } finally {
      setSending(false)
    }
  }

  if (statusMessage) return <p className="customer-review__status" role="status">{copy[statusMessage]}</p>
  return <div className="customer-review">
    <button type="button" className="account-btn account-btn--outline" aria-expanded={open} aria-controls={formId}
      disabled={sending} onClick={() => setOpen(value => !value)}>
      <Star size={16} aria-hidden="true" /> {copy.writeProductReview}
    </button>
    <form id={formId} hidden={!open} onSubmit={send} aria-busy={sending}>
      <fieldset disabled={sending}>
        <legend>{copy.reviewRating}</legend>
        <div className="customer-review__rating">
          {reviewRatings.map(value => <label key={value}>
            <input type="radio" name={formId} value={value} checked={rating === value} required
              aria-label={formatCopy(copy.reviewStarsOutOfFive, { rating: value })} onChange={() => setRating(value)} />
            <Star size={24} fill={value <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
          </label>)}
        </div>
      </fieldset>
      <label className="customer-review__comment">{copy.reviewComment}
        <textarea rows={3} maxLength={1000} value={comment} disabled={sending} onChange={event => setComment(event.target.value)} />
      </label>
      {error && <p role="alert">{copy.reviewSendError}</p>}
      <button className="account-btn account-btn--primary" disabled={sending || !rating}>
        {sending ? copy.reviewSending : copy.reviewSend}
      </button>
    </form>
  </div>
}

function VoucherCodes({ orderId, itemId, token }) {
  const copy = useStorefrontCopy()
  const [codes, setCodes] = useState([])
  const [state, setState] = useState('idle')

  async function reveal() {
    setState('loading')
    try {
      const result = await requestOrder(`/me/orders/${orderId}/items/${itemId}/voucher-codes`, token)
      setCodes(result.codes)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  return <div className="customer-order-voucher">
    {state === 'loading' && <LoadingRegion label={copy.loadingVoucherCodes}><Bone width="55%" /></LoadingRegion>}
    {state === 'ready' ? <ul aria-label={copy.voucherCodes}>{codes.map(code => <li key={code}><code>{code}</code></li>)}</ul> :
      <button type="button" className="account-btn account-btn--outline" disabled={state === 'loading'} onClick={reveal}>
        {state === 'loading' ? copy.loadingVoucherCodes : copy.revealVoucherCodes}
      </button>}
    {state === 'error' && <p role="alert">{copy.voucherCodesLoadError}</p>}
  </div>
}
