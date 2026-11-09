import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, AlertTriangle, CalendarClock, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, GripVertical,
  Plus, Search, ShoppingBag, Trash2, Zap,
} from 'lucide-react'
import { cmsRequest } from './api'
import { FlashSaleItem } from '../components/FlashSale'
import { getFlashSalePages } from '../components/flashSaleLayout'
import { suspiciousCatalogPrice } from '../services/flashSaleFlow'
import {
  FLASH_STATUS, discountPercent, flashPayload, flashState,
  overlappingFlashSales, toWibInput, validateFlashDraft, wibInputToIso,
} from './flashSaleAdminUtils'
import './flash-sale-admin.css'

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`
const wibDate = (value) => value ? `${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value))} WIB` : '—'
const routeId = () => window.location.hash.match(/^#\/?flash-sale\/([^/]+)/)?.[1] ?? null
const blank = { name: '', slug: '', isActive: true, startsAt: '', endsAt: '', items: [] }

function Remaining({ end, now }) {
  const seconds = Math.max(0, Math.floor((Date.parse(end) - now) / 1000))
  if (!Number.isFinite(seconds)) return <>—</>
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return <>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</>
}

function Status({ promo, now }) {
  const state = flashState(promo, now)
  return <span className={`fsa-state fsa-state--${state}`}>{FLASH_STATUS[state]}</span>
}

function StorePreview({ draft, variants }) {
  const [page, setPage] = useState(0)
  const [now, setNow] = useState(Date.now)
  const [columns, setColumns] = useState(() => typeof window === 'undefined' ? 3 : window.innerWidth <= 620 ? 1 : window.innerWidth <= 800 ? 2 : 3)
  const items = useMemo(() => draft.items.map((item) => {
    const variant = variants.get(item.productVariantId)
    return variant && {
      id: item.productVariantId, name: variant.gameName || variant.productName,
      item: variant.name, image: variant.thumbnailUrl || undefined,
      price: Number(item.salePrice) || 0, originalPrice: Number(variant.price),
    }
  }).filter(Boolean), [draft.items, variants])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { const handleResize = () => setColumns(window.innerWidth <= 620 ? 1 : window.innerWidth <= 800 ? 2 : 3); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize) }, [])
  useEffect(() => setPage(0), [items.length, columns])
  const pages = getFlashSalePages(items, columns)
  const safePage = Math.min(page, Math.max(0, pages.length - 1))
  const endIso = wibInputToIso(draft.endsAt)
  return <div className="fsa-preview">
    <div className="fsa-preview-heading"><div><span className="fsa-preview-flame"><Zap size={19} fill="currentColor" /></span><h3>Flash Sale</h3></div>
      <span className="fsa-countdown"><Clock3 size={15} /> {endIso ? <Remaining end={endIso} now={now} /> : 'Atur jadwal terlebih dahulu'}</span>
    </div>
    {items.length === 0 ? <div className="fsa-preview-empty">Tambahkan varian di tab Produk & Harga untuk melihat kartu toko.</div> : <>
      <div className="fsa-preview-carousel"><button type="button" className="fsa-preview-arrow" onClick={() => setPage((safePage - 1 + pages.length) % pages.length)} disabled={pages.length < 2} aria-label="Slide sebelumnya"><ChevronLeft size={21} /></button>
        <div className="fsa-preview-grid">{pages[safePage].map((item) => <FlashSaleItem key={item.id} item={item} interactive={false} />)}</div>
        <button type="button" className="fsa-preview-arrow" onClick={() => setPage((safePage + 1) % pages.length)} disabled={pages.length < 2} aria-label="Slide berikutnya"><ChevronRight size={21} /></button>
      </div>
      {pages.length > 1 && <div className="fsa-preview-dots" aria-label="Halaman pratinjau">{pages.map((_, index) => <button key={index} type="button" aria-label={`Slide ${index + 1}`} aria-current={safePage === index ? 'page' : undefined} className={safePage === index ? 'is-active' : ''} onClick={() => setPage(index)} />)}</div>}
      <p className="fsa-preview-footnote">Slide {safePage + 1} dari {pages.length} · {columns} kartu per slide · Harga ini adalah draf, belum tersimpan.</p>
    </>}
  </div>
}

function VariantPicker({ variants, selected, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState(new Set())
  const allVariants = useMemo(() => [...variants.values()], [variants])
  const options = useMemo(() => allVariants.filter((variant) => `${variant.productName} ${variant.gameName} ${variant.name} ${variant.sku}`.toLowerCase().includes(query.toLowerCase())), [allVariants, query])
  const toggle = (id) => setChosen((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })
  useEffect(() => { const dismiss = (event) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', dismiss); return () => window.removeEventListener('keydown', dismiss) }, [onClose])
  return <div className="fsa-dialog-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} role="presentation">
    <section className="fsa-picker" role="dialog" aria-modal="true" aria-labelledby="fsa-picker-title">
      <div className="fsa-picker-head"><div><h2 id="fsa-picker-title">Tambah Varian</h2><p>Pilih beberapa varian sekaligus, lalu tambahkan ke promo.</p></div><button type="button" className="fsa-ghost" onClick={onClose}>Tutup</button></div>
      <label className="fsa-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Cari produk atau nominal…" /></label>
      <div className="fsa-picker-list">{options.length ? options.map((variant) => {
        const exists = selected.has(variant.id)
        const unavailable = !variant.isActive || !variant.productActive || !variant.gameActive
        const warning = suspiciousCatalogPrice(variant, allVariants)
        return <div className="fsa-picker-row" key={variant.id}><div><strong>{variant.gameName || variant.productName} · {variant.name}</strong><small>{rupiah(variant.price)} · {unavailable ? 'Nonaktif' : exists ? 'Sudah ditambahkan' : chosen.has(variant.id) ? 'Dipilih untuk ditambahkan' : 'Tersedia'}</small>{warning && <small className="fsa-catalog-warning"><AlertTriangle size={13} />{warning}</small>}</div><button className={`fsa-outline${chosen.has(variant.id) ? ' fsa-outline--chosen' : ''}`} type="button" disabled={exists || unavailable} aria-pressed={chosen.has(variant.id)} onClick={() => toggle(variant.id)}>{exists ? 'Sudah ada' : unavailable ? 'Nonaktif' : chosen.has(variant.id) ? 'Dipilih ✓' : 'Pilih'}</button></div>
      }) : <p className="fsa-inline-empty">Tidak ada varian yang cocok.</p>}</div>
      <footer className="fsa-picker-footer"><span>{chosen.size} varian dipilih</span><div><button type="button" className="fsa-ghost" onClick={onClose}>Batal</button><button type="button" className="fsa-primary" disabled={chosen.size === 0} onClick={() => onAdd([...chosen])}>Tambahkan {chosen.size} Varian</button></div></footer>
    </section>
  </div>
}

function FlashEditor({ promo, promos, variants, onBack, onSaved }) {
  const [draft, setDraft] = useState(() => promo ? {
    ...promo, startsAt: toWibInput(promo.startsAt), endsAt: toWibInput(promo.endsAt),
    items: [...(promo.items || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({ productVariantId: item.productVariantId, salePrice: String(item.salePrice) })),
  } : blank)
  const [tab, setTab] = useState('info')
  const [errors, setErrors] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(false)
  const [dragged, setDragged] = useState(null)
  const allowLeave = useRef(false)
  const [now, setNow] = useState(Date.now)
  const selected = useMemo(() => new Set(draft.items.map((item) => item.productVariantId)), [draft.items])
  const update = (patch) => { setDraft((old) => ({ ...old, ...patch })); setDirty(true); setErrors([]) }
  const changeItem = (id, salePrice) => update({ items: draft.items.map((row) => row.productVariantId === id ? { ...row, salePrice } : row) })
  const moveItem = (from, to) => {
    if (from == null || to == null || from === to || from < 0 || to < 0 || from >= draft.items.length || to >= draft.items.length) return
    const next = [...draft.items]; next.splice(to, 0, next.splice(from, 1)[0]); update({ items: next })
  }
  const goBack = () => { if (dirty && !window.confirm('Perubahan belum disimpan. Kembali tanpa menyimpan?')) return; allowLeave.current = true; onBack() }
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    const selfHash = window.location.hash
    const guard = () => { if (window.location.hash !== selfHash && dirty && !allowLeave.current && !window.confirm('Perubahan belum disimpan. Tinggalkan editor?')) window.location.hash = selfHash }
    const unload = (event) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('hashchange', guard); window.addEventListener('beforeunload', unload)
    return () => { window.removeEventListener('hashchange', guard); window.removeEventListener('beforeunload', unload) }
  }, [dirty])
  const startIso = wibInputToIso(draft.startsAt)
  const endIso = wibInputToIso(draft.endsAt)
  const overlapping = overlappingFlashSales(promos, { isActive: draft.isActive, startsAt: startIso, endsAt: endIso }, promo?.id)

  async function save() {
    const problems = validateFlashDraft(draft, variants, promos, promo?.id)
    if (problems.length) { setErrors(problems); setTab(problems.some((item) => /[Bb]aris|varian|harga promo|setidaknya/.test(item)) ? 'products' : 'info'); return }
    setSaving(true); setErrors([])
    try {
      const result = await cmsRequest(promo ? `/promotions/${promo.id}` : '/promotions', {
        method: promo ? 'PUT' : 'POST', body: JSON.stringify(flashPayload(draft)),
      })
      allowLeave.current = true
      setDirty(false)
      onSaved(typeof result === 'string' && result.includes('-') ? result : promo?.id)
    } catch (error) { setErrors([error.message]) } finally { setSaving(false) }
  }

  return <div className="admin-page fsa-admin fsa-editor">
    <button className="fsa-back" type="button" onClick={goBack}><ArrowLeft size={17} /> Kembali ke Flash Sale</button>
    <header className="fsa-editor-title"><div><span className="fsa-eyebrow">EDITOR FLASH SALE</span><h1>{promo ? draft.name : 'Buat Flash Sale'}</h1><p>{promo ? 'Atur promo dan periksa hasilnya sebelum disimpan.' : 'Atur jadwal dan harga untuk promo baru.'}</p></div><div className="fsa-editor-cta"><span className="fsa-dirty">{dirty ? '● Perubahan belum disimpan' : promo ? 'Perubahan tersimpan' : 'Belum disimpan'}</span><button type="button" className="fsa-primary" onClick={save} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Flash Sale'}</button></div></header>
    <nav className="fsa-tabs" aria-label="Bagian editor">{[['info', 'Informasi Flash Sale'], ['products', `Produk & Harga (${draft.items.length})`], ['preview', 'Pratinjau Toko']].map(([key, label]) => <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {errors.length > 0 && <div className="fsa-errors" role="alert"><AlertTriangle size={19} /><ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
    {tab === 'info' && <div className="fsa-editor-grid"><section className="fsa-panel"><h2>Informasi Flash Sale</h2><p className="fsa-section-sub">Informasi internal dan periode promo yang terlihat di toko.</p>
      <label className="fsa-field">Nama Flash Sale<input value={draft.name} onChange={(event) => update({ name: event.target.value })} maxLength={160} placeholder="Contoh: Gaming Week November" /></label>
      <div className="fsa-field-pair"><label className="fsa-field">Mulai (WIB)<input type="datetime-local" value={draft.startsAt} onChange={(event) => update({ startsAt: event.target.value })} /><small>Zona waktu Jakarta, UTC+7</small></label><label className="fsa-field">Selesai (WIB)<input type="datetime-local" value={draft.endsAt} onChange={(event) => update({ endsAt: event.target.value })} /><small>Harus setelah waktu mulai</small></label></div>
      <label className="fsa-switch"><input type="checkbox" checked={draft.isActive} onChange={(event) => update({ isActive: event.target.checked })} /><div><strong>Aktifkan Flash Sale</strong><small>Promo hanya ditampilkan jika jadwalnya sedang berlangsung.</small></div></label>
      {overlapping.length > 0 && <div className="fsa-note fsa-note--warn"><AlertTriangle size={17} /> Jadwal bertabrakan dengan {overlapping.map((item) => item.name).join(', ')}. Hanya satu Flash Sale aktif yang diperbolehkan pada periode yang sama.</div>}
      <details className="fsa-advanced"><summary>Pengaturan Lanjutan <ChevronDown size={16} /></summary><label className="fsa-field">Slug internal<input value={draft.slug} onChange={(event) => update({ slug: event.target.value })} placeholder="Otomatis dari nama jika kosong" /></label></details>
    </section><aside className="fsa-panel fsa-summary"><h2>Ringkasan Penayangan</h2><Status promo={{ ...draft, startsAt: startIso, endsAt: endIso }} now={now} /><div><CalendarClock size={17} /><span>Mulai</span><strong>{wibDate(startIso)}</strong></div><div><CalendarClock size={17} /><span>Selesai</span><strong>{wibDate(endIso)}</strong></div><div><ShoppingBag size={17} /><span>Varian</span><strong>{draft.items.length} produk</strong></div>{flashState({ ...draft, startsAt: startIso, endsAt: endIso }, now) === 'running' && <div className="fsa-time-left"><Clock3 size={17} /><span>Sisa waktu</span><strong><Remaining end={endIso} now={now} /></strong></div>}<button type="button" className="fsa-outline" onClick={() => setTab('preview')}>Lihat Pratinjau <ArrowRight size={15} /></button></aside></div>}
    {tab === 'products' && <><section className="fsa-panel"><div className="fsa-section-heading"><div><h2>Produk Flash Sale</h2><p className="fsa-section-sub">{draft.items.length} varian dipilih · Seret pegangan atau gunakan tombol untuk mengubah urutan.</p></div><button type="button" className="fsa-outline" onClick={() => setPicker(true)}><Plus size={17} /> Tambah Varian</button></div>
      {draft.items.length ? <div className="fsa-table-wrap"><table className="fsa-table"><thead><tr><th>Urutan</th><th>Produk / Varian</th><th>Harga Normal</th><th>Harga Promo</th><th>Diskon</th><th>Aksi</th></tr></thead><tbody>{draft.items.map((row, index) => {
        const variant = variants.get(row.productVariantId)
        const discount = discountPercent(variant?.price, row.salePrice)
        const invalidPrice = !Number(row.salePrice) || Number(row.salePrice) >= Number(variant?.price)
        const inactive = variant && (!variant.isActive || !variant.productActive || !variant.gameActive)
        const catalogWarning = suspiciousCatalogPrice(variant, [...variants.values()])
        return <tr key={`${row.productVariantId}-${index}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveItem(dragged, index); setDragged(null) }}>
          <td><div className="fsa-order"><button type="button" draggable onDragStart={() => setDragged(index)} onDragEnd={() => setDragged(null)} title="Seret untuk mengurutkan" aria-label={`Seret varian ${index + 1}`}><GripVertical size={19} /></button><span>{index + 1}</span></div></td>
          <td><div className="fsa-variant-name"><strong>{variant?.gameName || variant?.productName || 'Varian tidak ditemukan'}</strong><span>{variant?.name || row.productVariantId}</span>{inactive && <small className="fsa-invalid">Varian/produk nonaktif</small>}{catalogWarning && <small className="fsa-catalog-warning"><AlertTriangle size={13} />{catalogWarning}</small>}</div></td><td className="fsa-price-normal">{variant ? rupiah(variant.price) : '—'}</td>
          <td><div className="fsa-price-input"><span>Rp</span><input inputMode="numeric" aria-label={`Harga promo ${variant?.name || index + 1}`} value={row.salePrice === '' ? '' : new Intl.NumberFormat('id-ID').format(Number(row.salePrice) || 0)} onChange={(event) => changeItem(row.productVariantId, event.target.value.replace(/\D/g, ''))} placeholder="0" /></div>{invalidPrice && <small className="fsa-invalid">Harus lebih rendah dari harga normal</small>}</td>
          <td>{discount != null && discount > 0 ? <span className="fsa-discount">−{discount}%</span> : '—'}</td><td><div className="fsa-row-actions"><button type="button" disabled={index === 0} title="Naikkan urutan" aria-label={`Naikkan ${variant?.name}`} onClick={() => moveItem(index, index - 1)}>↑</button><button type="button" disabled={index === draft.items.length - 1} title="Turunkan urutan" aria-label={`Turunkan ${variant?.name}`} onClick={() => moveItem(index, index + 1)}>↓</button><button type="button" title="Hapus varian" aria-label={`Hapus ${variant?.name}`} onClick={() => update({ items: draft.items.filter((_, idx) => idx !== index) })}><Trash2 size={16} /></button></div></td>
        </tr>
      })}</tbody></table></div> : <div className="fsa-inline-empty">Belum ada varian promo. Klik <strong>Tambah Varian</strong> untuk memilih produk.</div>}
      <p className="fsa-table-note">Urutan 1–3 = slide pertama, 4–6 = slide kedua pada tampilan desktop. Pratinjau mengikuti urutan dan harga draf.</p></section><section className="fsa-panel fsa-preview-section"><div className="fsa-section-heading"><div><h2>Pratinjau Toko</h2><p className="fsa-section-sub">Kartu yang sama dengan homepage, diperbarui sebelum disimpan.</p></div><button type="button" className="fsa-ghost" onClick={() => setTab('preview')}>Perbesar <ArrowRight size={15} /></button></div><StorePreview draft={draft} variants={variants} /></section></>}
    {tab === 'preview' && <section className="fsa-panel fsa-preview-section"><div className="fsa-section-heading"><div><h2>Pratinjau Toko</h2><p className="fsa-section-sub">Gunakan panah atau titik navigasi untuk memeriksa seluruh kartu Flash Sale.</p></div><a href="https://dev.zetruv.com" target="_blank" rel="noopener noreferrer" className="fsa-outline">Lihat Toko <ArrowRight size={15} /></a></div><StorePreview draft={draft} variants={variants} /></section>}
    <footer className="fsa-editor-footer"><span>{dirty ? 'Perubahan belum disimpan' : 'Pastikan produk dan jadwal sudah sesuai sebelum menyimpan.'}</span><div><button type="button" className="fsa-ghost" onClick={goBack}>Kembali</button><button type="button" className="fsa-primary" disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan Flash Sale'}</button></div></footer>
    {picker && <VariantPicker variants={variants} selected={selected} onClose={() => setPicker(false)} onAdd={(ids) => { update({ items: [...draft.items, ...ids.filter((id) => !selected.has(id)).map((id) => ({ productVariantId: id, salePrice: '' }))] }); setPicker(false) }} />}
  </div>
}

export default function FlashSaleAdminPage() {
  const [editorId, setEditorId] = useState(routeId)
  const [promos, setPromos] = useState([])
  const [variants, setVariants] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)
  const [busy, setBusy] = useState(false)
  useEffect(() => { const listener = () => setEditorId(routeId()); window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener) }, [])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  async function load() {
    setLoading(true); setError('')
    try {
      const [promotions, products, games] = await Promise.all([cmsRequest('/promotions'), cmsRequest('/catalog/products'), cmsRequest('/catalog/games')])
      const gameMap = new Map(games.map((game) => [game.id, game]))
      const details = []
      for (let index = 0; index < products.length; index += 5) details.push(...await Promise.all(products.slice(index, index + 5).map((product) => cmsRequest(`/catalog/products/${product.id}`))))
      setPromos(promotions.filter((promotion) => promotion.isFlashSale))
      setVariants(new Map(details.flatMap((product) => (product.variants || []).map((variant) => [variant.id, {
        ...variant, productId: product.id, productName: product.name, productActive: product.isActive,
        gameName: gameMap.get(product.gameId)?.name || '', gameActive: gameMap.get(product.gameId)?.isActive !== false,
        thumbnailUrl: product.thumbnailUrl,
      }]))))
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const goTo = (id) => { window.location.hash = id ? `/flash-sale/${id}` : '/flash-sale' }
  async function disable(promo) {
    const running = flashState(promo, now) === 'running'
    if (!window.confirm(`Nonaktifkan "${promo.name}"?${running ? '\n\nPromo sedang berjalan dan akan segera hilang dari toko. Harga normal kembali berlaku.' : ''}\n\nPromo dapat diaktifkan lagi dari editor selama jadwalnya valid.`)) return
    setBusy(true); setError('')
    try { await cmsRequest(`/promotions/${promo.id}`, { method: 'DELETE' }); await load(); setNotice('Flash Sale berhasil dinonaktifkan.') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const runningCount = promos.filter((promo) => flashState(promo, now) === 'running').length
  const scheduledCount = promos.filter((promo) => flashState(promo, now) === 'scheduled').length
  const totalVariants = promos.reduce((sum, promo) => sum + (promo.items?.length || 0), 0)
  if (editorId) {
    const editing = promos.find((promo) => promo.id === editorId)
    if (loading) return <div className="admin-page fsa-admin"><p className="fsa-loading">Memuat editor Flash Sale…</p></div>
    if (error) return <div className="admin-page fsa-admin"><div className="fsa-errors" role="alert">{error}</div><button type="button" className="fsa-ghost" onClick={() => goTo(null)}>Kembali</button></div>
    if (editorId !== 'baru' && !editing) return <div className="admin-page fsa-admin"><p>Flash Sale tidak ditemukan.</p><button type="button" className="fsa-outline" onClick={() => goTo(null)}>Kembali ke Daftar</button></div>
    return <FlashEditor key={editorId} promo={editing} promos={promos} variants={variants} onBack={() => goTo(null)} onSaved={async () => { setNotice('Flash Sale berhasil disimpan.'); goTo(null); await load() }} />
  }
  return <div className="admin-page fsa-admin"><header className="fsa-list-heading"><div><span className="fsa-eyebrow">TOKO · PROMOSI</span><h1>Flash Sale</h1><p>Kelola promo kilat yang tampil di toko.</p></div><button type="button" className="fsa-primary" onClick={() => goTo('baru')}><Plus size={18} /> Buat Flash Sale</button></header>
    {error && <div className="fsa-errors" role="alert">{error}</div>}{notice && <div className="fsa-notice" role="status"><CheckCircle2 size={18} /> {notice}</div>}
    <div className="fsa-stats"><div><span>Sedang Berjalan</span><strong>{runningCount}</strong><small>Aktif sekarang</small></div><div><span>Terjadwal</span><strong>{scheduledCount}</strong><small>Belum dimulai</small></div><div><span>Total Varian</span><strong>{totalVariants}</strong><small>Di seluruh promo</small></div></div>
    {loading ? <div className="fsa-panel fsa-loading">Memuat daftar Flash Sale…</div> : promos.length === 0 ? <div className="fsa-panel fsa-inline-empty">Belum ada Flash Sale. Klik <strong>Buat Flash Sale</strong> untuk memulai.</div> : <div className="fsa-promo-list">{promos.map((promo) => <article className="fsa-promo-card" key={promo.id}>
      <div className="fsa-promo-top"><div><h2>{promo.name}</h2><div className="fsa-promo-badges"><Status promo={promo} now={now} /><span>{promo.items?.length || 0} varian</span></div></div><div className="fsa-promo-actions"><button type="button" className="fsa-outline" onClick={() => goTo(promo.id)}>Ubah</button>{promo.isActive && <button type="button" className="fsa-ghost fsa-danger-text" disabled={busy} onClick={() => disable(promo)}>Nonaktifkan</button>}</div></div>
      <div className="fsa-promo-times"><div><CalendarClock size={18} /><span>Mulai</span><strong>{wibDate(promo.startsAt)}</strong></div><div><CalendarClock size={18} /><span>Selesai</span><strong>{wibDate(promo.endsAt)}</strong></div></div>
      {flashState(promo, now) === 'running' && <div className="fsa-promo-remaining"><Clock3 size={17} /> Sisa waktu: <strong><Remaining end={promo.endsAt} now={now} /></strong></div>}
    </article>)}</div>}
  </div>
}
