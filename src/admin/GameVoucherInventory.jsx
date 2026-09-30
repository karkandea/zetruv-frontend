import { useEffect, useMemo, useState } from 'react'
import { cmsRequest } from './api'
import './game-voucher-inventory.css'

const date = value => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—'

export default function GameVoucherInventory({ productId, variant, onStockChanged }) {
  const [data, setData] = useState(null)
  const [codesText, setCodesText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const path = `/catalog/products/${productId}/variants/${variant.id}/voucher-codes`

  const parsedCodes = useMemo(() => codesText
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean), [codesText])

  async function load() {
    try {
      setData(await cmsRequest(`${path}?page=1&pageSize=100`))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [productId, variant.id])
  async function importCodes(event) {
    event.preventDefault()
    if (parsedCodes.length === 0) {
      setError('Paste at least one voucher code, one code per line.')
      return
    }
    if (parsedCodes.length > 500) {
      setError('Import supports at most 500 codes at once.')
      return
    }

    setBusy(true); setError(''); setNotice('')
    try {
      const result = await cmsRequest(path, {
        method: 'POST',
        body: JSON.stringify({ codes: parsedCodes }),
      })
      setCodesText('')
      setNotice(`Imported ${result.imported} code(s). ${result.skippedDuplicates} duplicate(s) skipped.`)
      await load()
      onStockChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function revoke(item) {
    if (!window.confirm('Revoke this unassigned code? The raw code cannot be restored after revocation.')) return
    setBusy(true); setError(''); setNotice('')
    try {
      await cmsRequest(`${path}/${item.id}`, { method: 'DELETE' })
      setNotice('Voucher code revoked.')
      await load()
      onStockChanged?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="game-voucher-inventory">
    <div className="gv-security-note">
      <strong>Encrypted inventory</strong>
      <span>Raw codes are encrypted at rest and never shown back in CMS. After a paid order, codes are assigned automatically and only the owning customer can reveal them.</span>
    </div>
    {error && <div className="admin-error">{error}</div>}
    {notice && <div className="admin-notice">{notice}</div>}

    {data && <div className="gv-stat-grid">
      <article><small>Sellable stock</small><strong>{data.sellableStock}</strong><span>Not reserved by pending orders</span></article>
      <article><small>Unassigned codes</small><strong>{data.availableCodeCount}</strong><span>Includes codes committed to reservations</span></article>
      <article><small>Assigned</small><strong>{data.assignedCodeCount}</strong><span>Paid customer orders</span></article>
      <article><small>Revoked</small><strong>{data.revokedCodeCount}</strong><span>Destroyed / unavailable</span></article>
    </div>}
    <form className="gv-import" onSubmit={importCodes}>
      <label>
        <span>Import codes · one per line</span>
        <textarea rows={7} value={codesText} disabled={busy}
          onChange={event => setCodesText(event.target.value)}
          placeholder={'STEAM-XXXX-XXXX\nSTEAM-YYYY-YYYY'} />
      </label>
      <div>
        <small>{parsedCodes.length} code(s) ready · max 500 per import</small>
        <button className="admin-button admin-button--primary" disabled={busy || parsedCodes.length === 0}>
          {busy ? 'Processing…' : 'Encrypt & import'}
        </button>
      </div>
    </form>

    {data && <div className="admin-table-wrap gv-table"><table>
      <thead><tr><th>Status</th><th>Assigned order item</th><th>Reveals</th><th>Imported</th><th>Assigned</th><th /></tr></thead>
      <tbody>{data.items.map(item => <tr key={item.id}>
        <td><span className={'admin-pill admin-pill--' + item.status.toLowerCase()}>{item.status}</span></td>
        <td>{item.orderItemId ? <code>{item.orderItemId.slice(0, 8)}…</code> : '—'}</td>
        <td>{item.revealCount}<small>{item.lastRevealedAt ? 'Last ' + date(item.lastRevealedAt) : 'Never revealed'}</small></td>
        <td>{date(item.createdAt)}</td>
        <td>{date(item.assignedAt)}</td>
        <td>{item.status === 'Available' && <button type="button"
          className="admin-button admin-button--danger"
          disabled={busy || data.sellableStock <= 0}
          title={data.sellableStock <= 0 ? 'Code is committed to a pending reservation' : 'Revoke code'}
          onClick={() => revoke(item)}>Revoke</button>}</td>
      </tr>)}</tbody>
    </table></div>}
    {data?.items?.length === 0 && <div className="admin-empty">No encrypted codes imported for this SKU.</div>}
  </div>
}
