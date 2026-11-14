import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Package, RefreshCw } from 'lucide-react'
import { apiRequest } from '../api/httpClient'
import AuthModal from '../components/AuthModal'
import { activateCustomerCart, restoreCustomerSession, setCustomerSession } from '../services/customerCartSync'
import { AccountShell, PageHeader, useCustomerSession } from './AccountPages'
import { dateTime, money, OrderStatusDetails, orderStatusLabel, paymentStatusLabel } from './SharedOrderStatusPage'
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

function OrderMessage({ title, description, children, loading }) {
  return <section className="account-orders-empty" aria-live="polite" aria-busy={loading || undefined}>
    {!loading && <img src="/assets/account/orders-empty.svg" alt="" width="132" height="129" />}
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    {children}
  </section>
}

export default function CustomerOrdersPage({ orderId }) {
  const session = useCustomerSession()
  const [restoring, setRestoring] = useState(true)
  const [authMode, setAuthMode] = useState(null)
  const query = new URLSearchParams(window.location.search)
  const group = query.get('group') === 'history' ? 'history' : 'active'
  const listUrl = window.location.pathname === '/account/orders' || orderId ? '/account/orders' : '/order-status'

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

  const login = <button type="button" className="account-btn account-btn--primary" aria-haspopup="dialog" onClick={() => setAuthMode('login')}>Masuk</button>
  const guestLink = <a className="customer-orders-guest" href={guestLookupUrl}>Cek pesanan sebagai tamu <ArrowRight size={15} aria-hidden="true" /></a>

  return <AccountShell active="orders">
    {orderId && <a className="customer-orders-back" href={query.get('group') === 'history' ? '/account/orders?group=history' : '/account/orders'}><ArrowLeft size={16} aria-hidden="true" /> Pesanan Saya</a>}
    <PageHeader title={orderId ? 'Detail Pesanan' : 'Pesanan Saya'} />
    {session?.accessToken ? (
      <CustomerOrdersContent key={session.accessToken} token={session.accessToken} orderId={orderId} group={group} listUrl={listUrl} login={login} />
    ) : restoring ? (
      <OrderMessage title="Memuat pesanan…" loading />
    ) : (
      <OrderMessage title="Masuk untuk melihat pesanan" description="Lihat status pembayaran, pemrosesan produk, dan riwayat pembelian dari akunmu.">
        {login}
        {guestLink}
      </OrderMessage>
    )}
    {session?.accessToken && !orderId && guestLink}
    {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode(null)} onAuthenticated={signIn} />}
  </AccountShell>
}

function CustomerOrdersContent({ token, orderId, group, listUrl, login }) {
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
    body = <OrderMessage title="Pesanan tidak ditemukan" description="Buka daftar pesanan untuk melihat pesanan yang tersedia di akunmu." />
  } else if (error?.status === 401 || error?.status === 403) {
    body = <OrderMessage title="Sesi login sudah berakhir">{login}</OrderMessage>
  } else if (error) {
    body = <OrderMessage title="Pesanan belum bisa dimuat" description="Periksa koneksi lalu coba lagi.">
      <button type="button" className="account-btn account-btn--primary" onClick={refresh}>Coba Lagi</button>
    </OrderMessage>
  } else if (!current) {
    body = <OrderMessage title="Memuat pesanan…" loading />
  } else if (orderId) {
    body = <OrderStatusDetails order={current.data} onRefresh={refresh}
      itemAction={item => current.data.paymentState === 'Paid' && item.kind === 'GameVoucher' &&
        item.fulfillmentStatus === 'Completed' && <VoucherCodes orderId={orderId} itemId={item.id} token={token} />} />
  } else if (!current.data.items.length) {
    body = <OrderMessage title={offset ? 'Tidak ada pesanan di halaman ini' : group === 'history' ? 'Belum ada riwayat pesanan' : 'Belum ada pesanan aktif'}>
      {offset === 0 && group === 'active' && <a className="account-btn account-btn--primary" href="/search">Jelajahi Produk</a>}
    </OrderMessage>
  } else {
    body = <ul className="customer-orders-list" aria-label={group === 'history' ? 'Riwayat pesanan' : 'Pesanan aktif'}>
      {current.data.items.map(order => <li key={order.id}><OrderCard order={order} group={group} /></li>)}
    </ul>
  }

  return <>
    {!orderId && <div className="customer-orders-toolbar">
      <nav aria-label="Filter pesanan" className="customer-orders-tabs">
        <a href={listUrl} aria-current={group === 'active' ? 'page' : undefined}>Sedang Berjalan</a>
        <a href={`${listUrl}?group=history`} aria-current={group === 'history' ? 'page' : undefined}>Riwayat</a>
      </nav>
      <button type="button" className="account-btn account-btn--outline" onClick={refresh}><RefreshCw size={15} aria-hidden="true" /> Perbarui</button>
    </div>}
    {body}
    {!orderId && (offset > 0 || current?.data?.hasMore) && <nav className="customer-orders-pagination" aria-label="Halaman daftar pesanan">
      <button type="button" className="account-btn account-btn--outline" disabled={offset === 0} onClick={() => setOffset(value => value - pageSize)}>Sebelumnya</button>
      <span>Halaman {offset / pageSize + 1}</span>
      <button type="button" className="account-btn account-btn--outline" disabled={!current?.data?.hasMore} onClick={() => setOffset(value => value + pageSize)}>Berikutnya</button>
    </nav>}
  </>
}

function OrderCard({ order, group }) {
  const item = order.firstItem
  return <article className="customer-order-card">
    <div className="customer-order-card__header">
      <h2>{order.orderNumber}</h2>
      <span>{dateTime(order.createdAt)}</span>
    </div>
    <div className="customer-order-card__item">
      {item?.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <span className="customer-order-card__image"><Package size={23} aria-hidden="true" /></span>}
      <div>
        <strong>{item?.productName || 'Pesanan Zetruv'}</strong>
        <span>{[item?.variantName, `${order.itemCount} item`].filter(Boolean).join(' · ')}</span>
      </div>
    </div>
    <div className="customer-order-card__statuses">
      <span>Pesanan · <strong>{orderStatusLabel(order.status)}</strong></span>
      <span>Pembayaran · <strong>{paymentStatusLabel(order)}</strong></span>
      {order.hasFulfillmentIssue && <span className="customer-order-card__issue">Ada kendala pemrosesan</span>}
    </div>
    <div className="customer-order-card__footer">
      <strong>{money(order.grandTotal, order.currency)}</strong>
      <a className="account-btn account-btn--outline" href={`/account/orders/${order.id}${group === 'history' ? '?group=history' : ''}`} aria-label={`Lihat detail ${order.orderNumber}`}>Lihat Detail <ArrowRight size={15} aria-hidden="true" /></a>
    </div>
  </article>
}

function VoucherCodes({ orderId, itemId, token }) {
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
    {state === 'ready' ? <ul aria-label="Kode voucher">{codes.map(code => <li key={code}><code>{code}</code></li>)}</ul> :
      <button type="button" className="account-btn account-btn--outline" disabled={state === 'loading'} onClick={reveal}>
        {state === 'loading' ? 'Memuat kode…' : 'Tampilkan Kode Voucher'}
      </button>}
    {state === 'error' && <p role="alert">Kode belum bisa ditampilkan. Coba lagi atau hubungi bantuan Zetruv.</p>}
  </div>
}
