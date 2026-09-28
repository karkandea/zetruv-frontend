import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import { sharedOrderStatusAssets } from '../data/sharedOrderStatusAssets'
import '../styles/shared-order-status.css'

const HISTORY_ORDERS = [
  {
    id: '#ZTR-260906-1842',
    service: 'Via ID',
    date: 'Sep 6, 2026',
    state: 'In Process',
    stateTone: 'process',
    total: 'Rp 399.000',
    icon: 'VI',
    title: 'Mobile Legends — 1,720 Diamonds',
    meta: 'User ID 4819••23 · Zone 2211',
    detailView: 'detail',
  },
  {
    id: '#ZTR-260905-1730',
    service: 'Joki',
    date: 'Sep 6, 2026',
    state: 'Needs Action',
    stateTone: 'warning',
    total: 'Rp 275.000',
    icon: 'JO',
    title: 'Rank Push — Mythic 20★ → 35★',
    meta: 'ETA 8 Sep · Progress 60%',
    detailView: 'joki',
  },
  {
    id: '#ZTR-260903-0921',
    service: 'Voucher',
    date: 'Sep 6, 2026',
    state: 'Completed',
    stateTone: 'success',
    total: 'Rp 125.000',
    icon: 'VO',
    title: 'Steam Wallet IDR 120K',
    meta: 'Code delivered Sep 3, 09:24',
    detailView: 'voucher',
  },
]

const PROCESSING_ORDERS = [
  HISTORY_ORDERS[0],
  {
    id: '#ZTR-260904-0816',
    service: 'Merchandise',
    date: 'Sep 4, 2026',
    state: 'In Transit',
    stateTone: 'process',
    total: 'Rp 347.000',
    icon: 'M',
    title: 'Zetruv Pro Gaming Jersey — Black / L',
    meta: 'JNE Regular · ETA Sep 8 · Jakarta Hub',
    detailView: 'merchandise',
  },
]

const viewHref = (view, extra = '') => `/order-status?view=${view}${extra}`

function StatusChip({ children, tone = 'process' }) {
  return <span className={`sos-chip sos-chip--${tone}`}>{children}</span>
}

function OutlineButton({ children, href = '#', onClick, className = '' }) {
  if (onClick) return <button className={`sos-button sos-button--outline ${className}`} type="button" onClick={onClick}>{children}</button>
  return <a className={`sos-button sos-button--outline ${className}`} href={href}>{children}</a>
}

function YellowButton({ children, href = '#', onClick, className = '' }) {
  if (onClick) return <button className={`sos-button sos-button--yellow ${className}`} type="button" onClick={onClick}>{children}</button>
  return <a className={`sos-button sos-button--yellow ${className}`} href={href}>{children}</a>
}

function StatusShell({ children }) {
  return (
    <div className="sos-shell">
      <Navbar variant="account" />
      {children}
    </div>
  )
}

function HistoryCard({ order }) {
  return (
    <article className="sos-history-card">
      <div className="sos-history-card__header">
        <div className="sos-history-card__identity">
          <strong>{order.id}</strong>
          <StatusChip tone="soft">{order.service}</StatusChip>
          <span>{order.date}</span>
        </div>
        <div className="sos-history-card__state">
          <StatusChip tone={order.stateTone}>{order.state}</StatusChip>
          <strong>{order.total}</strong>
        </div>
      </div>
      <div className="sos-history-card__body">
        <span className="sos-service-icon">{order.icon}</span>
        <div className="sos-history-card__copy">
          <strong>{order.title}</strong>
          <span>{order.meta}</span>
        </div>
        <div className="sos-history-card__actions">
          <OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton>
          <YellowButton href={viewHref(order.detailView)}>View Details</YellowButton>
        </div>
      </div>
    </article>
  )
}

function HistoryPage({ processingOnly = false }) {
  const [filter, setFilter] = useState(processingOnly ? 'In Process' : 'All')
  const [query, setQuery] = useState('')
  const source = processingOnly || filter === 'In Process' ? PROCESSING_ORDERS : HISTORY_ORDERS
  const visible = useMemo(() => {
    let rows = source
    if (filter === 'Completed') rows = HISTORY_ORDERS.filter((item) => item.state === 'Completed')
    if (filter === 'Needs Action') rows = HISTORY_ORDERS.filter((item) => item.state === 'Needs Action')
    if (filter === 'Cancelled') rows = []
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter((item) => `${item.id} ${item.title} ${item.service}`.toLowerCase().includes(q))
    }
    return rows
  }, [filter, processingOnly, query, source])

  const changeFilter = (value) => {
    if (value === 'In Process') {
      window.location.href = viewHref('history-processing')
      return
    }
    if (processingOnly && value === 'All') {
      window.location.href = viewHref('history')
      return
    }
    setFilter(value)
  }

  return (
    <StatusShell>
      <main className="sos-history-page">
        <div className="sos-history-heading">
          <div>
            <h1>My Orders</h1>
            <p>Track every purchase and continue the next action from one place.</p>
          </div>
          <label className="sos-history-search">
            <img src={accountIcons.search} alt="" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order number" />
          </label>
        </div>
        <div className="sos-history-filters">
          {['All', 'In Process', 'Completed', 'Needs Action', 'Cancelled'].map((item) => (
            <button className={(processingOnly ? item === 'In Process' : filter === item) ? 'is-active' : ''} type="button" onClick={() => changeFilter(item)} key={item}>{item}</button>
          ))}
        </div>
        <div className="sos-history-list">
          {visible.map((order) => <HistoryCard order={order} key={order.id} />)}
          {visible.length === 0 && (
            <div className="sos-history-empty">
              <strong>No orders found</strong>
              <span>Try another filter or search term.</span>
            </div>
          )}
        </div>
      </main>
    </StatusShell>
  )
}

const progressLabels = ['Order Placed', 'Payment Verified', 'Processing', 'Completed']

function StandardProgress({ needsAction = false, completed = false }) {
  const labels = completed
    ? ['Order Placed', 'Payment Verified', 'Delivered', 'Completed']
    : needsAction
      ? ['Order Placed', 'Payment Verified', 'Needs Action', 'Processing', 'Completed']
      : progressLabels
  return (
    <div className={`sos-progress${needsAction ? ' sos-progress--needs-action' : ''}${completed ? ' sos-progress--completed' : ''}`}>
      <span className="sos-progress__line" />
      <span className="sos-progress__active-line" />
      {labels.map((label, index) => {
        let state = 'future'
        if (completed) state = 'done'
        else if (needsAction) state = index < 2 ? 'done' : index === 2 ? 'warning' : 'future'
        else state = index < 2 ? 'done' : index === 2 ? 'current' : 'future'
        return (
          <div className={`sos-progress__step sos-progress__step--${state}`} key={label}>
            <i />
            <span>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function PaymentSummary() {
  return (
    <aside className="sos-payment-summary">
      <h2>Payment Summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd>Rp 395.000</dd></div>
        <div><dt>Service Fee</dt><dd>Rp 4.000</dd></div>
        <div><dt>Payment</dt><dd>QRIS</dd></div>
        <div><dt>Status</dt><dd>Paid</dd></div>
      </dl>
      <hr />
      <div className="sos-payment-summary__total"><span>Total</span><strong>Rp 399.000</strong></div>
      <YellowButton href={viewHref('invoice')}>View Invoice</YellowButton>
    </aside>
  )
}

function DetailPage() {
  return (
    <StatusShell>
      <main className="sos-detail-page">
        <header className="sos-detail-header">
          <div>
            <div className="sos-detail-title-row">
              <h1>Order #ZTR-260906-1842</h1>
              <StatusChip tone="process">IN PROCESS</StatusChip>
            </div>
            <p>Placed Sep 6, 2026 · 18:42 WIB</p>
          </div>
          <div className="sos-detail-header__actions">
            <OutlineButton href={viewHref('invoice')}>Download Invoice</OutlineButton>
            <OutlineButton href="#support">Contact Support</OutlineButton>
          </div>
        </header>
        <StandardProgress />
        <div className="sos-detail-content">
          <div className="sos-detail-left">
            <section className="sos-context-card">
              <div className="sos-context-card__title"><StatusChip tone="soft">TOP UP VIA ID</StatusChip><h2>Mobile Legends</h2></div>
              <h3>1,720 Diamonds</h3>
              <div className="sos-context-specs">
                <div><small>User ID</small><strong>4819••23</strong></div>
                <div><small>Zone</small><strong>2211</strong></div>
                <div><small>Region</small><strong>Indonesia</strong></div>
              </div>
            </section>
            <section className="sos-latest-update">
              <strong>Latest update</strong>
              <p>Payment verified. Your top-up is being processed automatically. Estimated completion: under 5 minutes.</p>
            </section>
          </div>
          <PaymentSummary />
        </div>
      </main>
    </StatusShell>
  )
}

function InvoicePage() {
  return (
    <StatusShell>
      <main className="sos-invoice-page">
        <a className="sos-invoice-back" href={viewHref('detail')}>← <span>Back to order</span></a>
        <section className="sos-invoice-paper">
          <header>
            <div><h1>Invoice</h1><p>INV/ZTR/20260906/1842</p></div>
            <div className="sos-invoice-paid"><StatusChip tone="success">PAID</StatusChip><span>Sep 6, 2026 · 18:43 WIB</span></div>
          </header>
          <div className="sos-invoice-meta">
            <div><small>Order Number</small><strong>#ZTR-260906-1842</strong></div>
            <div><small>Customer</small><strong>Mark Smith</strong></div>
            <div><small>Payment Method</small><strong>QRIS</strong></div>
            <div><small>Service</small><strong>Top Up Via ID</strong></div>
          </div>
          <div className="sos-invoice-table">
            <div className="sos-invoice-table__head"><span>Item</span><span>Qty</span><span>Price</span><span>Amount</span></div>
            <div className="sos-invoice-table__row"><span>Mobile Legends — 1,720 Diamonds</span><span>1</span><span>Rp 395.000</span><strong>Rp 395.000</strong></div>
          </div>
          <div className="sos-invoice-totals">
            <div><span>Subtotal</span><strong>Rp 395.000</strong></div>
            <div><span>Service Fee</span><strong>Rp 4.000</strong></div>
            <div className="is-total"><span>Total</span><strong>Rp 399.000</strong></div>
          </div>
          <div className="sos-invoice-note"><strong>Payment reference</strong><span>QRIS payment verified automatically. This invoice is valid without a signature.</span></div>
        </section>
        <div className="sos-invoice-actions">
          <OutlineButton onClick={() => window.print()}>Print</OutlineButton>
          <YellowButton onClick={() => window.print()}>Download PDF</YellowButton>
        </div>
      </main>
    </StatusShell>
  )
}

function CompletedPage() {
  return (
    <StatusShell>
      <main className="sos-completed-page">
        <header className="sos-detail-header">
          <div>
            <div className="sos-detail-title-row"><h1>Order #ZTR-260903-0921</h1><StatusChip tone="success">COMPLETED</StatusChip></div>
            <p>Completed Sep 3, 2026 · 09:24 WIB</p>
          </div>
          <div className="sos-detail-header__actions"><OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton><OutlineButton href="#support">Contact Support</OutlineButton></div>
        </header>
        <div className="sos-success-banner"><span>✓</span><div><strong>Your order is complete</strong><p>The digital item has been delivered successfully. Keep this order page for your records.</p></div></div>
        <StandardProgress completed />
        <section className="sos-delivery-result">
          <div className="sos-delivery-result__title"><h2>Steam Wallet IDR 120K</h2><StatusChip tone="success">DELIVERED</StatusChip></div>
          <p>Voucher code was delivered securely on Sep 3, 2026 at 09:24 WIB.</p>
          <div className="sos-delivery-result__box"><div><small>Delivery result</small><strong>Code successfully generated and viewed</strong></div><OutlineButton href={viewHref('voucher')}>View Delivery</OutlineButton></div>
        </section>
        <div className="sos-completed-actions"><OutlineButton href="/search">Buy Again</OutlineButton><YellowButton href={viewHref('review')}>Leave a Review</YellowButton></div>
      </main>
    </StatusShell>
  )
}

function StarRow({ value, onChange }) {
  return (
    <div className="sos-stars">
      {[1,2,3,4,5].map((star) => <button type="button" className={star <= value ? 'is-active' : ''} onClick={() => onChange(star)} key={star}>★</button>)}
    </div>
  )
}

function TagButton({ children, active, onClick }) {
  return <button className={`sos-tag${active ? ' is-active' : ''}`} type="button" onClick={onClick}>{children}</button>
}

function ReviewPage({ merchandise = false }) {
  const [rating, setRating] = useState(5)
  const [deliveryRating, setDeliveryRating] = useState(5)
  const [tags, setTags] = useState(merchandise ? ['True to size','Good material','Looks like photos','Comfortable','Fast shipping'] : ['Fast delivery','Easy process','Accurate product'])

  const toggleTag = (tag) => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])

  if (merchandise) {
    return (
      <StatusShell>
        <main className="sos-merch-review-page">
          <header><div><h1>Review your merchandise</h1><p>Order #ZTR-260904-0816 · Delivered Sep 8, 2026</p></div><OutlineButton href="#return">Return / Exchange</OutlineButton></header>
          <section className="sos-merch-review-product"><span className="sos-service-icon">JR</span><div><strong>Zetruv Pro Gaming Jersey</strong><p>Black · Size L · Qty 1</p></div><strong>Rp 329.000</strong></section>
          <form className="sos-merch-review-form" onSubmit={(event) => { event.preventDefault(); window.location.href = viewHref('review-submitted') }}>
            <div className="sos-merch-rating-grid">
              <div><strong>Product quality</strong><span>How was the item?</span><StarRow value={rating} onChange={setRating} /></div>
              <div><strong>Delivery experience</strong><span>How was shipping?</span><StarRow value={deliveryRating} onChange={setDeliveryRating} /></div>
            </div>
            <div className="sos-form-group"><strong>How was the fit?</strong><div className="sos-tag-row">{['Runs small','True to size','Runs large'].map((tag) => <TagButton active={tags.includes(tag)} onClick={() => toggleTag(tag)} key={tag}>{tag}</TagButton>)}</div></div>
            <div className="sos-form-group"><strong>What stood out?</strong><div className="sos-tag-row">{['Good material','Looks like photos','Comfortable','Fast shipping'].map((tag) => <TagButton active={tags.includes(tag)} onClick={() => toggleTag(tag)} key={tag}>{tag}</TagButton>)}</div></div>
            <label className="sos-review-textarea"><strong>Write a review</strong><textarea placeholder="Share sizing, material, or delivery details that may help other buyers..." /></label>
            <div className="sos-review-actions"><OutlineButton href={viewHref('merchandise')}>Cancel</OutlineButton><YellowButton onClick={() => window.location.href = viewHref('review-submitted')}>Submit Review</YellowButton></div>
          </form>
        </main>
      </StatusShell>
    )
  }

  return (
    <StatusShell>
      <main className="sos-review-page">
        <h1>Review your order</h1>
        <p>Order #ZTR-260903-0921 · Steam Wallet IDR 120K</p>
        <form className="sos-review-card" onSubmit={(event) => { event.preventDefault(); window.location.href = viewHref('review-submitted') }}>
          <div className="sos-review-product"><span className="sos-service-icon">VG</span><div><strong>Steam Wallet IDR 120K</strong><p>Voucher Game · Delivered Sep 3, 2026</p></div></div>
          <div className="sos-form-group"><strong>How was your experience?</strong><StarRow value={rating} onChange={setRating} /></div>
          <div className="sos-form-group"><strong>What stood out?</strong><div className="sos-tag-row">{['Fast delivery','Easy process','Accurate product','Helpful support'].map((tag) => <TagButton active={tags.includes(tag)} onClick={() => toggleTag(tag)} key={tag}>{tag}</TagButton>)}</div></div>
          <label className="sos-review-textarea"><strong>Tell us more</strong><textarea placeholder="Share details that could help other buyers..." /></label>
          <div className="sos-review-actions"><OutlineButton href={viewHref('completed')}>Cancel</OutlineButton><YellowButton onClick={() => window.location.href = viewHref('review-submitted')}>Submit Review</YellowButton></div>
        </form>
      </main>
    </StatusShell>
  )
}

const exceptionCopy = {
  refunded: {
    badge: 'REFUNDED',
    title: 'This order could not be completed',
    desc: 'Login verification expired before the order could be processed. Your payment has been refunded to the original payment method.',
    events: [['Order placed','Sep 2 · 14:40','success'],['Payment verified','Sep 2 · 14:41','success'],['Login verification failed','Sep 2 · 14:52','error'],['Refund initiated','Sep 2 · 15:03','process'],['Refund completed','Sep 3 · 10:18','success']],
    amountLabel: 'Refund amount',
    amount: 'Rp 399.000',
    method: 'Returned to QRIS source',
  },
  failed: {
    badge: 'FAILED',
    title: 'This order could not be completed',
    desc: 'Payment or fulfillment failed before completion. Your order remains available for support and retry.',
    events: [['Order placed','Sep 2 · 14:40','success'],['Payment failed','Sep 2 · 14:41','error']],
    amountLabel: 'Order amount',
    amount: 'Rp 399.000',
    method: 'Payment not completed',
  },
  cancelled: {
    badge: 'CANCELLED',
    title: 'This order was cancelled',
    desc: 'The order was cancelled before fulfillment completed. Any eligible payment will be returned to the original payment method.',
    events: [['Order placed','Sep 2 · 14:40','success'],['Payment verified','Sep 2 · 14:41','success'],['Order cancelled','Sep 2 · 14:52','error']],
    amountLabel: 'Order amount',
    amount: 'Rp 399.000',
    method: 'Cancellation recorded',
  },
  'refund-pending': {
    badge: 'REFUND PENDING',
    title: 'Your refund is being processed',
    desc: 'The order could not be completed. Your refund has started and will return to the original payment source.',
    events: [['Order placed','Sep 2 · 14:40','success'],['Payment verified','Sep 2 · 14:41','success'],['Refund initiated','Sep 2 · 15:03','process']],
    amountLabel: 'Refund amount',
    amount: 'Rp 399.000',
    method: 'Returning to QRIS source',
  },
}

function ExceptionPage({ state = 'refunded' }) {
  const config = exceptionCopy[state] || exceptionCopy.refunded
  return (
    <StatusShell>
      <main className="sos-exception-page">
        <header><div><h1>Order #ZTR-260902-1440</h1><p>Top Up Via Login · Genshin Impact</p></div><StatusChip tone="error">{config.badge}</StatusChip></header>
        <div className="sos-error-banner"><span>×</span><div><strong>{config.title}</strong><p>{config.desc}</p></div></div>
        <section className="sos-exception-timeline">
          {config.events.map(([label,time,tone]) => <div className={`sos-exception-event sos-exception-event--${tone}`} key={label}><i /><div><strong>{label}</strong><span>{time}</span></div></div>)}
        </section>
        <div className="sos-refund-summary"><div><span>{config.amountLabel}</span><strong>{config.amount}</strong></div><strong>{config.method}</strong></div>
        <div className="sos-exception-actions"><OutlineButton href="#support">Contact Support</OutlineButton><YellowButton href="/search">Reorder</YellowButton></div>
      </main>
    </StatusShell>
  )
}

function StatusHistory({ items }) {
  return (
    <div className="sos-status-history">
      <h3>Status history</h3>
      {items.map(([time,label,tone='success']) => <div className={`sos-status-history__row is-${tone}`} key={time+label}><i /><strong>{time}</strong><span>{label}</span></div>)}
    </div>
  )
}

function ViaIdSuccessPage() {
  return (
    <StatusShell>
      <main className="sos-service-page">
        <header className="sos-service-heading"><div><div><h1>Mobile Legends — 1,720 Diamonds</h1><StatusChip tone="success">SUCCESS</StatusChip></div><p>Order #ZTR-260906-1842 · Top Up Games Via ID</p></div><div><OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton><YellowButton href="/search">Buy Again</YellowButton></div></header>
        <div className="sos-success-banner sos-service-success"><span>✓</span><div><strong>Top-up completed successfully</strong><p>Diamonds were credited to the destination account at 18:46 WIB.</p></div><b>3m 42s</b></div>
        <div className="sos-service-grid sos-service-grid--viaid">
          <section className="sos-destination-card">
            <h2>Destination</h2>
            <dl><div><dt>Game</dt><dd>Mobile Legends: Bang Bang</dd></div><div><dt>User ID</dt><dd>4819••23</dd></div><div><dt>Zone ID</dt><dd>2211</dd></div><div><dt>Region</dt><dd>Indonesia</dd></div></dl>
          </section>
          <aside className="sos-order-summary-small"><h2>Order Summary</h2><strong>1,720 Diamonds</strong><p>Rp 399.000 · QRIS</p><StatusChip tone="soft">PAYMENT VERIFIED</StatusChip></aside>
        </div>
        <StatusHistory items={[[ '18:42','Order placed'],['18:43','Payment verified'],['18:43','Top-up processing'],['18:46','Diamonds credited']]} />
        <div className="sos-service-actions"><OutlineButton href="#support">Contact Support</OutlineButton><YellowButton href={viewHref('review')}>Leave Review</YellowButton></div>
      </main>
    </StatusShell>
  )
}

function ViaLoginPage() {
  return (
    <StatusShell>
      <main className="sos-service-page sos-via-login-page">
        <header className="sos-service-heading"><div><div><h1>Genshin Impact — 980+110 Genesis Crystals</h1><StatusChip tone="warning">NEEDS ACTION</StatusChip></div><p>Order #ZTR-260906-1904 · Top Up Games Via Login</p></div><OutlineButton href="#support">Contact Support</OutlineButton></header>
        <div className="sos-warning-banner"><span>!</span><div><strong>We need a fresh login verification</strong><p>Your session expired before fulfillment started. Update account access or provide the new OTP within 30 minutes to continue.</p></div><YellowButton href={viewHref('needs-action')}>Update Access</YellowButton></div>
        <div className="sos-service-grid sos-service-grid--login">
          <section className="sos-secure-access">
            <h2>Secure account access</h2>
            <dl><div><dt>Login method</dt><dd>Email + Password</dd></div><div><dt>Account</dt><dd>ar••••@gmail.com</dd></div><div><dt>Verification</dt><dd>OTP required</dd></div><div><dt>Credential storage</dt><dd>Encrypted · deleted after fulfillment</dd></div></dl>
            <div className="sos-security-note"><strong>Security</strong><span>Never send credentials through chat. Use only the secure Update Access form.</span></div>
          </section>
          <aside className="sos-current-status"><h2>Current status</h2><StatusChip tone="warning">WAITING FOR BUYER</StatusChip><p>Order is paused. No fulfillment action will continue until access is verified.</p><span>Time remaining</span><strong>24:18</strong></aside>
        </div>
        <StatusHistory items={[[ '19:04','Order placed'],['19:05','Payment verified'],['19:07','Login session expired','warning'],['19:08','Buyer action requested','process']]} />
      </main>
    </StatusShell>
  )
}

function VoucherPage() {
  const [revealed,setRevealed] = useState(false)
  const code = revealed ? '6T3K-H8LQ-49ZX-P92D' : '6T3K-••••-••••-P92D'
  const copyCode = async () => {
    setRevealed(true)
    try { await navigator.clipboard.writeText('6T3K-H8LQ-49ZX-P92D') } catch {}
  }
  return (
    <StatusShell>
      <main className="sos-service-page sos-voucher-page">
        <header className="sos-service-heading"><div><div><h1>Steam Wallet IDR 120K</h1><StatusChip tone="success">DELIVERED</StatusChip></div><p>Order #ZTR-260903-0921 · Voucher Game</p></div><div><OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton><YellowButton href="/search">Buy Again</YellowButton></div></header>
        <section className="sos-voucher-code-card">
          <div><h2>Your voucher code</h2><p>Delivered Sep 3, 2026 · 09:24 WIB</p></div>
          <StatusChip tone="success">READY TO REDEEM</StatusChip>
          <strong className="sos-voucher-code">{code}</strong>
          <div className="sos-voucher-actions"><OutlineButton onClick={() => setRevealed(true)}>Reveal</OutlineButton><YellowButton onClick={copyCode}>Copy Code</YellowButton></div>
          <p className="sos-voucher-security">For your security, the full code is hidden until you choose Reveal. Once revealed, the action is recorded in your order history.</p>
        </section>
        <section className="sos-redeem-card">
          <h2>How to redeem</h2>
          {['Open Steam and go to Account Details.','Choose Add funds to your Steam Wallet / Redeem a Steam Gift Card.','Enter the voucher code above and confirm the balance.'].map((item,index) => <div key={item}><i>{index+1}</i><span>{item}</span></div>)}
        </section>
        <div className="sos-service-actions"><OutlineButton href="#support">Having trouble?</OutlineButton><YellowButton href={viewHref('review')}>Leave Review</YellowButton></div>
      </main>
    </StatusShell>
  )
}

function JokiPage() {
  const milestones = [
    ['Account access verified','Completed · Sep 5, 18:02','done'],
    ['Mythic 25★ reached','Completed · Sep 6, 08:40','done'],
    ['Mythic 30★ checkpoint','Almost there · 29★ now','future'],
    ['Target Mythic 35★','Estimated Sep 8','future'],
  ]
  return (
    <StatusShell>
      <main className="sos-service-page sos-joki-page">
        <header className="sos-service-heading"><div><div><h1>Mobile Legends Rank Push</h1><StatusChip tone="process">IN PROGRESS</StatusChip></div><p>Mythic 20★ → 35★ · Order #ZTR-260905-1730</p></div><div><OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton><YellowButton href="#operator">Contact Operator</YellowButton></div></header>
        <div className="sos-joki-top">
          <section className="sos-joki-progress-card"><h2>Overall progress</h2><div className="sos-joki-progress-bar"><i /><strong>60%</strong></div><div className="sos-joki-stats"><div><small>Current</small><strong>Mythic 29★</strong></div><div><small>Target</small><strong>Mythic 35★</strong></div><div><small>ETA</small><strong>Sep 8 · 15:00</strong></div></div></section>
          <aside className="sos-operator-card"><h2>Assigned operator</h2><div><i /><span><strong>Zetruv Pro #042</strong><small>4.9 rating · 218 jobs</small></span></div><StatusChip tone="success">ONLINE</StatusChip></aside>
        </div>
        <section className="sos-milestones-card"><h2>Milestones</h2>{milestones.map(([title,meta,state]) => <div className={state === 'done' ? 'is-done' : ''} key={title}><i /><span><strong>{title}</strong><small>{meta}</small></span></div>)}</section>
        <section className="sos-operator-update"><strong>Latest operator update · 17:36</strong><p>Progress is stable. Currently at Mythic 29★ and continuing after a short matchmaking break. No action is needed from you.</p></section>
      </main>
    </StatusShell>
  )
}

function GameAccountPage() {
  const [loginRevealed,setLoginRevealed] = useState(false)
  const [passwordRevealed,setPasswordRevealed] = useState(false)
  const [checks,setChecks] = useState([false,false,false,false])
  const toggle = (index) => setChecks((values) => values.map((value,i) => i === index ? !value : value))
  return (
    <StatusShell>
      <main className="sos-service-page sos-game-account-page">
        <header className="sos-service-heading"><div><div><h1>Dota 2 Account — Ancient III</h1><StatusChip tone="success">DELIVERED</StatusChip></div><p>Order #ZTR-260904-2218 · Game Account</p></div><div><OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton><OutlineButton href="#support">Contact Support</OutlineButton></div></header>
        <div className="sos-warning-banner sos-account-warning"><img className="sos-account-warning__icon" src={sharedOrderStatusAssets.secureShield} alt="" /><div><strong>Secure your account immediately after reveal</strong><p>Change the password, recovery email, linked phone, and 2FA before confirming receipt.</p></div></div>
        <section className="sos-account-delivery">
          <div className="sos-account-delivery__heading"><h2>Account delivery</h2><StatusChip tone="soft">SECURE DELIVERY</StatusChip></div>
          <dl>
            <div><dt>Steam Login</dt><dd>{loginRevealed ? 'dota.ancient3@outlook.com' : 'dota.a••••@outlook.com'} <OutlineButton onClick={() => setLoginRevealed(true)}>Reveal</OutlineButton></dd></div>
            <div><dt>Password</dt><dd>{passwordRevealed ? 'Z3truv!Ancient#2026' : '••••••••••••'} <OutlineButton onClick={() => setPasswordRevealed(true)}>Reveal</OutlineButton></dd></div>
            <div><dt>Recovery Email</dt><dd>Included · change immediately</dd></div>
            <div><dt>Linked Phone</dt><dd>Not linked</dd></div>
          </dl>
          <YellowButton onClick={() => {setLoginRevealed(true);setPasswordRevealed(true)}}>Reveal Credentials</YellowButton>
        </section>
        <section className="sos-account-checklist"><h2>Before confirming receipt</h2>{['I can sign in successfully.','I changed the password and recovery email.','I removed or reviewed linked devices.','The account matches the listing details.'].map((label,index) => <label key={label}><input type="checkbox" checked={checks[index]} onChange={() => toggle(index)} /><span>{label}</span></label>)}</section>
        <div className="sos-service-actions"><OutlineButton href="#support">Report an Issue</OutlineButton><YellowButton href={viewHref('completed')}>Confirm Received</YellowButton></div>
      </main>
    </StatusShell>
  )
}

function MerchandisePage() {
  const shipment = [
    ['Order confirmed','Sep 4 · 08:18',true],
    ['Packed by Zetruv','Sep 4 · 13:02',true],
    ['Handed to JNE','Sep 4 · 18:11',true],
    ['In transit — Jakarta Hub','Sep 6 · 16:42',true],
    ['Delivered','Expected Sep 8',false],
  ]
  return (
    <StatusShell>
      <main className="sos-service-page sos-merch-page">
        <header className="sos-service-heading"><div><div><h1>Zetruv Pro Gaming Jersey — Black / L</h1><StatusChip tone="process">IN TRANSIT</StatusChip></div><p>Order #ZTR-260904-0816 · Merchandise</p></div><div><OutlineButton href={viewHref('invoice')}>Invoice</OutlineButton><YellowButton href="#courier">Track Courier</YellowButton></div></header>
        <div className="sos-delivery-estimate"><div><span>Estimated delivery</span><strong>Tue, Sep 8 · by 20:00</strong></div><div><strong>JNE Regular</strong><span>Tracking: JNE2609043811</span></div></div>
        <div className="sos-merch-grid">
          <section className="sos-shipment-progress"><h2>Shipment progress</h2>{shipment.map(([title,meta,done]) => <div className={done ? 'is-done' : ''} key={title}><i /><span><strong>{title}</strong><small>{meta}</small></span></div>)}</section>
          <aside className="sos-delivery-details"><h2>Delivery details</h2><strong>Mark Smith</strong><p>Jl. Kemang Raya No. 18<br/>Jakarta Selatan 12730<br/>+62 812-••••-3811</p><hr/><span>Shipping method</span><strong>JNE Regular · Rp 18.000</strong></aside>
        </div>
        <section className="sos-merch-item"><span className="sos-service-icon">JR</span><div><strong>Zetruv Pro Gaming Jersey</strong><p>Color Black · Size L · Qty 1</p></div><strong>Rp 329.000</strong></section>
        <div className="sos-service-actions"><OutlineButton href={viewHref('merch-review')}>Return / Exchange</OutlineButton><OutlineButton href="#support">Contact Support</OutlineButton></div>
      </main>
    </StatusShell>
  )
}

function ReviewSubmittedPage() {
  return (
    <StatusShell>
      <main className="sos-review-submitted">
        <span className="sos-review-submitted__check">✓</span>
        <h1>Thanks for your review!</h1>
        <p>Your feedback helps other buyers choose with more confidence and helps us improve the Zetruv experience.</p>
        <section><div><strong>Steam Wallet IDR 120K</strong><span>★★★★★</span></div><p>“Code arrived instantly and the redeem instructions were clear.”</p><div className="sos-tag-row"><span className="sos-tag is-active">Fast delivery</span><span className="sos-tag is-active">Easy process</span><span className="sos-tag is-active">Accurate product</span></div></section>
        <div><OutlineButton href={viewHref('history')}>Back to My Orders</OutlineButton><YellowButton href="/search">Buy Again</YellowButton></div>
      </main>
    </StatusShell>
  )
}

function NeedsActionPage() {
  return (
    <StatusShell>
      <main className="sos-needs-action-page">
        <header className="sos-service-heading"><div><div><h1>Order #ZTR-260906-1904</h1><StatusChip tone="warning">NEEDS ACTION</StatusChip></div><p>Genshin Impact · Top Up Games Via Login</p></div><OutlineButton href="#support">Contact Support</OutlineButton></header>
        <div className="sos-warning-banner"><span>!</span><div><strong>Your input is required before we can continue</strong><p>The order is safely paused. Payment remains confirmed and fulfillment will resume after the requested information is updated.</p></div></div>
        <section className="sos-required-action"><header><h2>Required action</h2><strong>Due in 24 min</strong></header><h3>Update the login verification for ar••••@gmail.com</h3><p>Open the secure form, sign in again, and enter the latest OTP when prompted. Do not send credentials in chat.</p><div><OutlineButton href={viewHref('exception','&state=cancelled')}>Cancel Order</OutlineButton><YellowButton href={viewHref('via-login')}>Complete Action</YellowButton></div></section>
        <div className="sos-next-grid"><section><h3>What happens next?</h3><p>1. We verify the updated information.<br/>2. Fulfillment resumes automatically.<br/>3. You receive a status update when processing starts.</p></section><section><h3>Order remains protected</h3><strong>Payment verified · Rp 399.000</strong><p>If the action window expires, the order will be cancelled and the refund flow will begin automatically.</p></section></div>
        <StandardProgress needsAction />
      </main>
    </StatusShell>
  )
}

export default function SharedOrderStatusPage({ initialView = 'detail' }) {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view') || initialView
  const exceptionState = params.get('state') || 'refunded'

  if (view === 'history') return <HistoryPage />
  if (view === 'history-processing') return <HistoryPage processingOnly />
  if (view === 'invoice') return <InvoicePage />
  if (view === 'completed') return <CompletedPage />
  if (view === 'review') return <ReviewPage />
  if (view === 'exception') return <ExceptionPage state={exceptionState} />
  if (view === 'via-id') return <ViaIdSuccessPage />
  if (view === 'via-login') return <ViaLoginPage />
  if (view === 'voucher') return <VoucherPage />
  if (view === 'joki') return <JokiPage />
  if (view === 'game-account') return <GameAccountPage />
  if (view === 'merchandise') return <MerchandisePage />
  if (view === 'review-submitted') return <ReviewSubmittedPage />
  if (view === 'needs-action') return <NeedsActionPage />
  if (view === 'merch-review') return <ReviewPage merchandise />
  return <DetailPage />
}
