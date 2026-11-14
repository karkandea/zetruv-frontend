import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function HelpCenterDialog({ labels, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return (
    <dialog ref={dialogRef} className="nav-help-dialog" aria-labelledby="nav-help-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="nav-help-dialog__body">
        <button type="button" className="icon-button chat-panel__back" aria-label={labels.back} onClick={onClose}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h2 id="nav-help-title">{labels.helpCenter}</h2>
        <p>{labels.helpOrderHint}</p>
        <a className="account-btn account-btn--primary" href="/order-status">{labels.trackOrder}</a>
      </div>
    </dialog>
  )
}
