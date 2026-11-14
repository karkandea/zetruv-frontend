import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { assets } from '../data/assets'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { NAVBAR_COPY } from '../services/navbarLanguage'
import { submitSupportReport } from '../services/supportService'

const initialForm = { name: '', phone: '', description: '' }

export default function SupportChat({ open: controlledOpen, onOpenChange } = {}) {
  const copy = useStorefrontCopy()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const { help, back } = NAVBAR_COPY[useNavbarLanguage()]
  const launcherRef = useRef(null)

  function setOpen(nextOpen) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

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
      <button className="contact-fab" ref={launcherRef} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <img src={assets.chat} alt="" /> <span>{help}</span>
      </button>
      {open && (
        <div className="chat-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside className="chat-panel" role="dialog" aria-modal="true" aria-labelledby="support-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="chat-panel__top">
              <button type="button" className="icon-button chat-panel__back" aria-label={back} onClick={() => {
                setOpen(false)
                launcherRef.current?.focus()
              }}>
                <ArrowLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" className="icon-button" aria-label={copy.expand}>↗</button>
            </div>
            <form className="support-form" onSubmit={handleSubmit}>
              <h2 id="support-title">{copy.reportAnIssue}</h2>
              <label>{copy.name}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={copy.yourFullName} required /></label>
              <label>{copy.phoneNumber}<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={copy.yourPhoneOrWhatsappNumber} required /></label>
              <label>{copy.describeTheIssue}<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={copy.tellUsWhatHappened} required /></label>
              {status === 'success' && <p className="form-status success">{copy.yourReportWasSaved}</p>}
              {status === 'error' && <p className="form-status error">{copy.couldnTSendTheReport}</p>}
              <button className="support-submit" disabled={status === 'loading'} type="submit">{status === 'loading' ? copy.sending : copy.send}</button>
            </form>
          </aside>
        </div>
      )}
    </>
  )
}
