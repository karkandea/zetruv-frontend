import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, GripVertical, MoreHorizontal, Plus } from 'lucide-react'
import { cmsRequest } from './api'
import { ACCOUNT_ATTRIBUTE_TYPES, accountDefinitionPayload, accountListingPayload, attributeKeyFromLabel, isChoiceType } from './gameAccountValues'

const TYPE_LABELS = { Text: 'Teks', Number: 'Angka', Boolean: 'Ya / Tidak', Select: 'Pilihan Tunggal', MultiSelect: 'Pilihan Ganda' }

const blankDefinition = {
  key: '', label: '', type: 'Text', optionsText: '', isRequired: false,
  isActive: true, showOnCard: false, sortOrder: 0,
}
const schemaPath = (gameId) => `/catalog/games/${gameId}/account-attributes`
const detailPath = (productId) => `/catalog/products/${productId}/game-account-details`

function DefinitionForm({ item, onSave, onCancel, busy, usedKeys = [] }) {
  const [form, setForm] = useState(() => item
    ? { ...item, optionsText: (item.options || []).join('\n') }
    : blankDefinition)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const choice = isChoiceType(form.type)
  const dirty = Boolean(item) ? form.label !== item.label || form.type !== item.type || form.isRequired !== item.isRequired || form.showOnCard !== item.showOnCard || form.isActive !== item.isActive || form.optionsText !== (item.options || []).join('\n') : Boolean(form.label)
  function close() { if (!dirty || window.confirm('Perubahan informasi akun belum disimpan. Batalkan?')) onCancel() }
  return <form className="catalog-info-form" onSubmit={(event) => {
    event.preventDefault()
    onSave(accountDefinitionPayload({ ...form, key: item?.key || attributeKeyFromLabel(form.label, usedKeys) }))
  }}>
    <label className="admin-field"><span>Nama Informasi</span><input value={form.label}
      onChange={(event) => set('label', event.target.value)} maxLength={100} required
      placeholder="Contoh: Jumlah Skin" /></label>
    <label className="admin-field"><span>Jenis Isian</span><select value={form.type}
      onChange={(event) => set('type', event.target.value)}>
      {ACCOUNT_ATTRIBUTE_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
    </select><small>{item ? 'Jenis isian akan ditolak sistem jika sudah ada data akun yang menggunakan informasi ini.' : 'Pilih jenis data yang akan diisi admin saat menambahkan akun.'}</small></label>
    {choice && <label className="admin-field admin-field--wide"><span>Daftar Pilihan</span>
      <textarea rows={3} value={form.optionsText} onChange={(event) => set('optionsText', event.target.value)}
        placeholder="Satu pilihan per baris, contoh: Mythic, Legend" required />
      <small>Maksimal 20 pilihan. Pilihan yang sudah dipakai akun lama tidak boleh dihapus.</small>
    </label>}
    <label className="admin-toggle"><input type="checkbox" checked={form.isRequired}
      onChange={(event) => set('isRequired', event.target.checked)} /><span /><b>Wajib diisi saat menambahkan akun</b></label>
    <label className="admin-toggle"><input type="checkbox" checked={form.showOnCard}
      onChange={(event) => set('showOnCard', event.target.checked)} /><span /><b>Tampilkan di kartu produk</b></label>
    <label className="admin-toggle"><input type="checkbox" checked={form.isActive}
      onChange={(event) => set('isActive', event.target.checked)} /><span /><b>Informasi Aktif</b></label>
    <div className="catalog-editor-footer"><button className="admin-button admin-button--ghost"
      type="button" onClick={close}>Batal</button>
      <button className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Informasi'}</button></div>
  </form>
}

export function GameAccountSchemaEditor({ game, onBack }) {
  const [definitions, setDefinitions] = useState([])
  const [savedOrder, setSavedOrder] = useState([])
  const [editing, setEditing] = useState(undefined)
  const [dragIndex, setDragIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function load() {
    setLoading(true)
    try {
      const entries = await cmsRequest(schemaPath(game.id))
      setDefinitions(entries)
      setSavedOrder(entries.map((entry) => entry.id))
      setError('')
    }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [game.id])
  async function save(payload) {
    if (orderChanged) { setError('Simpan perubahan urutan terlebih dahulu sebelum mengubah informasi.'); return }
    setError(''); setNotice(''); setBusy(true)
    try {
      await cmsRequest(editing?.id ? `${schemaPath(game.id)}/${editing.id}` : schemaPath(game.id), {
        method: editing?.id ? 'PUT' : 'POST', body: JSON.stringify(payload),
      })
      setEditing(undefined); await load()
      setNotice('Informasi akun berhasil disimpan. Data akun yang sudah ada tetap tersimpan.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  async function deactivate(item) {
    if (orderChanged) { setError('Simpan perubahan urutan terlebih dahulu sebelum menonaktifkan informasi.'); return }
    if (!window.confirm(`Nonaktifkan ${item.label}? Informasi tidak lagi ditampilkan, tetapi data akun lama tetap tersimpan.`)) return
    setError(''); setNotice('')
    try {
      await cmsRequest(`${schemaPath(game.id)}/${item.id}`, { method: 'DELETE' })
      await load()
      setNotice('Informasi berhasil dinonaktifkan. Data akun lama tetap tersimpan.')
    } catch (err) { setError(err.message) }
  }
  const orderChanged = definitions.map((item) => item.id).join('|') !== savedOrder.join('|')
  useEffect(() => {
    if (!orderChanged) return undefined
    const beforeUnload = (event) => event.preventDefault()
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [orderChanged])
  function back() {
    if ((orderChanged || editing !== undefined) && !window.confirm('Ada perubahan yang belum disimpan. Kembali ke Katalog?')) return
    onBack?.()
  }
  function move(from, to) {
    if (to < 0 || to >= definitions.length || from === to) return
    setDefinitions((previous) => {
      const list = [...previous]
      const [entry] = list.splice(from, 1)
      list.splice(to, 0, entry)
      return list
    })
  }
  async function saveOrder() {
    setBusy(true); setError(''); setNotice('')
    try {
      await cmsRequest(`${schemaPath(game.id)}/reorder`, {
        method: 'PUT', body: JSON.stringify(definitions.map((item) => ({ id: item.id }))),
      })
      setSavedOrder(definitions.map((item) => item.id))
      setNotice('Urutan informasi akun berhasil disimpan.')
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <div className="catalog-account-page">
    <button type="button" className="catalog-back" onClick={back}><ArrowLeft size={17} /> Kembali ke Game</button>
    <header className="catalog-account-heading"><div><h1>Informasi Akun Game</h1><p>{game.name}</p></div>
      <button className="admin-button admin-button--primary" type="button" disabled={definitions.length >= 30 || loading}
        onClick={() => { if (orderChanged) { setError('Simpan perubahan urutan terlebih dahulu sebelum menambah informasi.'); return }; setEditing(null) }}><Plus size={16} /> Tambah Informasi</button></header>
    <div className="admin-account-guidance">Informasi ini digunakan saat admin memasukkan akun game yang dijual, <strong>bukan informasi yang diisi pembeli saat checkout.</strong></div>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {notice && <div className="admin-account-saved" role="status">{notice}</div>}
    <section className="catalog-account-list"><div className="catalog-account-list-heading"><h2>Daftar Informasi</h2><span>{definitions.length} dari 30 digunakan</span></div>
      <p className="catalog-muted">Seret untuk mengurutkan, atau gunakan tombol panah di setiap baris.</p>
      {loading ? <div className="admin-loading">Memuat informasi akun…</div> : definitions.length === 0
        ? <div className="admin-empty">Belum ada informasi. Tambahkan Rank, Jumlah Skin, atau Region untuk mulai.</div>
        : definitions.map((item, index) => <article className="catalog-account-row" key={item.id} draggable onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => event.preventDefault()} onDragEnd={() => setDragIndex(null)}
          onDrop={(event) => { event.preventDefault(); if (dragIndex !== null) move(dragIndex, index); setDragIndex(null) }}>
          <GripVertical className="catalog-drag-handle" size={19} aria-hidden="true" />
          <div className="catalog-account-move"><button type="button" aria-label={`Naikkan ${item.label}`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp size={14} /></button><button type="button" aria-label={`Turunkan ${item.label}`} disabled={index === definitions.length - 1} onClick={() => move(index, index + 1)}><ArrowDown size={14} /></button></div>
          <div className="catalog-account-row-info"><strong>{item.label} {item.isRequired && <small aria-label="Wajib">*</small>}</strong><p>Jenis isian: {TYPE_LABELS[item.type] || item.type}{item.showOnCard && ' · Ditampilkan di kartu produk'}</p></div>
          <span className={`catalog-state ${item.isActive ? 'is-active' : 'is-inactive'}`}>{item.isActive ? 'Aktif' : 'Nonaktif'}</span>
          <button className="admin-button admin-button--ghost" type="button" onClick={() => { if (orderChanged) { setError('Simpan perubahan urutan terlebih dahulu sebelum mengubah informasi.'); return }; setEditing(item) }}>Ubah</button>
          <details className="catalog-more"><summary aria-label={`Opsi ${item.label}`}><MoreHorizontal size={19} /></summary><div>{item.isActive && <button type="button" onClick={() => deactivate(item)}>Nonaktifkan</button>}</div></details>
        </article>)}
      {orderChanged && <div className="catalog-order-actions"><span>Urutan diubah dan belum disimpan.</span><button type="button" className="admin-button admin-button--primary" disabled={busy} onClick={saveOrder}>{busy ? 'Menyimpan…' : 'Simpan Urutan'}</button></div>}
    </section>
    {editing !== undefined && <div className="catalog-info-overlay" role="presentation"><div className="catalog-info-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Ubah Informasi Akun' : 'Tambah Informasi Akun'}>
      <h2>{editing ? 'Ubah Informasi Akun' : 'Tambah Informasi Akun'}</h2>
      <DefinitionForm key={editing?.id || 'new'} item={editing} onSave={save} busy={busy}
        usedKeys={definitions.map((item) => item.key)} onCancel={() => { setEditing(undefined); setError('') }} />
    </div></div>}
  </div>
}

function AccountValueField({ field, value, onChange }) {
  const help = `${TYPE_LABELS[field.type] || field.type}${field.isRequired ? ' · Wajib' : ' · Opsional'}${field.showOnCard ? ' · Tampil di kartu produk' : ''}`
  return <div className="admin-account-value"><strong>{field.label}{field.isRequired && ' *'}</strong>
    <small>{help}</small>
    {field.type === 'Text' && <input type="text" maxLength={250} value={value ?? ''}
      onChange={(event) => onChange(event.target.value)} required={field.isRequired} />}
    {field.type === 'Number' && <input type="number" min="0" max="999999999.99" step="0.01"
      value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={field.isRequired} />}
    {field.type === 'Boolean' && <select value={value === true ? 'true' : value === false ? 'false' : ''}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')}
      required={field.isRequired}><option value="">Belum diisi</option>
      <option value="true">Ya</option><option value="false">Tidak</option></select>}
    {field.type === 'Select' && <select value={value ?? ''} required={field.isRequired}
      onChange={(event) => onChange(event.target.value)}>
      <option value="">Pilih salah satu</option>
      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>}
    {field.type === 'MultiSelect' && <div className="admin-account-multiselect">
      {field.options.map((option) => <label key={option}><input type="checkbox"
        checked={Array.isArray(value) && value.includes(option)}
        onChange={(event) => onChange(event.target.checked
          ? [...(Array.isArray(value) ? value : []), option]
          : (Array.isArray(value) ? value : []).filter((choice) => choice !== option))} />{option}</label>)}
    </div>}
  </div>
}

export function GameAccountListingEditor({ productId }) {
  const [editor, setEditor] = useState(null)
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function load() {
    setLoading(true)
    try {
      const result = await cmsRequest(detailPath(productId))
      setEditor(result)
      setValues(result.values || {})
      setError('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [productId])
  async function save(event) {
    event.preventDefault()
    setError(''); setNotice(''); setBusy(true)
    try {
      const payload = accountListingPayload(editor.schema, values)
      await cmsRequest(detailPath(productId), { method: 'PUT', body: JSON.stringify(payload) })
      await load()
      setNotice('Informasi akun berhasil disimpan.')
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  const active = editor?.schema?.filter((field) => field.isActive) || []
  const archived = editor?.schema?.filter((field) => !field.isActive) || []
  return <section className="admin-panel admin-account-schema"><header><div>
    <h2>Informasi Akun Game</h2><p>Informasi khusus akun ini. Atur daftar informasinya melalui Katalog → Game.</p>
  </div></header>
    {loading && <div className="admin-loading">Memuat informasi akun…</div>}
    {error && <div className="admin-error" role="alert">{error}</div>}
    {notice && <div className="admin-account-saved" role="status">{notice}</div>}
    {!loading && editor?.isLegacyUnlinked && <div className="admin-account-guidance">
      Akun lama ini belum terhubung ke game. Data lama masih bisa dibaca, tetapi belum bisa diubah.
      Buat produk yang terhubung ke game untuk mengatur informasi akun.</div>}
    {!loading && !editor?.isLegacyUnlinked && editor && <>
      {active.length === 0 ? <div className="admin-account-guidance">
        Belum ada informasi aktif untuk game ini. Buka Katalog → Game → Informasi Akun terlebih dahulu.</div>
      : <form className="admin-form-grid" onSubmit={save}>
        {active.map((field) => <AccountValueField key={field.id} field={field}
          value={values[field.key]}
          onChange={(value) => setValues((old) => ({ ...old, [field.key]: value }))} />)}
        <div className="admin-form-actions"><button className="admin-button admin-button--ghost"
          type="button" onClick={load} disabled={busy}>Batalkan Perubahan</button>
          <button className="admin-button admin-button--primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan Informasi Akun'}</button></div>
      </form>}
      {archived.length > 0 && <div className="admin-account-guidance">
        {archived.length} informasi nonaktif disembunyikan dari toko; data yang tersimpan tetap aman.
        Aktifkan kembali melalui Katalog → Game bila diperlukan.</div>}
    </>}
  </section>
}
