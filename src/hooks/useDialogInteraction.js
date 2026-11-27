import { useLayoutEffect, useRef } from 'react'

// Keep keyboard focus inside a mounted modal, then restore the opener.
export function useDialogInteraction(dialogRef, onClose) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')).filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
    const focusFirst = () => (dialog.querySelector('[data-initial-focus]') || focusable()[0] || dialog).focus({preventScroll:true})
    focusFirst()
    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) { event.preventDefault(); dialog.focus(); return }
      const current = document.activeElement
      if (!items.includes(current) || (event.shiftKey && current === items[0]) || (!event.shiftKey && current === items[items.length - 1])) {
        event.preventDefault()
        ;(event.shiftKey ? items[items.length - 1] : items[0]).focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({preventScroll:true})
    }
  }, [dialogRef])
}
