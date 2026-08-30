import { useState } from 'react'
import { assets } from '../data/assets'
import { submitSupportReport } from '../services/supportService'

const initialForm = { name: '', phone: '', description: '' }

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    try {
      await submitSupportReport(form)
      setStatus('success')
      setForm(initialForm)
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <button className="contact-fab" type="button" onClick={() => setOpen(true)}>
        <img src={assets.chat} alt="" /> Contact our team
      </button>
      {open && (
        <div className="chat-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside className="chat-panel" role="dialog" aria-modal="true" aria-labelledby="support-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="chat-panel__top">
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Back">←</button>
              <button type="button" className="icon-button" aria-label="Expand">↗</button>
            </div>
            <form className="support-form" onSubmit={handleSubmit}>
              <h2 id="support-title">Formulir Laporan</h2>
              <label>Nama<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap anda" required /></label>
              <label>No Telepon<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Nomor Telepon/ Whatsapp Anda" required /></label>
              <label>Deskripsi Masalah<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Berikan penjelasan terhadap kendala yang Anda hadapi" required /></label>
              {status === 'success' && <p className="form-status success">Laporan tersimpan. Backend bisa disambungkan lewat supportService.</p>}
              {status === 'error' && <p className="form-status error">Gagal mengirim laporan.</p>}
              <button className="support-submit" disabled={status === 'loading'} type="submit">{status === 'loading' ? 'Mengirim…' : 'Kirim'}</button>
            </form>
          </aside>
        </div>
      )}
    </>
  )
}
