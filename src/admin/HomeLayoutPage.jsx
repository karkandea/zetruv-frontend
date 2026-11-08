import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowUp, Check, ExternalLink, GripVertical, Settings2, X } from 'lucide-react'
import { cmsRequest } from './api'
import { shiftItem } from './bannerUtils'
import './banner-management.css'

const knownSections = {
  service_categories: 'Kategori Layanan',
  flash_sale: 'Flash Sale',
  popular_games: 'Game Populer',
  recently_purchased: 'Terakhir Dibeli',
  joki: 'Joki Game',
  game_accounts: 'Akun Game Pilihan',
  merchandise: 'Merchandise',
  latest_articles: 'Artikel Terbaru',
}

const knownDestinations = [
  { value: '', label: 'Pilih halaman tujuan' },
  { value: '/', label: 'Beranda' },
  { value: '/search', label: 'Semua produk' },
  { value: '/articles', label: 'Artikel' },
]

const sectionPayload = (item, sortOrder = item.sortOrder) => ({
  title: item.title, subtitle: item.subtitle || null, ctaLabel: item.ctaLabel || null,
  ctaUrl: item.ctaUrl || null, isEnabled: item.isEnabled, sortOrder,
  itemLimit: Number(item.itemLimit),
})

function LayoutEditor({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item })
  const [showCta, setShowCta] = useState(Boolean(item.ctaLabel || item.ctaUrl))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const firstInput = useRef(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(item)
  const update = (field, value) => setForm((previous) => ({ ...previous, [field]: value }))
  function close() { if (!busy && (!dirty || window.confirm('Perubahan belum disimpan. Yakin ingin keluar?'))) onClose() }
  useEffect(() => {
    firstInput.current?.focus()
    const escape = (event) => { if (event.key === 'Escape') { event.stopPropagation(); close() } }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [dirty, busy])

  async function save(event) {
    event.preventDefault()
    if (!form.title.trim()) { setError('Judul bagian wajib diisi.'); return }
    if (form.itemLimit < 1 || form.itemLimit > 50) { setError('Jumlah item harus antara 1 dan 50.'); return }
    if (Boolean(form.ctaLabel?.trim()) !== Boolean(form.ctaUrl)) { setError('Teks tombol dan halaman tujuan harus diisi bersama.'); return }
    setBusy(true); setError('')
    try {
      await cmsRequest(`/homepage/sections/${encodeURIComponent(item.key)}`, { method: 'PUT', body: JSON.stringify(sectionPayload({ ...form, title: form.title.trim() })) })
      onSave()
    } catch (err) { setError(err.message || 'Perubahan gagal disimpan.') }
    finally { setBusy(false) }
  }
  const destinationKnown = knownDestinations.some((option) => option.value === form.ctaUrl)
  return <div className="cms-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="cms-layout-dialog-title" className="cms-layout-dialog">
      <header><div><small>ATUR BAGIAN BERANDA</small><h2 id="cms-layout-dialog-title">Atur {knownSections[item.key] || item.title}</h2></div><button type="button" aria-label="Tutup pengaturan" onClick={close}><X size={20} /></button></header>
      <form onSubmit={save}>
        <div className="cms-dialog-content">
          <label className="cms-input-field">Judul Bagian<input ref={firstInput} maxLength={160} value={form.title} onChange={(event) => update('title', event.target.value)} required /></label>
          <label className="cms-input-field">Deskripsi <small>Opsional</small><textarea rows={3} maxLength={500} value={form.subtitle || ''} onChange={(event) => update('subtitle', event.target.value)} placeholder="Tulis deskripsi singkat…" /></label>
          <div className="cms-input-stepper"><div><strong>Jumlah Item Ditampilkan</strong><span>Maksimal 50 item di bagian ini</span></div><div><button type="button" aria-label="Kurangi jumlah" disabled={form.itemLimit <= 1} onClick={() => update('itemLimit', Math.max(1, Number(form.itemLimit) - 1))}>−</button><output>{form.itemLimit}</output><button type="button" aria-label="Tambah jumlah" disabled={form.itemLimit >= 50} onClick={() => update('itemLimit', Math.min(50, Number(form.itemLimit) + 1))}>+</button></div></div>
          <label className="cms-check"><input type="checkbox" checked={form.isEnabled} onChange={(event) => update('isEnabled', event.target.checked)} /><span><strong>Tampilkan Bagian Ini</strong><small>Jika dinonaktifkan, pengaturannya tetap tersimpan.</small></span><span className={`cms-status cms-status--${form.isEnabled ? 'aktif' : 'nonaktif'}`}>{form.isEnabled ? 'Aktif' : 'Nonaktif'}</span></label>
          {!showCta && <button type="button" className="cms-text-action" onClick={() => setShowCta(true)}>+ Atur tombol navigasi bagian</button>}
          {showCta && <div className="cms-dialog-cta"><strong>Tombol Navigasi</strong><label className="cms-input-field">Teks Tombol<input maxLength={80} placeholder="Contoh: Lihat Semua" value={form.ctaLabel || ''} onChange={(event) => update('ctaLabel', event.target.value)} /></label>
            <label className="cms-input-field">Halaman Tujuan<select value={form.ctaUrl || ''} onChange={(event) => update('ctaUrl', event.target.value)}>{!destinationKnown && <option value={form.ctaUrl}>Tujuan sebelumnya — {form.ctaUrl}</option>}{knownDestinations.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <button type="button" className="cms-text-action" onClick={() => { setShowCta(false); setForm((previous) => ({ ...previous, ctaLabel: '', ctaUrl: '' })) }}>Hilangkan tombol navigasi</button></div>}
        </div>
        <footer>{error && <p className="cms-form-error" role="alert"><AlertCircle size={16} /> {error}</p>}<div><button type="button" className="admin-button admin-button--ghost" onClick={close}>Batal</button><button type="submit" className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Perubahan'}</button></div></footer>
      </form>
    </section>
  </div>
}

export default function HomeLayoutPage({ storefrontUrl }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const dragged = useRef(null)
  async function load() {
    setLoading(true); setError('')
    try { setItems(await cmsRequest('/homepage/sections')); setDirty(false) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  function move(from, to) {
    if (from < 0 || to < 0 || to >= items.length || from === to) return
    const item = items[from]
    setItems((current) => shiftItem(current, from, to))
    setDirty(true)
    setAnnouncement(`${knownSections[item.key] || item.title} pindah ke posisi ${to + 1}.`)
  }
  async function saveOrder() {
    setSaving(true); setError('')
    try {
      await cmsRequest('/homepage/sections/reorder', { method: 'PUT', body: JSON.stringify(items.map(({ key }) => ({ key }))) })
      await load()
      setAnnouncement('Urutan beranda berhasil disimpan.')
    } catch (err) { setError(`Urutan gagal disimpan: ${err.message}. Muat ulang halaman untuk melihat perubahan di server.`) }
    finally { setSaving(false) }
  }
  return <div className="admin-page cms-manage-page">
    <header className="cms-page-heading"><div><small>TAMPILAN TOKO</small><h1>Susunan Beranda</h1><p>Atur urutan bagian yang ditampilkan di halaman utama toko.</p></div>{storefrontUrl && <a className="admin-button admin-button--ghost" href={storefrontUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Pratinjau Toko</a>}</header>
    <div className="cms-layout-hint"><GripVertical size={17} /> Geser bagian atau gunakan tombol panah untuk mengubah urutannya.</div>
    {error && <div className="admin-error" role="alert">{error}</div>}
    <div className="cms-sr-only" aria-live="polite">{announcement}</div>
    {loading ? <div className="cms-list-placeholder">Memuat susunan beranda…</div> : !items.length ? <div className="cms-list-placeholder">Belum ada bagian beranda yang bisa diatur.</div> : <div className="cms-sortable-list cms-layout-list">
      {items.map((item, index) => <article key={item.key} className="cms-layout-row" draggable onDragStart={(event) => { dragged.current = index; event.dataTransfer.effectAllowed = 'move' }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragged.current !== null) move(dragged.current, index); dragged.current = null }} onDragEnd={() => { dragged.current = null }}>
        <div className="cms-sort-controls"><GripVertical size={20} /><div><button type="button" aria-label={`Naikkan ${item.title}`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Turunkan ${item.title}`} disabled={index === items.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={15} /></button></div></div>
        <span className="cms-layout-position">{index + 1}</span><div className="cms-layout-row-copy"><strong>{knownSections[item.key] || item.title}</strong><span>{item.itemLimit} item ditampilkan</span></div>
        <span className={`cms-status cms-status--${item.isEnabled ? 'aktif' : 'nonaktif'}`}>{item.isEnabled ? 'Aktif' : 'Nonaktif'}</span>
        <button className="admin-button admin-button--ghost" type="button" onClick={() => { if (dirty && !window.confirm('Urutan belum disimpan. Lanjut ke pengaturan bagian?')) return; setEditing(item) }}><Settings2 size={15} /> Atur</button>
      </article>)}
    </div>}
    <footer className="cms-sort-footer"><span><Check size={15} /> Bagian nonaktif tetap tersimpan dan bisa diaktifkan kembali.</span>{dirty && <button className="admin-button admin-button--primary" type="button" disabled={saving} onClick={saveOrder}>{saving ? 'Menyimpan…' : 'Simpan Urutan'}</button>}</footer>
    {editing && <LayoutEditor key={editing.key} item={editing} onClose={() => setEditing(null)} onSave={() => { setEditing(null); load() }} />}
  </div>
}
