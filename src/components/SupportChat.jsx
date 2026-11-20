import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { assets } from '../data/assets'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { NAVBAR_COPY } from '../services/navbarLanguage'
import { submitSupportReport } from '../services/supportService'
import '../styles/support-chat.css'

const initialForm = { name: '', phone: '', description: '' }

export default function SupportChat({ open: controlledOpen, onOpenChange } = {}) {
  const copy = useStorefrontCopy()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const { help, back } = NAVBAR_COPY[useNavbarLanguage()]
  const dialogRef = useRef(null)
  const requestId = useRef(null)
  const submitting = useRef(false)
  const busy = status === 'loading'

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function setOpen(nextOpen) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
    setStatus('idle')
    requestId.current = null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) return
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
    }
    const digits = payload.phone.replace(/\D/g, '').length
    if (!payload.name || !payload.description || !/^\+?[0-9 ().-]+$/.test(payload.phone) || digits < 8 || digits > 15) {
      setStatus('invalid')
      return
    }

    submitting.current = true
    setStatus('loading')
    try {
      requestId.current ??= crypto.randomUUID()
      await submitSupportReport({ ...payload, requestId: requestId.current })
      requestId.current = null
      setStatus('success')
      setForm(initialForm)
    } catch (error) {
      setStatus(error.status === 429 ? 'limited' : error.status === 400 ? 'invalid' : 'error')
    } finally {
      submitting.current = false
    }
  }

  return (
    <>
      <button className="contact-fab" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <img src={assets.chat} alt="" /> <span>{help}</span>
      </button>
      <dialog
        ref={dialogRef}
        className="chat-panel"
        aria-labelledby="support-title"
        onCancel={(event) => {
          event.preventDefault()
          setOpen(false)
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}
      >
        <header className="chat-panel__top">
          <button type="button" className="chat-panel__back" aria-label={back} onClick={() => setOpen(false)}>
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <h2 id="support-title">{copy.reportAnIssue}</h2>
        </header>
        <form className="support-form" onSubmit={handleSubmit} aria-busy={busy}>
          <div className="support-form__identity">
            <label htmlFor="support-name">{copy.name}
              <input id="support-name" autoComplete="name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder={copy.yourFullName} maxLength={120} disabled={busy} required />
            </label>
            <label htmlFor="support-phone">{copy.phoneNumber}
              <span className="support-form__phone">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.76.96-.94 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.19.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35M12.07 21.7a9.7 9.7 0 0 1-4.92-1.34l-.35-.21-3.65.96.98-3.56-.23-.37a9.7 9.7 0 1 1 8.17 4.52M20.31 3.7A11.65 11.65 0 0 0 2.02 17.72L.36 23.78l6.2-1.62a11.65 11.65 0 0 0 13.75-18.46" />
                </svg>
                <input id="support-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+62 8xx xxxx xxxx" maxLength={40} disabled={busy} required />
              </span>
            </label>
          </div>
          <label htmlFor="support-description">{copy.describeTheIssue}
            <textarea id="support-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder={copy.tellUsWhatHappened} maxLength={2000} disabled={busy} required />
          </label>
          {status === 'success' && <p className="form-status success" role="status">{copy.yourReportWasSaved}</p>}
          {status === 'error' && <p className="form-status error" role="alert">{copy.couldnTSendTheReport}</p>}
          {status === 'invalid' && <p className="form-status error" role="alert">{copy.checkSupportReportFields}</p>}
          {status === 'limited' && <p className="form-status error" role="alert">{copy.tooManyAttemptsTryAgainInA}</p>}
          <button className="support-submit" disabled={busy} type="submit">{busy ? copy.sending : copy.send}</button>
        </form>
      </dialog>
    </>
  )
}
