import { useEffect, useState } from 'react'
import { cmsRequest } from './api'
import { toLocalDatetime, toVoucherPayload, validateVoucherForm } from './discountVoucherForm'
import './discount-vouchers.css'

const KINDS = ['TopUpGame', 'TopUpLogin', 'GameVoucher', 'Joki', 'Merchandise', 'GameAccount']
const rupiah = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const when = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const discountLabel = (type, value) => type === 'Percentage' ? value + '%' : rupiah(value)
const rowState = row => !row.isActive ? 'Disabled' : new Date(row.startsAt) > new Date() ? 'Scheduled' : new Date(row.endsAt) <= new Date() ? 'Expired' : 'Active'
function initialForm(item) {
  const now = new Date()
  const end = new Date(now.getTime() + 7 * 86400_000)
  return {
    code: item?.code || '', type: item?.type || 'Fixed',
    value: item?.value ?? '', maximumDiscount: item?.maximumDiscount ?? '',
    minimumSpend: item?.minimumSpend ?? 0, applicableKind: item?.applicableKind || '',
    maxUses: item?.maxUses ?? '', maxUsesPerCustomer: item?.maxUsesPerCustomer ?? '',
    startsAt: toLocalDatetime(item?.startsAt || now),
    endsAt: toLocalDatetime(item?.endsAt || end),
    isActive: item?.isActive ?? true,
  }
}
function VoucherEditor({ item, busy, error, onSave, onCancel }) {
  const [form, setForm] = useState(() => initialForm(item))
  const set = (field, value) => setForm(old => ({ ...old, [field]: value }))
  const locked = Boolean(item?.hasClaims || item?.usedCount)
  function submit(event) {
    event.preventDefault()
    const invalid = validateVoucherForm(form)
    if (invalid) return onSave(null, invalid)
    onSave(toVoucherPayload(form))
  }
  return <form className="admin-form-grid" onSubmit={submit}>
    {error && <div className="admin-error">{error}</div>}
    {locked && <p className="voucher-lock-info">This code has existing claims. To change its discount rules, disable it and create a new code.</p>}
    <label className="admin-field"><span>Voucher code</span><input maxLength={32} required disabled={busy || locked} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" /></label>
    <label className="admin-field"><span>Discount type</span><select disabled={busy || locked} value={form.type} onChange={e => set('type', e.target.value)}><option value="Fixed">Fixed amount (IDR)</option><option value="Percentage">Percentage (%)</option></select></label>
    <label className="admin-field"><span>{form.type === 'Percentage' ? 'Discount percentage' : 'Discount amount (IDR)'}</span><input type="number" required min="0.01" max={form.type === 'Percentage' ? 100 : undefined} step={form.type === 'Percentage' ? '0.01' : '1'} disabled={busy || locked} value={form.value} onChange={e => set('value', e.target.value)} /></label>
    {form.type === 'Percentage' && <label className="admin-field"><span>Maximum discount (IDR, optional)</span><input type="number" min="1" step="1" disabled={busy || locked} value={form.maximumDiscount} onChange={e => set('maximumDiscount', e.target.value)} /></label>}
    <label className="admin-field"><span>Minimum eligible spend (IDR)</span><input type="number" required min="0" step="1" disabled={busy || locked} value={form.minimumSpend} onChange={e => set('minimumSpend', e.target.value)} /></label>
    <label className="admin-field"><span>Eligible product kind</span><select disabled={busy || locked} value={form.applicableKind} onChange={e => set('applicableKind', e.target.value)}><option value="">All product kinds</option>{KINDS.map(kind => <option value={kind} key={kind}>{kind}</option>)}</select></label>
    <label className="admin-field"><span>Total claim limit (optional)</span><input type="number" min="1" step="1" disabled={busy} value={form.maxUses} onChange={e => set('maxUses', e.target.value)} placeholder="Unlimited" /></label>
    <label className="admin-field"><span>Claims per customer (optional)</span><input type="number" min="1" step="1" disabled={busy || locked} value={form.maxUsesPerCustomer} onChange={e => set('maxUsesPerCustomer', e.target.value)} placeholder="Unlimited" /></label>
    <label className="admin-field"><span>Starts at (local time)</span><input type="datetime-local" required disabled={busy} value={form.startsAt} onChange={e => set('startsAt', e.target.value)} /></label>
    <label className="admin-field"><span>Ends at (local time)</span><input type="datetime-local" required disabled={busy} value={form.endsAt} onChange={e => set('endsAt', e.target.value)} /></label>
    <label className="admin-field admin-field--wide"><span>Publishing</span><span className="voucher-status-choice"><input type="checkbox" checked={form.isActive} disabled={busy} onChange={e => set('isActive', e.target.checked)} /> Active within scheduled period</span></label>
    <div className="admin-form-actions"><button type="button" disabled={busy} className="admin-button admin-button--ghost" onClick={onCancel}>Cancel</button><button disabled={busy} className="admin-button admin-button--primary" type="submit">{busy ? 'Saving…' : item ? 'Save voucher' : 'Create voucher'}</button></div>
  </form>
}
export default function DiscountVouchersPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(undefined)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  async function load() {
    try { setItems(await cmsRequest('/discount-vouchers')); setError('') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  async function save(payload, validationError) {
    if (validationError) return setFormError(validationError)
    setBusy(true); setFormError('')
    try {
      await cmsRequest(editing ? '/discount-vouchers/' + editing.id : '/discount-vouchers', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      setEditing(undefined); setNotice('Voucher saved. Customer preview and checkout use these rules.')
      await load()
    } catch (err) { setFormError(err.message) }
    finally { setBusy(false) }
  }
  async function disable(item) {
    if (!window.confirm('Disable voucher ' + item.code + '? Existing order discounts are preserved.')) return
    setBusy(true); setError('')
    try {
      await cmsRequest('/discount-vouchers/' + item.id, { method: 'DELETE' })
      setNotice(item.code + ' disabled.'); await load()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <div className="admin-page">
    <header className="admin-page-header"><div><small>COMMERCE · CUSTOMER CHECKOUT</small><h1>Discount vouchers</h1><p>Configure checkout codes. The backend enforces eligibility, usage limits, and actual order discount.</p></div><button type="button" className="admin-button admin-button--primary" onClick={() => { setEditing(null); setFormError('') }}>+ New voucher</button></header>
    {error && <div className="admin-error">{error}</div>}
    {notice && <div className="admin-notice">{notice}</div>}
    <section className="admin-panel"><header><div><h2>Voucher campaigns</h2><p>{items.length} codes · unpaid cancellation releases reserved claims</p></div></header>
      {loading ? <div className="admin-loading">Loading vouchers…</div> : items.length === 0 ? <div className="admin-empty">No discount codes yet.</div> :
        <div className="admin-table-wrap"><table><thead><tr><th>Code</th><th>Discount</th><th>Eligibility</th><th>Period</th><th>Claims</th><th>Status</th><th /></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <td><strong>{item.code}</strong><small>{item.type}</small></td>
            <td><strong>{discountLabel(item.type, item.value)}</strong><small>Min {rupiah(item.minimumSpend)}{item.maximumDiscount != null ? ' · cap ' + rupiah(item.maximumDiscount) : ''}</small></td>
            <td>{item.applicableKind || 'All products'}<small>{item.maxUsesPerCustomer == null ? 'No per-customer cap' : item.maxUsesPerCustomer + ' / customer'}</small></td>
            <td>{when(item.startsAt)}<small>Until {when(item.endsAt)}</small></td>
            <td><strong>{item.usedCount} / {item.maxUses ?? '∞'}</strong><small>Claimed orders</small></td>
            <td><span className={'admin-pill admin-pill--' + rowState(item).toLowerCase()}>{rowState(item)}</span></td>
            <td><div className="admin-row-actions"><button type="button" className="admin-button admin-button--ghost" disabled={busy} onClick={() => { setEditing(item); setFormError('') }}>Edit</button>{item.isActive && <button type="button" className="admin-button admin-button--danger" disabled={busy} onClick={() => disable(item)}>Disable</button>}</div></td>
          </tr>)}</tbody></table></div>}
    </section>
    {editing !== undefined && <div className="admin-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setEditing(undefined) }}><div className="admin-modal admin-modal--wide"><header><h2>{editing ? 'Edit voucher · ' + editing.code : 'New discount voucher'}</h2><button type="button" disabled={busy} aria-label="Close" onClick={() => setEditing(undefined)}>×</button></header><div className="admin-modal-body"><VoucherEditor key={editing?.id || 'new'} item={editing} busy={busy} error={formError} onSave={save} onCancel={() => setEditing(undefined)} /></div></div></div>}
  </div>
}
