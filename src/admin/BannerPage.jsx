import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  AlertCircle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronDown,
  ExternalLink, GripVertical, ImageOff, ImagePlus, Monitor, MoreHorizontal,
  Plus, Smartphone, Trash2, UploadCloud,
} from 'lucide-react'
import { cmsRequest } from './api'
import { bannerPayload, bannerState, MAX_BANNER_BYTES, shiftItem, toLocalInput, validateBanner } from './bannerUtils'
import './banner-management.css'

const destinationOptions = [
  { value: '', label: 'Pilih halaman tujuan' },
  { value: '/', label: 'Beranda' },
  { value: '/search', label: 'Semua produk' },
  { value: '/search?kind=TopUpGame', label: 'Top Up via ID' },
  { value: '/search?kind=TopUpLogin', label: 'Top Up via Login' },
  { value: '/search?kind=GameVoucher', label: 'Voucher Game' },
  { value: '/search?kind=Joki', label: 'Joki Game' },
  { value: '/articles', label: 'Artikel' },
]

function DestinationSelect({ value, onChange, id }) {
  const known = destinationOptions.some((option) => option.value === value)
  return <select id={id} value={value || ''} onChange={(event) => onChange(event.target.value)}>
    {!known && <option value={value}>Tujuan sebelumnya — {value}</option>}
    {destinationOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
  </select>
}

function BannerPicture({ src, alt, className = '', onState }) {
  const [failed, setFailed] = useState(!src)
  useEffect(() => { setFailed(!src); onState?.(src ? 'loading' : 'error') }, [src])
  return <div className={`cms-banner-image ${className}${failed ? ' cms-banner-image--broken' : ''}`}>
    {src && <img key={src} src={src} alt={alt} onLoad={() => { setFailed(false); onState?.('loaded') }} onError={() => { setFailed(true); onState?.('error') }} />}
    {failed && <div className="cms-banner-image-error"><ImageOff size={24} /><span>Gambar tidak dapat dimuat</span></div>}
  </div>
}

function StatusBadge({ status }) {
  return <span className={`cms-status cms-status--${status.toLowerCase()}`}>{status}</span>
}

function BannerEditor({ item, nextOrder, uploadSupported, storefrontUrl, onSaved, onCancel }) {
  const original = useMemo(() => ({
    title: item?.title || '', subtitle: item?.subtitle || '', imageUrl: item?.imageUrl || '',
    primaryCtaLabel: item?.primaryCtaLabel || '', primaryCtaUrl: item?.primaryCtaUrl || '',
    secondaryCtaLabel: item?.secondaryCtaLabel || '', secondaryCtaUrl: item?.secondaryCtaUrl || '',
    isActive: item?.isActive ?? true,
    scheduled: Boolean(item?.startsAt || item?.endsAt),
    startsAt: toLocalInput(item?.startsAt), endsAt: toLocalInput(item?.endsAt),
  }), [item])
  const [form, setForm] = useState(original)
  const [imageState, setImageState] = useState(item?.imageUrl ? 'loading' : 'error')
  const [imageMessage, setImageMessage] = useState('')
  const [uploadInfo, setUploadInfo] = useState('')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [previewMode, setPreviewMode] = useState('desktop')
  const [secondCta, setSecondCta] = useState(Boolean(item?.secondaryCtaLabel))
  const [newAssets, setNewAssets] = useState([])
  const fileRef = useRef(null)
  const formId = useId()
  const dirty = JSON.stringify(form) !== JSON.stringify(original)
  useEffect(() => {
    const handler = (event) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
  useEffect(() => {
    if (!dirty) return undefined
    const editorHash = window.location.hash
    const handleRouteChange = () => {
      if (!window.confirm('Perubahan banner belum disimpan. Tinggalkan halaman ini?')) window.location.hash = editorHash
    }
    window.addEventListener('hashchange', handleRouteChange)
    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [dirty])
  const update = (field, value) => { setForm((previous) => ({ ...previous, [field]: value })); setError('') }

  async function cleanupUnused(keepUrl = '') {
    await Promise.allSettled(newAssets.filter((asset) => asset.url !== keepUrl).map((asset) => cmsRequest(`/media/${asset.id}`, { method: 'DELETE' })))
  }

  async function close() {
    if (uploading || busy) return
    if (dirty && !window.confirm('Perubahan belum disimpan. Yakin ingin keluar tanpa menyimpan?')) return
    await cleanupUnused()
    onCancel()
  }

  async function uploadFile(file) {
    if (!file || !uploadSupported || uploading) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageMessage('Format gambar harus JPG, PNG, atau WebP.')
      return
    }
    if (file.size > MAX_BANNER_BYTES) {
      setImageMessage('Gambar terlalu besar. Maksimal ukuran gambar adalah 3 MB. Silakan pilih gambar lain.')
      return
    }
    setUploading(true); setError(''); setImageMessage('')
    try {
      const body = new FormData()
      body.append('file', file)
      const asset = await cmsRequest('/media/banner', { method: 'POST', body })
      setNewAssets((previous) => [...previous, asset])
      update('imageUrl', asset.url)
      setImageState('loading')
      setUploadInfo(`${(file.size / 1024 / 1024).toFixed(1)} MB → ${(asset.sizeBytes / 1024).toFixed(0)} KB setelah optimasi`)
    } catch (err) {
      setImageMessage(err.message || 'Gambar gagal diunggah. Coba lagi.')
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function submit(event) {
    event.preventDefault()
    const problem = validateBanner(form, imageState === 'loaded')
    if (problem) { setError(problem); return }
    setBusy(true); setError('')
    try {
      await cmsRequest(item ? `/homepage/heroes/${item.id}` : '/homepage/heroes', {
        method: item ? 'PUT' : 'POST', body: JSON.stringify(bannerPayload(form, item?.sortOrder ?? nextOrder)),
      })
      await cleanupUnused(form.imageUrl)
      onSaved()
    } catch (err) { setError(err.message || 'Banner gagal disimpan.') }
    finally { setBusy(false) }
  }

  return <div className="admin-page cms-banner-editor">
    <div className="cms-editor-top"><button className="cms-back" type="button" onClick={close}><ArrowLeft size={17} /> Kembali ke Banner</button><span>{item ? 'Ubah Banner' : 'Tambah Banner'}</span></div>
    <header className="cms-page-heading"><div><h1>{item ? 'Ubah Banner' : 'Tambah Banner'}</h1><p>Lengkapi informasi untuk menampilkan banner di toko.</p></div></header>
    <form onSubmit={submit} noValidate>
      <div className="cms-editor-columns">
        <div className="cms-editor-stack">
          <section className="cms-panel-block"><h2><span>1</span> Gambar Banner</h2>
            {uploadSupported ? <div className="cms-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadFile(event.dataTransfer.files[0]) }}>
              <UploadCloud size={31} strokeWidth={1.65} /><strong>{uploading ? 'Mengunggah dan mengoptimasi…' : 'Pilih atau seret gambar ke sini'}</strong>
              <span>JPG, PNG, WebP · Maksimal 3 MB</span>
              <button className="admin-button admin-button--ghost" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>{form.imageUrl ? 'Ganti Gambar' : 'Pilih Gambar'}</button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadFile(event.target.files?.[0])} aria-label="Pilih gambar banner" hidden />
            </div> : <div className="cms-upload-unavailable"><AlertCircle size={19} /> Unggah gambar belum tersedia di server CMS ini. Fitur akan aktif setelah layanan penyimpanan banner siap.</div>}
            {imageMessage && <p role="alert" className="cms-form-error"><AlertCircle size={16} />{imageMessage}</p>}
            {uploadInfo && <p className="cms-upload-success"><CheckCircle2 size={16} /> {uploadInfo}</p>}
            <p className="cms-helper">Gambar akan dioptimasi menjadi WebP dan disimpan oleh sistem. Ukuran optimal mengikuti tampilan toko.</p>
          </section>
          <section className="cms-panel-block"><h2><span>2</span> Teks Banner</h2>
            <label className="cms-input-field" htmlFor={`${formId}-title`}>Judul Banner<input id={`${formId}-title`} maxLength={160} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Contoh: Promo Top Up Mobile Legends" required /></label>
            <label className="cms-input-field" htmlFor={`${formId}-subtitle`}>Deskripsi<textarea id={`${formId}-subtitle`} rows={3} maxLength={500} value={form.subtitle} onChange={(event) => update('subtitle', event.target.value)} placeholder="Tulis deskripsi singkat banner…" required /></label>
          </section>
          <section className="cms-panel-block"><h2><span>3</span> Tombol Banner <small>Opsional</small></h2>
            <label className="cms-input-field" htmlFor={`${formId}-cta`}>Tulisan pada Tombol<input id={`${formId}-cta`} maxLength={80} value={form.primaryCtaLabel} onChange={(event) => update('primaryCtaLabel', event.target.value)} placeholder="Contoh: Beli Sekarang" /></label>
            <label className="cms-input-field" htmlFor={`${formId}-destination`}>Arahkan Pengunjung ke<DestinationSelect id={`${formId}-destination`} value={form.primaryCtaUrl} onChange={(value) => update('primaryCtaUrl', value)} /></label>
            {secondCta ? <div className="cms-second-cta"><label className="cms-input-field">Tulisan Tombol Kedua<input maxLength={80} value={form.secondaryCtaLabel} onChange={(event) => update('secondaryCtaLabel', event.target.value)} placeholder="Contoh: Lihat Selengkapnya" /></label>
              <label className="cms-input-field">Halaman Tujuan Kedua<DestinationSelect value={form.secondaryCtaUrl} onChange={(value) => update('secondaryCtaUrl', value)} /></label>
              <button className="cms-text-action" type="button" onClick={() => { setSecondCta(false); setForm((previous) => ({ ...previous, secondaryCtaLabel: '', secondaryCtaUrl: '' })) }}>Hapus tombol kedua</button></div>
              : <button className="cms-text-action" type="button" onClick={() => setSecondCta(true)}><Plus size={15} /> Tambah Tombol Kedua</button>}
          </section>
        </div>
        <div className="cms-editor-stack">
          <section className="cms-panel-block cms-preview-section"><div className="cms-preview-heading"><h2>Pratinjau Banner</h2><div className="cms-segmented"><button type="button" aria-pressed={previewMode === 'desktop'} onClick={() => setPreviewMode('desktop')}><Monitor size={15} /> Desktop</button><button type="button" aria-pressed={previewMode === 'mobile'} onClick={() => setPreviewMode('mobile')}><Smartphone size={15} /> Mobile</button></div></div>
            <div className={`cms-preview-canvas cms-preview-canvas--${previewMode}`}><BannerPicture src={form.imageUrl} alt="Pratinjau gambar banner" onState={setImageState} />
              <div className="cms-preview-copy"><strong>{form.title || 'Judul Banner'}</strong><span>{form.subtitle || 'Deskripsi banner akan terlihat di sini.'}</span>{form.primaryCtaLabel && <em>{form.primaryCtaLabel}</em>}</div>
            </div>
            {imageState === 'error' && form.imageUrl && <p role="alert" className="cms-form-error"><AlertCircle size={16} /> Gambar tidak dapat dimuat. Unggah gambar baru sebelum menayangkan.</p>}
            <p className="cms-helper">Pratinjau membantu memeriksa gambar dan teks sebelum disimpan.</p>
          </section>
          <section className="cms-panel-block"><h2><span>4</span> Pengaturan Penayangan</h2>
            <label className="cms-radio"><input type="radio" checked={!form.scheduled} onChange={() => update('scheduled', false)} /> Tampilkan sekarang</label>
            <label className="cms-radio"><input type="radio" checked={form.scheduled} onChange={() => update('scheduled', true)} /> Jadwalkan penayangan</label>
            {form.scheduled && <div className="cms-date-row"><label className="cms-input-field">Tanggal Mulai<input type="datetime-local" value={form.startsAt} onChange={(event) => update('startsAt', event.target.value)} /></label><label className="cms-input-field">Tanggal Berakhir<input type="datetime-local" value={form.endsAt} onChange={(event) => update('endsAt', event.target.value)} /></label></div>}
            <label className="cms-check"><input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} /> <span><strong>Aktifkan Banner</strong><small>Jika nonaktif, banner tersimpan tetapi tidak tampil di toko.</small></span></label>
          </section>
        </div>
      </div>
      <div className="cms-editor-footer">{error && <p className="cms-form-error" role="alert"><AlertCircle size={17} /> {error}</p>}<div className="cms-editor-buttons"><button type="button" className="admin-button admin-button--ghost" onClick={close}>Batal</button><button disabled={busy || uploading} className="admin-button admin-button--primary">{busy ? 'Menyimpan…' : item ? 'Simpan Perubahan' : 'Simpan Banner'}</button></div></div>
    </form>
  </div>
}

export default function BannerPage({ storefrontUrl }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(undefined)
  const [filter, setFilter] = useState('Semua')
  const [dirtyOrder, setDirtyOrder] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [uploadSupported, setUploadSupported] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [brokenIds, setBrokenIds] = useState({})
  const dragged = useRef(null)

  async function load() {
    setLoading(true); setError('')
    try { setItems(await cmsRequest('/homepage/heroes')); setDirtyOrder(false) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    load()
    cmsRequest('/media/banner/capabilities').then((capabilities) => setUploadSupported(capabilities.enabled === true)).catch(() => setUploadSupported(false))
  }, [])

  function move(from, to) {
    if (from === to || from < 0 || to >= items.length) return
    const moved = items[from]
    setItems((previous) => shiftItem(previous, from, to))
    setDirtyOrder(true)
    setAnnouncement(`${moved.title} dipindahkan ke posisi ${to + 1}. Simpan urutan untuk menerapkan.`)
  }

  async function saveOrder() {
    setSavingOrder(true); setError('')
    try {
      await cmsRequest('/homepage/heroes/reorder', { method: 'PUT', body: JSON.stringify(items.map(({ id }) => ({ id }))) })
      await load()
      setAnnouncement('Urutan banner berhasil disimpan.')
    } catch (err) { setError(`Urutan gagal disimpan: ${err.message}. Muat ulang halaman untuk melihat urutan dari server.`) }
    finally { setSavingOrder(false) }
  }

  async function remove(item) {
    if (!window.confirm(`Hapus banner “${item.title}”? Tindakan ini tidak dapat dibatalkan.`)) return
    try { await cmsRequest(`/homepage/heroes/${item.id}`, { method: 'DELETE' }); await load() }
    catch (err) { setError(err.message) }
  }

  const filters = ['Semua', 'Aktif', 'Terjadwal', 'Nonaktif', 'Selesai']
  const visible = items.filter((item) => filter === 'Semua' || bannerState(item) === filter)
  if (editor !== undefined) return <BannerEditor key={editor?.id ?? 'new'} item={editor} nextOrder={(items.length + 1) * 10} uploadSupported={uploadSupported} storefrontUrl={storefrontUrl} onSaved={() => { setEditor(undefined); load() }} onCancel={() => setEditor(undefined)} />
  return <div className="admin-page cms-manage-page">
    <header className="cms-page-heading"><div><small>TAMPILAN TOKO</small><h1>Banner</h1><p>Kelola banner yang tampil di halaman utama toko.</p></div><div className="cms-page-actions">{storefrontUrl && <a className="admin-button admin-button--ghost" href={storefrontUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Pratinjau Toko</a>}<button className="admin-button admin-button--primary" onClick={() => { if (dirtyOrder && !window.confirm('Urutan banner belum disimpan. Lanjut tanpa menyimpan?')) return; setEditor(null) }} type="button"><Plus size={17} /> Tambah Banner</button></div></header>
    <div className="cms-filter-tabs" role="group" aria-label="Filter status banner">{filters.map((status) => <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)}>{status} <span>{status === 'Semua' ? items.length : items.filter((item) => bannerState(item) === status).length}</span></button>)}</div>
    {error && <div role="alert" className="admin-error">{error}</div>}
    <div aria-live="polite" className="cms-sr-only">{announcement}</div>
    {loading ? <div className="cms-list-placeholder">Memuat daftar banner…</div> : !visible.length ? <div className="cms-list-placeholder"><ImagePlus size={28} /><strong>{items.length ? 'Tidak ada banner dengan status ini.' : 'Belum ada banner.'}</strong><span>{items.length ? 'Pilih filter lain untuk melihat banner.' : 'Tambahkan banner pertama untuk mulai mengatur tampilan toko.'}</span></div> : <div className="cms-sortable-list">
      {visible.map((item) => {
        const index = items.findIndex((current) => current.id === item.id)
        return <article className="cms-banner-row" key={item.id} draggable={filter === 'Semua'} onDragStart={(event) => { dragged.current = index; event.dataTransfer.effectAllowed = 'move' }} onDragOver={(event) => { if (filter === 'Semua') event.preventDefault() }} onDrop={(event) => { event.preventDefault(); if (dragged.current !== null) move(dragged.current, index); dragged.current = null }} onDragEnd={() => { dragged.current = null }}>
          <div className="cms-sort-controls"><GripVertical size={20} aria-hidden="true" /><div><button type="button" aria-label={`Naikkan ${item.title}`} disabled={filter !== 'Semua' || index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Turunkan ${item.title}`} disabled={filter !== 'Semua' || index === items.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={15} /></button></div></div>
          <BannerPicture src={item.imageUrl} alt={`Gambar banner ${item.title}`} className="cms-banner-thumbnail" onState={(status) => { setBrokenIds((previous) => previous[item.id] === (status === 'error') ? previous : { ...previous, [item.id]: status === 'error' }) }} />
          <div className="cms-banner-row-copy"><div className="cms-banner-row-title"><strong>{item.title}</strong><StatusBadge status={bannerState(item)} />{brokenIds[item.id] && <span className="cms-status cms-status--rusak">Gambar Rusak</span>}</div><p>{item.subtitle}</p><small>Posisi {index + 1} · {item.startsAt ? `Mulai ${new Date(item.startsAt).toLocaleDateString('id-ID')}` : 'Tanpa batas waktu'}{item.endsAt ? ` · Berakhir ${new Date(item.endsAt).toLocaleDateString('id-ID')}` : ''}</small></div>
          <div className="cms-banner-row-actions"><button className="admin-button admin-button--ghost" type="button" onClick={() => { if (dirtyOrder && !window.confirm('Urutan banner belum disimpan. Lanjut tanpa menyimpan?')) return; setEditor(item) }}>Ubah</button><details className="cms-row-menu"><summary aria-label={`Aksi lainnya untuk ${item.title}`}><MoreHorizontal size={20} /></summary><div><button type="button" onClick={() => remove(item)}><Trash2 size={15} /> Hapus banner</button></div></details></div>
        </article>
      })}
    </div>}
    <footer className="cms-sort-footer"><span><GripVertical size={16} /> Seret banner atau gunakan tombol panah untuk mengubah posisi.</span>{dirtyOrder && <button className="admin-button admin-button--primary" disabled={savingOrder} onClick={saveOrder}>{savingOrder ? 'Menyimpan…' : 'Simpan Urutan'}</button>}</footer>
  </div>
}
