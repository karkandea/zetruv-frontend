import { useId, useLayoutEffect, useRef, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import '../styles/product-order-dock.css'

export default function ProductOrderDock({ title, preview, total, action, message, feedback, children }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const previewId = useId()
  const dockRef = useRef(null)
  const toggleRef = useRef(null)

  useLayoutEffect(() => {
    const dock = dockRef.current
    const page = dock.closest('main')
    const observer = new ResizeObserver(() => {
      // Reserve space for the collapsed bar so the last field can scroll above it.
      const height = dock.offsetHeight
      if (!expanded && height) page.style.setProperty('--product-order-dock-height', `${height}px`)
    })
    observer.observe(dock)
    return () => observer.disconnect()
  }, [expanded])

  function dismissDetails(event) {
    if (event.key !== 'Escape' || !expanded || !toggleRef.current.offsetWidth) return
    setExpanded(false)
    toggleRef.current.focus()
  }

  return (
    <div className="product-order-dock" ref={dockRef} onKeyDown={dismissDetails}>
      <button className="product-order-dock__toggle" type="button" ref={toggleRef}
        aria-label={title} aria-describedby={previewId} aria-controls={detailsId}
        aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <span className="product-order-dock__title">
          {title}<ChevronUp size={18} aria-hidden="true" />
        </span>
        <span className="product-order-dock__preview" id={previewId}>
          {preview.map(({ label, value }) => (
            <span key={label}>
              <span>{label}</span>
              <strong>{value || '—'}</strong>
            </span>
          ))}
        </span>
      </button>
      <div id={detailsId} className={`product-order-dock__details${expanded ? ' is-expanded' : ''}`}>
        {children}
      </div>
      <div className="product-order-dock__footer">
        {total}
        {action}
        {message && <div className="product-order-dock__message">{message}</div>}
      </div>
      {feedback}
    </div>
  )
}
