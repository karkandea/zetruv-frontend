import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ImageOff, UploadCloud } from 'lucide-react'
import { cmsRequest } from './api'

const MAX_BYTES = 3 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function discardCatalogAssets(assets, keepUrl = '') {
  await Promise.allSettled(assets.filter((item) => item.url !== keepUrl)
    .map((item) => cmsRequest(`/media/${item.id}`, { method: 'DELETE' })))
}

export default function CatalogImageField({ title, value, onChange, onUploaded, onValidityChange, compact = false, uploadPath = '/media/catalog' }) {
  const fileRef = useRef(null)
  const [supported, setSupported] = useState(false)
  const [checking, setChecking] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    let current = true
    cmsRequest('/media/catalog/capabilities').then((result) => {
      if (current) setSupported(Boolean(result?.enabled))
    }).catch(() => { if (current) setSupported(false) })
      .finally(() => { if (current) setChecking(false) })
    return () => { current = false }
  }, [])
  useEffect(() => { setImageFailed(false); onValidityChange?.(!value) }, [value])

  async function upload(file) {
    if (!file || uploading || !supported) return
    setError('')
    if (!TYPES.includes(file.type)) { setError('Gunakan gambar JPG, PNG, atau WebP.'); return }
    if (file.size > MAX_BYTES) { setError('Gambar terlalu besar. Maksimal 3 MB. Pilih gambar lain.'); return }
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const asset = await cmsRequest(uploadPath, { method: 'POST', body })
      onUploaded?.(asset)
      onChange(asset.url)
      setDetail(`Berhasil diunggah · ${(asset.sizeBytes / 1024).toFixed(0)} KB setelah optimasi`)
    } catch (cause) { setError(cause.message || 'Gambar gagal diunggah. Coba lagi.') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return <div className={`catalog-image-field${compact ? ' catalog-image-field--compact' : ''}`}>
    <h3>{title}</h3>
    {value && !imageFailed && <div className="catalog-image-preview"><img src={value} alt={title} onLoad={() => onValidityChange?.(true)} onError={() => { setImageFailed(true); onValidityChange?.(false) }} /></div>}
    {value && imageFailed && <p className="catalog-inline-error"><ImageOff size={16} /> Gambar tidak dapat dimuat. Unggah gambar pengganti.</p>}
    {checking ? <p className="catalog-muted">Memeriksa penyimpanan gambar…</p> : supported
      ? <div className="catalog-image-drop" onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files?.[0]) }}>
        <UploadCloud size={24} /><span>{uploading ? 'Mengunggah dan mengoptimasi…' : 'Pilih atau seret gambar ke sini'}</span>
        <small>JPG, PNG, WebP · Maksimal 3 MB</small>
        <button type="button" className="admin-button admin-button--ghost" disabled={uploading} onClick={() => fileRef.current?.click()}>{value ? 'Ganti Gambar' : 'Pilih Gambar'}</button>
        <input ref={fileRef} type="file" accept={TYPES.join(',')} hidden onChange={(event) => upload(event.target.files?.[0])} />
      </div> : <div className="catalog-image-unavailable"><AlertCircle size={17} /> Unggah gambar belum tersedia di backend. Gambar lama tetap disimpan.</div>}
    {error && <p role="alert" className="catalog-inline-error"><AlertCircle size={15} /> {error}</p>}
    {detail && <p role="status" className="catalog-inline-success"><CheckCircle2 size={15} /> {detail}</p>}
  </div>
}
