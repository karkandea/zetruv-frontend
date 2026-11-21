import { useId, useLayoutEffect, useRef, useState } from 'react'
import { ChevronUp, Minus, Plus } from 'lucide-react'
import '../styles/product-order-dock.css'

export default function ProductOrderDock({ title, preview, quantityControl, total, action, message, feedback, children }) {
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const previewId = useId()
  const detailsRef = useRef(null)
  const dockRef = useRef(null)
  const toggleRef = useRef(null)

  useLayoutEffect(() => {
    const dock = dockRef.current
    const details = detailsRef.current
    const page = dock.closest('main')
    const observer = new ResizeObserver(() => {
      // Reserve space for the collapsed bar even during the transition.
      const height = dock.offsetHeight - details.offsetHeight
      if (height > 0) page.style.setProperty('--product-order-dock-height', `${height}px`)
    })
    observer.observe(dock)
    observer.observe(details)
    return () => {
      observer.disconnect()
      page.style.removeProperty('--product-order-dock-height')
    }
  }, [])

  useLayoutEffect(() => {
    const details = detailsRef.current
    const mobile = window.matchMedia('(max-width: 700px)')
    const syncDetails = () => { details.inert = mobile.matches && !expanded }
    syncDetails()
    mobile.addEventListener('change', syncDetails)
    return () => mobile.removeEventListener('change', syncDetails)
  }, [expanded])

  useLayoutEffect(() => {
    const dock = dockRef.current
    const viewport = window.visualViewport
    if (!viewport || !expanded) return

    function syncViewport() {
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      if (bottom > 0 && viewport.scale === 1 && dock.contains(document.activeElement)) {
        dock.style.setProperty('--product-order-dock-bottom', `${bottom}px`)
        dock.style.setProperty('--product-order-dock-viewport-height', `${viewport.height}px`)
      } else {
        dock.style.removeProperty('--product-order-dock-bottom')
        dock.style.removeProperty('--product-order-dock-viewport-height')
      }
    }

    viewport.addEventListener('resize', syncViewport)
    viewport.addEventListener('scroll', syncViewport)
    syncViewport()
    return () => {
      viewport.removeEventListener('resize', syncViewport)
      viewport.removeEventListener('scroll', syncViewport)
      dock.style.removeProperty('--product-order-dock-bottom')
      dock.style.removeProperty('--product-order-dock-viewport-height')
    }
  }, [expanded])

  function dismissDetails(event) {
    if (event.key !== 'Escape' || !expanded || !toggleRef.current.offsetWidth) return
    setExpanded(false)
    toggleRef.current.focus()
  }

  return (
    <div className="product-order-dock" ref={dockRef} onKeyDown={dismissDetails}>
      {quantityControl ? (
        <div className="product-order-dock__mobile-topline">
          <button className="product-order-dock__toggle product-order-dock__toggle--product" type="button" ref={toggleRef}
            aria-label={title} aria-describedby={previewId} aria-controls={detailsId}
            aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
            <span className="product-order-dock__preview" id={previewId}>
              {preview.slice(0, 1).map(({ label, value }) => (
                <span key={label}><span>{label}</span><strong>{value ?? '—'}</strong></span>
              ))}
            </span>
          </button>
          <div className="product-order-dock__inline-quantity" role="group" aria-label={quantityControl.label}>
            <span className="product-order-dock__inline-quantity-label">{quantityControl.label}</span>
            <div className="product-order-dock__inline-stepper">
              <button type="button" aria-label={quantityControl.decreaseLabel}
                disabled={quantityControl.value <= quantityControl.min}
                onClick={quantityControl.onDecrease}><Minus size={14} aria-hidden="true" /></button>
              <output aria-label={quantityControl.label}>{quantityControl.value}</output>
              <button type="button" aria-label={quantityControl.increaseLabel}
                disabled={quantityControl.value >= quantityControl.max}
                onClick={quantityControl.onIncrease}><Plus size={14} aria-hidden="true" /></button>
            </div>
          </div>
          <button className="product-order-dock__toggle-chevron" type="button"
            aria-label={title} aria-controls={detailsId} aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}>
            <ChevronUp size={18} aria-hidden="true" className="product-order-dock__chevron" />
          </button>
        </div>
      ) : (
        <button className="product-order-dock__toggle" type="button" ref={toggleRef}
          aria-label={title} aria-describedby={previewId} aria-controls={detailsId}
          aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
          <span className="product-order-dock__preview" id={previewId}>
            {preview.map(({ label, value }) => (
              <span key={label}>
                <span>{label}</span>
                <strong>{value ?? '—'}</strong>
              </span>
            ))}
          </span>
          <ChevronUp size={18} aria-hidden="true" className="product-order-dock__chevron" />
        </button>
      )}
      <div id={detailsId} ref={detailsRef} className={`product-order-dock__details${expanded ? ' is-expanded' : ''}`}>
        <div className="product-order-dock__details-body">{children}</div>
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
