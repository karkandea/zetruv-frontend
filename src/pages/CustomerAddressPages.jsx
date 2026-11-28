import { useEffect, useState } from 'react'
import { Building2, Check, ChevronRight, House, LocateFixed, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { apiRequest } from '../api/httpClient'
import { AccountShell, PageHeader, useCustomerSession } from './AccountPages'

function useAddressApi() {
  const token = useCustomerSession()?.accessToken
  const auth = { Authorization: 'Bearer ' + token }
  function request(path = '', options = {}) {
    if (!token) return Promise.reject(new Error('Silakan login terlebih dahulu.'))
    return apiRequest('/me/addresses' + path, { cache: 'no-store', ...options,
      headers: { ...auth, ...(options.headers || {}) } })
  }
  return { token, request }
}

const initial = {
  label: 'Rumah', recipientName: '', recipientPhone: '', email: '', province: '',
  city: '', district: '', subdistrict: '', postalCode: '', fullAddress: '',
  note: '', rajaOngkirDeliveryId: 0, latitude: null, longitude: null, isDefault: false
}
const postalValid = value => /^[0-9]{5}$/.test(value)
const phoneValid = value => /^(?:0|62)[0-9]{8,13}$/.test(value)
const addressText = a => [a.fullAddress, a.subdistrict, a.district, a.city, a.province, a.postalCode].filter(Boolean).join(', ')

export function AccountAddressesPage() {
  const { token, request } = useAddressApi()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState('')
  async function load() {
    if (!token) return
    try { const data = await request(); setRows(data.items || []); setError('') }
    catch (e) { setError(e.message || 'Alamat gagal dimuat.') }
  }
  useEffect(() => {
    if (token) void load()
    else setRows(null)
  }, [token])
  async function mutate(id, action) {
    if (action === 'delete' && !window.confirm('Hapus alamat ini dari akun?')) return
    setWorking(id); setError('')
    try {
      await request('/' + encodeURIComponent(id) + (action === 'default' ? '/default' : ''),
        { method: action === 'delete' ? 'DELETE' : 'PUT' })
      await load()
    } catch (e) { setError(e.message || 'Perubahan alamat gagal.') }
    finally { setWorking('') }
  }
  return <AccountShell active="addresses">
    <div className="zetruv-address-header">
      <PageHeader title="Alamat Saya" description="Simpan alamat penerima untuk pembelian merchandise." />
      {rows?.length > 0 && <a className="account-btn account-btn--primary" href="/account/addresses/add"><Plus size={16}/> Tambah alamat</a>}
    </div>
    {!token ? <div className="orders-figma-empty" role="status"><strong>Masuk untuk mengelola alamat</strong><p>Alamat tersimpan hanya dapat diakses oleh pemilik akun.</p><a className="account-btn account-btn--primary" href="/">Kembali ke beranda</a></div>
      : error && rows === null ? <div role="alert" className="zetruv-form-error">{error}<button className="account-btn account-btn--outline" onClick={load}>Coba lagi</button></div>
      : rows === null ? <div className="zetruv-address-loading" role="status">Memuat alamat tersimpan…</div>
      : rows.length === 0 ? <section className="zetruv-address-empty" role="status">
          <img src="/assets/account/address-empty.svg" alt="" width="190" height="158"/>
          <h2>Belum ada alamat tersimpan</h2>
          <p>Tambahkan alamat penerima supaya checkout merchandise lebih praktis.</p>
          <a className="account-btn account-btn--primary" href="/account/addresses/add"><Plus size={17}/> Tambah alamat</a>
        </section>
      : <div className="zetruv-address-list">
          {rows.map(address => <article className="zetruv-address-card" key={address.id}>
            <div className="zetruv-address-card__top">
              <span className="zetruv-address-card__label">{address.label?.toLowerCase() === 'kantor' ? <Building2 size={19}/> : <House size={19}/>}<strong>{address.label}</strong></span>
              {address.isDefault && <span className="zetruv-address-default"><Check size={14}/> Utama</span>}
            </div>
            <p className="zetruv-address-card__recipient">{address.recipientName} · {address.recipientPhone}</p>
            <p className="zetruv-address-card__address">{addressText(address)}</p>
            {address.note && <p className="zetruv-address-card__note">Catatan kurir: {address.note}</p>}
            <div className="zetruv-address-card__actions">
              {!address.isDefault && <button type="button" disabled={working === address.id} onClick={() => mutate(address.id, 'default')}>Jadikan utama</button>}
              {address.isDefault && <span className="zetruv-address-card__primary-text">Alamat pengiriman utama</span>}
              <a href={'/account/addresses/edit?id=' + encodeURIComponent(address.id)}><Pencil size={14}/> Ubah</a>
              <button type="button" className="zetruv-address-card__delete" disabled={working === address.id} onClick={() => mutate(address.id, 'delete')} aria-label={'Hapus alamat ' + address.label}><Trash2 size={15}/></button>
            </div>
          </article>)}
          {error && <p role="alert" className="zetruv-form-error">{error}</p>}
          <a className="zetruv-address-add" href="/account/addresses/add"><Plus size={20}/> Tambah alamat baru <ChevronRight size={16}/></a>
        </div>}
  </AccountShell>
}

function Field({ label, value, onChange, required = true, ...rest }) {
  return <label className="zetruv-address-field"><span>{label} {required && <b>*</b>}</span>
    <input value={value ?? ''} required={required} onChange={e => onChange(e.target.value)} {...rest} />
  </label>
}

export function AccountAddressFormPage({ mode = 'add' }) {
  const { token, request } = useAddressApi()
  const id = new URLSearchParams(window.location.search).get('id')
  const edit = mode === 'edit'
  const [form, setForm] = useState(initial)
  const [keyword, setKeyword] = useState('')
  const [destinations, setDestinations] = useState([])
  const [regionState, setRegionState] = useState('')
  const [loading, setLoading] = useState(edit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [geoStatus, setGeoStatus] = useState('')
  const set = (key, value) => setForm(v => ({ ...v, [key]: value }))
  useEffect(() => {
    if (!edit || !token) { setLoading(false); return }
    let active = true
    request().then(data => {
      const found = data.items?.find(a => a.id === id)
      if (!found) throw Error('Alamat tidak ditemukan.')
      if (active) {
        setForm({ ...initial, ...found, email: found.email || '', note: found.note || '' })
        setKeyword([found.subdistrict, found.district, found.city].filter(Boolean).join(', '))
      }
    }).catch(e => { if (active) setError(e.message || 'Alamat gagal dimuat.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [edit, id, token])
  useEffect(() => {
    if (keyword.trim().length < 3 || form.rajaOngkirDeliveryId) {
      setDestinations([]); setRegionState(''); return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setRegionState('loading')
      request('/delivery-destinations?keyword=' + encodeURIComponent(keyword.trim()), { signal: controller.signal })
        .then(data => {
          if (!controller.signal.aborted) { setDestinations(data.items || []); setRegionState('ready') }
        }).catch(e => {
          if (!controller.signal.aborted) setRegionState(e.status === 503 ? 'not-configured' : 'error')
        })
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [keyword, form.rajaOngkirDeliveryId, token])
  function pick(item) {
    setForm(v => ({ ...v, rajaOngkirDeliveryId: item.id,
      province: item.provinceName || v.province,
      city: item.cityName || '', district: item.districtName || '',
      subdistrict: item.subdistrictName || '',
      postalCode: postalValid(String(item.zipCode || '')) ? String(item.zipCode) : '' }))
    setKeyword(item.label || '')
    setDestinations([])
    setRegionState('')
  }
  function useCurrentLocation() {
    if (!navigator.geolocation) { setGeoStatus('Lokasi perangkat tidak didukung.'); return }
    setGeoStatus('Meminta izin lokasi…')
    navigator.geolocation.getCurrentPosition(
      pos => { setForm(v => ({ ...v, latitude: Number(pos.coords.latitude.toFixed(7)), longitude: Number(pos.coords.longitude.toFixed(7)) })); setGeoStatus('Titik lokasi ditambahkan. Pastikan sesuai alamat penerima.') },
      () => setGeoStatus('Izin lokasi tidak tersedia. Anda tetap bisa menyimpan alamat reguler.'),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 })
  }
  async function submit(e) {
    e.preventDefault(); setError('')
    if (!form.rajaOngkirDeliveryId) { setError('Pilih wilayah dari hasil pencarian RajaOngkir Shipping Delivery.'); return }
    if (!postalValid(form.postalCode)) { setError('Kode pos harus 5 angka yang valid.'); return }
    if (!phoneValid(form.recipientPhone)) { setError('Nomor HP harus diawali 08 atau 62.'); return }
    setSaving(true)
    try {
      const body = { ...form, email: form.email || null, note: form.note || null }
      delete body.id; delete body.customerUserId; delete body.createdAt; delete body.updatedAt
      await request(edit ? '/' + encodeURIComponent(id) : '', {
        method: edit ? 'PUT' : 'POST', body: JSON.stringify(body)
      })
      window.location.href = '/account/addresses'
    } catch (e) { setError(e.message || 'Alamat gagal disimpan. Silakan coba lagi.') }
    finally { setSaving(false) }
  }
  return <AccountShell active="addresses">
    <PageHeader title={edit ? 'Ubah alamat' : 'Tambah alamat'} description="Pilih wilayah terverifikasi, lalu lengkapi detail pengiriman." />
    {!token ? <p role="alert">Silakan masuk untuk menyimpan alamat.</p> : loading ? <div role="status">Memuat alamat…</div> :
      <form className="zetruv-address-form" onSubmit={submit}>
        <div className="zetruv-address-form__grid">
          <label className="zetruv-address-field"><span>Label alamat <b>*</b></span>
            <select value={form.label} onChange={e => set('label', e.target.value)} required>
              <option value="Rumah">Rumah</option><option value="Kantor">Kantor</option><option value="Lainnya">Lainnya</option>
            </select>
          </label>
          <Field label="Nama penerima" value={form.recipientName} maxLength={120} onChange={v => set('recipientName', v)} autoComplete="name" />
          <Field label="Nomor HP penerima" value={form.recipientPhone} maxLength={24} inputMode="tel" placeholder="081234567890" onChange={v => set('recipientPhone', v)} />
          <Field label="Email penerima (opsional)" value={form.email} required={false} type="email" maxLength={320} onChange={v => set('email', v)} />
        </div>
        <div className="zetruv-address-destination">
          <label className="zetruv-address-field"><span>Cari kelurahan, kecamatan atau kode pos <b>*</b></span>
            <input value={keyword} onChange={e => { setKeyword(e.target.value); set('rajaOngkirDeliveryId', 0) }} placeholder="Kelurahan atau kode pos" aria-describedby="region-help" autoComplete="off" />
          </label>
          <p id="region-help">Pilih hasil RajaOngkir Shipping Delivery, bukan ID dari kalkulator ongkir.</p>
          {regionState === 'loading' && <small role="status">Mencari wilayah…</small>}
          {regionState === 'not-configured' && <p role="alert">Pencarian lokasi belum dikonfigurasi oleh admin Zetruv. Penyimpanan alamat memerlukan wilayah terverifikasi.</p>}
          {regionState === 'error' && <p role="alert">Pencarian wilayah gagal. Coba lagi.</p>}
          {regionState === 'ready' && !destinations.length && <p>Wilayah tidak ditemukan. Coba nama kecamatan atau kode pos.</p>}
          {destinations.length > 0 && <ul className="zetruv-address-suggestions" aria-label="Pilihan wilayah">
            {destinations.map(item => <li key={item.id}><button type="button" onClick={() => pick(item)}><MapPin size={16}/><span>{item.label}</span></button></li>)}
          </ul>}
          {form.rajaOngkirDeliveryId > 0 && <p className="zetruv-address-selected"><Check size={15}/> Wilayah terverifikasi (ID Delivery: {form.rajaOngkirDeliveryId})</p>}
        </div>
        <div className="zetruv-address-form__grid">
          <Field label="Provinsi" value={form.province} maxLength={120} onChange={v => set('province', v)} />
          <Field label="Kota / Kabupaten" value={form.city} maxLength={120} onChange={v => set('city', v)} readOnly />
          <Field label="Kecamatan" value={form.district} maxLength={120} onChange={v => set('district', v)} readOnly />
          <Field label="Kelurahan / Desa" value={form.subdistrict} maxLength={120} onChange={v => set('subdistrict', v)} readOnly />
          <Field label="Kode pos" value={form.postalCode} maxLength={5} inputMode="numeric" placeholder="5 digit" onChange={v => set('postalCode', v.replace(/\D/g, '').slice(0, 5))} />
        </div>
        <label className="zetruv-address-field"><span>Alamat lengkap <b>*</b></span><textarea rows={3} required maxLength={500} placeholder="Nama jalan, nomor bangunan, RT/RW, lantai" value={form.fullAddress} onChange={e => set('fullAddress', e.target.value)} /></label>
        <label className="zetruv-address-field"><span>Patokan / catatan kurir (opsional)</span><textarea rows={2} maxLength={250} placeholder="Patokan lokasi rumah" value={form.note} onChange={e => set('note', e.target.value)} /></label>
        <section className="zetruv-address-pinpoint"><div><LocateFixed size={22}/><span><strong>Titik lokasi (opsional)</strong><small>Direkomendasikan untuk kurir instan. Periksa ketepatan lokasi setelah memberi izin.</small></span></div>
          <button type="button" className="account-btn account-btn--outline" onClick={useCurrentLocation}>Gunakan lokasi saat ini</button>
          {geoStatus && <p role="status">{geoStatus}</p>}
          {form.latitude !== null && form.longitude !== null && <small>Lat {form.latitude}, Long {form.longitude}</small>}
        </section>
        <label className="zetruv-address-checkbox"><input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} /> Jadikan alamat utama</label>
        {error && <p role="alert" className="zetruv-form-error">{error}</p>}
        <div className="zetruv-form-actions"><a href="/account/addresses" className="account-btn account-btn--outline">Batal</a>
          <button className="account-btn account-btn--primary" type="submit" disabled={saving || !form.rajaOngkirDeliveryId}>{saving ? 'Menyimpan…' : 'Simpan alamat'}</button>
        </div>
      </form>}
  </AccountShell>
}
