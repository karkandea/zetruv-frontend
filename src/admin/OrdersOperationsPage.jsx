import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, ChevronDown,
  ClipboardCopy, Clock3, CreditCard, MoreHorizontal, Package, RefreshCw,
  Search, ShieldAlert, SlidersHorizontal, Truck, X,
} from 'lucide-react'
import { cmsRequest, getAdminSession } from './api'
import { nextFulfillmentStatuses } from './digitalPurchaseRules'
import {
  PAYMENT_LABELS, PROCESS_LABELS, SHIPMENT_LABELS, TRANSACTION_LABELS,
  canCancelOrder, hasOrderIssue, inDateRange, needsProcessing, orderAdvice,
  orderTimeline, processLabel, quickMatch,
} from './orderOperations'
import './orders-ux.css'

const money = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount || 0))
const date = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB' : '—'
const orderIdInHash = () => {
  const part = window.location.hash.match(/^#\/?orders\/([0-9a-f-]{36})$/i)?.[1]
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part || '') ? part : null
}
const initialQuick = () => {
  const path = window.location.hash.replace(/^#\/?orders\/?/, '')
  return ['processing', 'paid-pending'].includes(path) ? 'attention' : path === 'payment-failed' ? 'issues' : 'all'
}

async function fetchEveryOrder(query = '') {
  const makePath = (page) => `/orders?page=${page}&pageSize=100${query ? `&q=${encodeURIComponent(query)}` : ''}`
  const first = await cmsRequest(makePath(1))
  const entries = [...(first.items || [])]
  const pages = Math.max(1, Number(first.totalPages || 1))
  for (let start = 2; start <= pages; start += 4) {
    const requests = Array.from({ length: Math.min(4, pages - start + 1) }, (_, index) => cmsRequest(makePath(start + index)))
    for (const result of await Promise.all(requests)) entries.push(...(result.items || []))
  }
  return entries
}

function Badge({ value, type = 'process' }) {
  const label = type === 'payment' ? PAYMENT_LABELS[value] : type === 'shipment' ? SHIPMENT_LABELS[value] : type === 'transaction' ? TRANSACTION_LABELS[value] : PROCESS_LABELS[value]
  const tone = ['Paid', 'Completed', 'Succeeded', 'Delivered'].includes(value) ? 'good'
    : ['Failed', 'Cancelled'].includes(value) ? 'bad'
      : ['Pending'].includes(value) ? 'waiting' : ['Refunded'].includes(value) ? 'muted' : 'info'
  return <span className={`ops-badge ops-badge--${tone}`}>{label || value || '—'}</span>
}

function ProcessBadge({ order }) {
  const text = processLabel(order)
  const tone = order.hasFulfillmentIssue ? 'bad' : ['Selesai'].includes(text) ? 'good' : ['Dibatalkan', 'Tertahan'].includes(text) ? 'bad' : text === 'Belum Dimulai' ? 'muted' : text === 'Sedang Diproses' ? 'info' : 'waiting'
  return <span className={`ops-badge ops-badge--${tone}`}>{text}</span>
}

function Card({ title, subtitle, children, className = '' }) {
  return <section className={`ops-card ${className}`}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></header><div className="ops-card-body">{children}</div></section>
}

function CopyButton({ text, label = 'Salin', onCopied }) {
  if (text == null || String(text).length === 0) return null
  return <button className="ops-copy" type="button" aria-label={`${label}: ${text}`} title={label} onClick={async () => {
    try { await navigator.clipboard.writeText(String(text)); onCopied?.('Berhasil disalin.') }
    catch { onCopied?.('Gagal menyalin. Periksa izin clipboard browser.') }
  }}><ClipboardCopy size={15} aria-hidden="true" /><span>{label}</span></button>
}

function FulfillmentControls({ item, paid, busy, onSave }) {
  const allowed = nextFulfillmentStatuses(item.fulfillmentStatus, paid ? 'Paid' : 'Pending')
  const [status, setStatus] = useState(allowed[0] || '')
  const [reference, setReference] = useState(item.fulfillmentReference || '')
  const [message, setMessage] = useState(item.fulfillmentMessage || '')
  if (!paid || !allowed.length || item.productKind === 'GameVoucher') return null
  return <details className="ops-item-controls"><summary>Perbarui Proses <ChevronDown size={14} /></summary>
    <form onSubmit={(event) => { event.preventDefault(); onSave({ status, reference, message }) }}>
      <label>Tindakan Selanjutnya<select value={status} onChange={(event) => setStatus(event.target.value)} required>{allowed.map((option) => <option key={option} value={option}>{PROCESS_LABELS[option] || option}</option>)}</select></label>
      <label>Referensi Penyelesaian (opsional)<input maxLength={180} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Nomor referensi hasil proses" /></label>
      <label>Catatan Operasional (opsional)<input maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Alasan atau informasi penanganan" /></label>
      <button className="ops-primary" type="submit" disabled={busy || !allowed.includes(status)}>{busy ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
    </form>
  </details>
}

function ShipmentControls({ shipment, busy, onSave }) {
  const [status, setStatus] = useState(shipment.status)
  const [tracking, setTracking] = useState(shipment.trackingNumber || '')
  return <Card title="Pengiriman" subtitle={shipment.serviceName || 'Informasi pengiriman barang'}>
    <div className="ops-shipping-grid"><div><span>Tujuan</span><strong>{[shipment.city, shipment.province].filter(Boolean).join(', ') || '—'}</strong></div>
      <div><span>Ongkir</span><strong>{money(shipment.cost)}</strong></div><div><span>Status</span><Badge value={shipment.status} type="shipment" /></div></div>
    <form className="ops-shipping-form" onSubmit={(event) => { event.preventDefault(); onSave(status, tracking) }}>
      <label>Status Pengiriman<select value={status} onChange={(event) => setStatus(event.target.value)}>{Object.entries(SHIPMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Nomor Resi<input value={tracking} onChange={(event) => setTracking(event.target.value)} maxLength={180} placeholder="Nomor resi pengiriman" /></label>
      <button className="ops-secondary" type="submit" disabled={busy || (status === shipment.status && tracking === (shipment.trackingNumber || ''))}>{busy ? 'Menyimpan…' : 'Simpan Pengiriman'}</button>
    </form>
  </Card>
}

function Confirmation({ detail, busy, onDismiss, onConfirm }) {
  const [agree, setAgree] = useState(false)
  return <div className="ops-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onDismiss()}>
    <div className="ops-dialog" role="dialog" aria-modal="true" aria-labelledby="ops-cancel-title">
      <div className="ops-dialog-icon"><ShieldAlert size={24} /></div>
      <h2 id="ops-cancel-title">Batalkan pesanan {detail.orderNumber}?</h2>
      <p>Pesanan yang dibatalkan tidak dapat diaktifkan kembali melalui CMS. Alokasi stok yang masih tertahan dapat dilepaskan.</p>
      {detail.paymentStatus === 'Paid' && <div className="ops-cancel-warning"><AlertTriangle size={18} /><span><strong>Pembayaran sudah berhasil.</strong> Membatalkan pesanan <b>tidak otomatis mengembalikan dana</b>. Pengembalian harus diperiksa dan ditangani secara terpisah.</span></div>}
      <label className="ops-ack"><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} /> Saya memahami dampak dan ingin membatalkan pesanan ini.</label>
      <div className="ops-dialog-actions"><button className="ops-secondary" type="button" disabled={busy} onClick={onDismiss}>Kembali</button><button className="ops-danger" type="button" disabled={busy || !agree} onClick={onConfirm}>{busy ? 'Membatalkan…' : 'Ya, Batalkan Pesanan'}</button></div>
    </div>
  </div>
}

function DetailPage({ id, detail, loading, busy, error, notice, onBack, onReconcile, onCancel, onFulfillment, onVoucherRetry, onShipment, onCopied }) {
  const [confirming, setConfirming] = useState(false)
  if (loading || !detail) return <main className="admin-page ops-page"><button type="button" className="ops-back" onClick={onBack}><ArrowLeft size={17} /> Kembali ke Pesanan</button>{error ? <div className="admin-error" role="alert">{error}</div> : <div className="ops-loading">Memuat detail pesanan…</div>}</main>
  const allowed = getAdminSession()?.role === 'Admin'
  const advice = orderAdvice(detail)
  const transactions = detail.transactions || []
  const pendingPayment = transactions.find((tx) => tx.type === 'Payment' && tx.status === 'Pending')
  const cancelable = canCancelOrder(detail)
  return <main className="admin-page ops-page ops-detail">
    <button type="button" className="ops-back" onClick={onBack}><ArrowLeft size={17} /> Kembali ke Pesanan</button>
    <div className="ops-detail-heading"><div><span className="ops-eyebrow">DETAIL PESANAN</span><h1>{detail.orderNumber}</h1><p>{date(detail.createdAt)} <CopyButton text={detail.orderNumber} label="Salin Nomor Pesanan" onCopied={onCopied} /></p></div>
      <details className="ops-actions"><summary aria-label="Tindakan lainnya"><MoreHorizontal size={23} /></summary><div className="ops-actions-menu">
        <button type="button" onClick={() => { void navigator.clipboard.writeText(detail.orderNumber).then(() => onCopied('Nomor pesanan disalin.'), () => onCopied('Gagal menyalin nomor pesanan.')) }}>Salin Nomor Pesanan</button>
        {pendingPayment && <button type="button" disabled={busy} onClick={() => onReconcile(pendingPayment)}>Periksa Ulang Pembayaran</button>}
        {cancelable && <button className="ops-actions-danger" type="button" disabled={busy} onClick={() => setConfirming(true)}>Batalkan Pesanan</button>}
      </div></details>
    </div>
    {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}
    <section className={`ops-advice ops-advice--${advice.tone}`} role="status"><div className="ops-advice-icon">{advice.tone === 'success' ? <CheckCircle2 size={21} /> : advice.tone === 'danger' ? <AlertCircle size={21} /> : <Clock3 size={21} />}</div><div><h2>{advice.title}</h2><p>{advice.detail}</p></div></section>
    <div className="ops-detail-columns">
      <Card title="Produk Dipesan" subtitle={`${detail.items?.length || 0} jenis item dalam pesanan`} className="ops-products">
        {(detail.items || []).map((item, index) => <article key={item.id} className="ops-purchased-item">
          <div className="ops-product-header"><div><span className="ops-item-number">ITEM {index + 1}</span><h3>{item.productName}</h3><p>{item.variantName || 'Varian produk'} · {item.quantity} item</p></div><strong>{money(item.lineTotal)}</strong></div>
          <div className="ops-line-status"><span>Status pemrosesan</span><Badge value={item.fulfillmentStatus} /></div>
          {allowed && item.accountTarget && <div className="ops-destination"><h4>Data Tujuan Top Up</h4>{item.accountTarget.accountDisplayName && <p>{item.accountTarget.accountDisplayName}</p>}
            {Object.entries(item.accountTarget.fields || {}).filter(([key]) => !/password|secret|token|otp|credential|pin/i.test(key)).map(([key, value]) => <div className="ops-field-row" key={key}><div><span>{key.replace(/[_-]/g, ' ')}</span><strong>{String(value)}</strong></div><CopyButton text={value} label="Salin" onCopied={onCopied} /></div>)}
          </div>}
          {item.fulfillmentReference && <p className="ops-item-note">Referensi proses: {item.fulfillmentReference}</p>}
          {item.fulfillmentMessage && <p className="ops-item-note">Catatan: {item.fulfillmentMessage}</p>}
          {item.hasManualLoginCredentials && <p className="ops-item-note">Informasi login tersimpan secara terenkripsi dan tidak ditampilkan di sini.</p>}
          {detail.paymentStatus === 'Paid' && item.productKind === 'GameVoucher' && ['Processing', 'Failed'].includes(item.fulfillmentStatus) && <button className="ops-secondary" type="button" disabled={busy} onClick={() => { if (window.confirm('Lanjutkan alokasi kode untuk item ini? Pastikan pembayaran berhasil dan tidak ada proses lain yang sedang berjalan.')) onVoucherRetry(item) }}>Periksa Alokasi Kode</button>}
          <FulfillmentControls key={`${item.id}:${item.fulfillmentStatus}`} item={item} paid={detail.paymentStatus === 'Paid'} busy={busy} onSave={(form) => onFulfillment(item, form)} />
        </article>)}
      </Card>
      <Card title="Ringkasan Pembayaran" subtitle="Nominal dan status dari sistem pembayaran">
        <div className="ops-amount-row"><span>Subtotal</span><strong>{money(detail.subtotal)}</strong></div>
        {Number(detail.discountAmount) > 0 && <div className="ops-amount-row"><span>Diskon</span><strong>−{money(detail.discountAmount)}</strong></div>}
        {Number(detail.voucherDiscountAmount) > 0 && <div className="ops-amount-row"><span>Diskon voucher</span><strong>−{money(detail.voucherDiscountAmount)}</strong></div>}
        {Number(detail.shippingAmount) > 0 && <div className="ops-amount-row"><span>Ongkos kirim</span><strong>{money(detail.shippingAmount)}</strong></div>}
        <div className="ops-amount-total"><span>Total</span><strong>{money(detail.grandTotal)}</strong></div>
        <div className="ops-payment-status"><span>Status Pembayaran</span><Badge value={detail.paymentStatus} type="payment" /></div>
        {pendingPayment && <button className="ops-secondary ops-refresh-payment" type="button" disabled={busy} onClick={() => onReconcile(pendingPayment)}><RefreshCw size={14} /> {busy ? 'Memeriksa…' : 'Periksa Status Pembayaran'}</button>}
        {allowed && (detail.customerEmail || detail.customerPhone) && <details className="ops-customer-contact"><summary>Kontak Pelanggan <ChevronDown size={14} /></summary><div><p>{detail.customerName || 'Pelanggan'}</p>{detail.customerEmail && <p>Email: {detail.customerEmail}</p>}{detail.customerPhone && <p>Telepon: {detail.customerPhone}</p>}</div></details>}
      </Card>
    </div>
    <Card title="Proses Pesanan" subtitle="Setiap item diproses setelah pembayaran berhasil">
      <div className="ops-process-overview"><div><Package size={19} /><span>Pemrosesan Produk</span></div><ProcessBadge order={detail} /></div>
      <p className="ops-hint">{detail.paymentStatus !== 'Paid' ? 'Belum ada proses yang boleh dimulai sebelum pembayaran terkonfirmasi.' : detail.hasFulfillmentIssue ? 'Periksa item yang gagal pada bagian Produk Dipesan.' : detail.status === 'Completed' ? 'Semua item telah selesai diproses.' : 'Lihat status masing-masing item di bagian Produk Dipesan.'}</p>
    </Card>
    {detail.shipment && <ShipmentControls key={detail.shipment.status} shipment={detail.shipment} busy={busy} onSave={onShipment} />}
    <Card title="Riwayat Pembayaran" subtitle="Hanya transaksi yang benar-benar tercatat di sistem">
      {transactions.length ? <div className="ops-transactions">{transactions.map((tx, index) => <article key={tx.id}><div><CreditCard size={18} /><div><strong>{tx.type === 'Refund' ? 'Pengembalian Dana' : `Pembayaran ${transactions.length - index}`}</strong><small>{date(tx.processedAt || tx.createdAt)}</small>{tx.providerReference && <small>Referensi: {tx.providerReference}</small>}</div></div><div><b>{money(tx.amount)}</b><Badge value={tx.status} type="transaction" /></div></article>)}</div> : <p className="ops-empty">Belum ada transaksi pembayaran tercatat untuk pesanan ini.</p>}
    </Card>
    <Card title="Riwayat Aktivitas" subtitle="Dibentuk dari waktu kejadian yang tersimpan, bukan perkiraan">
      <ol className="ops-timeline">{orderTimeline(detail).map((event, index) => <li key={`${event.kind}-${index}`}><span className={`ops-timeline-dot ops-timeline-dot--${event.kind}`} /><div><strong>{event.label}</strong><small>{date(event.at)}</small></div></li>)}</ol>
    </Card>
    {confirming && <Confirmation detail={detail} busy={busy} onDismiss={() => setConfirming(false)} onConfirm={async () => { const ok = await onCancel(); if (ok) setConfirming(false) }} />}
  </main>
}

export default function OrdersOperationsPage() {
  const [orderId, setOrderId] = useState(orderIdInHash)
  const [quick, setQuick] = useState(initialQuick)
  const [orders, setOrders] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [processFilter, setProcessFilter] = useState('')
  const [detail, setDetail] = useState(null)
  const [listLoading, setListLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const onHash = () => setOrderId(orderIdInHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const loadOrders = useCallback(async (query = searchQuery) => {
    setListLoading(true)
    try {
      const all = await fetchEveryOrder()
      setOrders(all)
      if (query) setSearchResults(await fetchEveryOrder(query))
      else setSearchResults(null)
      setError('')
    } catch (cause) { setError(`Daftar pesanan gagal dimuat: ${cause.message}`) }
    finally { setListLoading(false) }
  }, [searchQuery])

  useEffect(() => { void loadOrders('') }, [])
  useEffect(() => {
    if (!orderId) { setDetail(null); return }
    let active = true
    setDetail(null); setDetailLoading(true); setError(''); setNotice('')
    cmsRequest(`/orders/${encodeURIComponent(orderId)}`).then((value) => { if (active) setDetail(value) }).catch((cause) => { if (active) setError(cause.message) }).finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [orderId])

  async function perform(action) {
    if (!detail || busy) return false
    setBusy(true); setError(''); setNotice('')
    try {
      await action()
      const updated = await cmsRequest(`/orders/${detail.id}`)
      setDetail(updated)
      await loadOrders()
      setNotice('Data pesanan berhasil diperbarui.')
      return true
    } catch (cause) { setError(cause.message); return false }
    finally { setBusy(false) }
  }

  const counts = useMemo(() => ({
    all: orders.length,
    waiting: orders.filter((item) => quickMatch(item, 'waiting')).length,
    attention: orders.filter(needsProcessing).length,
  }), [orders])
  const matching = useMemo(() => (searchResults || orders).filter((order) => quickMatch(order, quick)
    && (!paymentFilter || order.paymentStatus === paymentFilter)
    && (!processFilter || order.status === processFilter)
    && inDateRange(order.createdAt, startDate, endDate)), [orders, searchResults, quick, paymentFilter, processFilter, startDate, endDate])

  if (orderId) return <DetailPage key={orderId} id={orderId} detail={detail} loading={detailLoading} busy={busy} error={error} notice={notice} onCopied={setNotice}
    onBack={() => { window.location.hash = '/orders' }}
    onReconcile={(transaction) => perform(() => cmsRequest(`/payments/transactions/${transaction.id}/reconcile`, { method: 'POST' }))}
    onCancel={() => perform(() => cmsRequest(`/orders/${detail.id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Cancelled' }) }))}
    onFulfillment={(item, data) => perform(() => cmsRequest(`/orders/${detail.id}/items/${item.id}/fulfillment`, { method: 'PUT', body: JSON.stringify({ status: data.status, reference: data.reference?.trim() || null, message: data.status === 'Completed' ? null : data.message?.trim() || null }) }))}
    onVoucherRetry={(item) => perform(() => cmsRequest(`/orders/${detail.id}/items/${item.id}/game-voucher-assign`, { method: 'POST' }))}
    onShipment={(status, trackingNumber) => perform(() => cmsRequest(`/orders/${detail.id}/shipment`, { method: 'PUT', body: JSON.stringify({ status, trackingNumber: trackingNumber || null }) }))} />

  const filters = [ ['all', `Semua (${counts.all})`], ['waiting', `Menunggu Pembayaran (${counts.waiting})`], ['attention', `Perlu Diproses (${counts.attention})`], ['complete', 'Selesai'], ['issues', 'Bermasalah'] ]
  return <main className="admin-page ops-page">
    <header className="ops-list-heading"><span className="ops-eyebrow">OPERASIONAL TOKO</span><h1>Pesanan</h1><p>Pantau pembayaran dan proses pesanan pelanggan.</p></header>
    {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}
    <div className="ops-metrics"><article><span>Total Pesanan</span><strong>{counts.all}</strong><small>Semua waktu</small></article><article><span>Menunggu Pembayaran</span><strong>{counts.waiting}</strong><small>Belum dibayar</small></article><article><span>Perlu Diproses</span><strong>{counts.attention}</strong><small>Menunggu tindakan admin</small></article></div>
    <div className="ops-list-card">
      <nav className="ops-chips" aria-label="Filter cepat pesanan">{filters.map(([id, label]) => <button key={id} type="button" className={quick === id ? 'is-active' : ''} aria-pressed={quick === id} onClick={() => setQuick(id)}>{label}</button>)}</nav>
      <div className="ops-toolbar">
        <form className="ops-search" onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput.trim()); void loadOrders(searchInput.trim()) }}><Search size={18} aria-hidden="true" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari nomor pesanan atau pelanggan…" aria-label="Cari nomor pesanan atau pelanggan" />{searchInput && <button type="button" aria-label="Hapus pencarian" onClick={() => { setSearchInput(''); setSearchQuery(''); void loadOrders('') }}><X size={14} /></button>}<button className="ops-search-submit" type="submit">Cari</button></form>
        <div className="ops-toolbar-filters"><details className="ops-filter-popup"><summary><CalendarDays size={16} /> Periode</summary><div><label>Mulai<input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} /></label><label>Sampai<input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label><button type="button" className="ops-secondary" onClick={() => { setStartDate(''); setEndDate('') }}>Semua Tanggal</button></div></details>
          <details className="ops-filter-popup"><summary><SlidersHorizontal size={16} /> Filter</summary><div><label>Status Pembayaran<select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}><option value="">Semua</option>{Object.entries(PAYMENT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Status Pesanan<select value={processFilter} onChange={(e) => setProcessFilter(e.target.value)}><option value="">Semua</option>{['Pending', 'Processing', 'Completed', 'Cancelled'].map((value) => <option value={value} key={value}>{PROCESS_LABELS[value]}</option>)}</select></label><button type="button" className="ops-secondary" onClick={() => { setPaymentFilter(''); setProcessFilter('') }}>Reset Filter</button></div></details>
          <button type="button" className="ops-refresh" onClick={() => void loadOrders()} disabled={listLoading} aria-label="Muat ulang daftar pesanan"><RefreshCw size={16} /></button>
        </div>
      </div>
      <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Pembayaran</th><th>Proses</th><th>Dibuat</th><th>Aksi</th></tr></thead><tbody>
        {!listLoading && matching.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong><small>{order.itemCount} item</small></td><td>{order.customerName || 'Pelanggan'}</td><td className="ops-total">{money(order.grandTotal)}</td><td><Badge value={order.paymentStatus} type="payment" /></td><td><ProcessBadge order={order} /></td><td>{date(order.createdAt)}</td><td><a className="ops-detail-link" href={`#/orders/${order.id}`}>Lihat Detail</a></td></tr>)}
      </tbody></table></div>
      {listLoading ? <div className="ops-loading">Memuat pesanan…</div> : !matching.length && <div className="ops-empty-state"><Package size={26} /><strong>Tidak ada pesanan yang cocok</strong><p>Coba ubah pencarian, periode, atau filter status.</p><button className="ops-secondary" type="button" onClick={() => { setQuick('all'); setStartDate(''); setEndDate(''); setPaymentFilter(''); setProcessFilter(''); setSearchInput(''); setSearchQuery(''); void loadOrders('') }}>Tampilkan Semua</button></div>}
      {!listLoading && matching.length > 0 && <div className="ops-results">Menampilkan {matching.length} pesanan</div>}
    </div>
  </main>
}
