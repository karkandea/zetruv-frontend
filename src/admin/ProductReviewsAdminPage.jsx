import { useEffect, useRef, useState } from 'react'
import { Star, X } from 'lucide-react'
import { cmsRequest } from './api'
import './product-review-moderation.css'

const labels = { Pending: 'Menunggu', Published: 'Tayang', Hidden: 'Disembunyikan', All: 'Semua' }
const pageSize = 20
const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })

function Status({ status }) {
  return <span className={`admin-pill admin-pill--${status.toLowerCase()}`}>{labels[status]}</span>
}

export default function ProductReviewsAdminPage() {
  const [status, setStatus] = useState('Pending')
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  const [selection, setSelection] = useState(null)
  const [notice, setNotice] = useState('')
  const params = new URLSearchParams({ offset, limit: pageSize })
  if (status !== 'All') params.set('status', status)
  const path = `/catalog/reviews/moderation?${params}`
  const current = result?.path === path && result.revision === revision ? result : null
  const page = current?.page
  const reload = () => setRevision(value => value + 1)
  const heading = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    cmsRequest(path, { cache: 'no-store', signal: controller.signal }).then(page => {
      if (!controller.signal.aborted) setResult({ path, revision, page })
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ path, revision, failed: true })
    })
    return () => controller.abort()
  }, [path, revision])

  function updated(approved) {
    setSelection(null)
    setNotice(approved ? 'Ulasan ditayangkan.' : 'Ulasan disembunyikan.')
    setOffset(0)
    reload()
    heading.current?.focus()
  }

  return <div className="admin-page admin-product-reviews">
    <header className="admin-page-header">
      <div><h1 ref={heading} tabIndex={-1}>Ulasan Produk</h1><p>Moderasi ulasan dari pembeli terverifikasi.</p></div>
    </header>
    <div className="admin-tabs admin-review-filters" role="group" aria-label="Status ulasan">
      {Object.entries(labels).map(([value, label]) => <button key={value} type="button"
        className={status === value ? 'is-active' : ''} aria-pressed={status === value}
        onClick={() => { setStatus(value); setOffset(0); setNotice('') }}>{label}</button>)}
    </div>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    <section className="admin-panel" aria-label="Daftar ulasan" aria-busy={!current}>
      {!current && <p className="admin-loading" role="status">Memuat ulasan…</p>}
      {current?.failed && <div className="admin-empty">
        <p role="alert">Ulasan belum bisa dimuat.</p>
        <button className="admin-button admin-button--ghost" type="button" onClick={reload}>Coba lagi</button>
      </div>}
      {page?.items.length === 0 && <p className="admin-empty" role="status">
        {status === 'Pending' ? 'Belum ada ulasan yang menunggu moderasi.' : 'Belum ada ulasan di daftar ini.'}
      </p>}
      {page?.items.length > 0 && <ul className="admin-review-list">
        {page.items.map(review => <li key={review.id}>
          <div className="admin-review-list__product">
            <strong>{review.productName}</strong>
            <small>{review.orderNumber} · {date.format(new Date(review.createdAt))} WIB</small>
          </div>
          <div className="admin-review-list__comment">
            <span className="admin-review-score"><Star size={15} fill="currentColor" aria-hidden="true" /> {review.rating}/5</span>
            {review.comment && <p>{review.comment}</p>}
          </div>
          <div className="admin-review-list__actions">
            <Status status={review.status} />
            <button className="admin-button admin-button--ghost" type="button" onClick={() => setSelection(review)}>Detail</button>
          </div>
        </li>)}
      </ul>}
      {(offset > 0 || page?.hasMore) && <nav className="admin-review-pagination" aria-label="Halaman ulasan">
        <button className="admin-button admin-button--ghost" type="button" disabled={!current || !offset} onClick={() => setOffset(value => value - pageSize)}>Sebelumnya</button>
        <span>Halaman {offset / pageSize + 1}</span>
        <button className="admin-button admin-button--ghost" type="button" disabled={!page?.hasMore} onClick={() => setOffset(value => value + pageSize)}>Berikutnya</button>
      </nav>}
    </section>
    {selection && <ReviewDialog review={selection} onClose={() => setSelection(null)} onUpdated={updated} />}
  </div>
}

function ReviewDialog({ review, onClose, onUpdated }) {
  const dialog = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!dialog.current.open) dialog.current.showModal()
  }, [])

  async function moderate(approved) {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      await cmsRequest(`/catalog/reviews/${review.id}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ isApproved: approved }),
      })
      dialog.current?.close()
      onUpdated(approved)
    } catch {
      setError(true)
      setSaving(false)
    }
  }

  return <dialog ref={dialog} className="admin-modal admin-review-dialog" aria-labelledby="review-dialog-title"
    onClose={onClose} onCancel={event => { if (saving) event.preventDefault() }}>
    <header><h2 id="review-dialog-title">Detail ulasan</h2>
      <button type="button" aria-label="Tutup" disabled={saving} onClick={() => dialog.current.close()}><X size={16} /></button>
    </header>
    <div className="admin-modal-body" aria-busy={saving}>
      <div className="admin-review-dialog__details">
        <strong>{review.productName}</strong>
        <span>{review.orderNumber} · {date.format(new Date(review.createdAt))} WIB</span>
        <span className="admin-review-score"><Star size={16} fill="currentColor" aria-hidden="true" /> {review.rating}/5</span>
        <Status status={review.status} />
      </div>
      <p className="admin-review-dialog__comment">{review.comment || 'Pembeli memberi rating tanpa komentar.'}</p>
      {error && <p className="admin-error" role="alert">Status ulasan belum tersimpan. Coba lagi.</p>}
      <div className="admin-form-actions">
        {review.status !== 'Hidden' && <button className="admin-button admin-button--ghost" type="button" disabled={saving} onClick={() => moderate(false)}>
          {review.status === 'Pending' ? 'Tolak' : 'Sembunyikan'}
        </button>}
        {review.status !== 'Published' && <button className="admin-button admin-button--primary" type="button" disabled={saving} onClick={() => moderate(true)}>
          {review.status === 'Hidden' ? 'Tayangkan kembali' : 'Setujui dan tayangkan'}
        </button>}
      </div>
    </div>
  </dialog>
}
