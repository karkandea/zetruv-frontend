import { useState } from 'react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/cookie-notice.css'

const noticeKey = 'zetruv-cookie-notice-v1'

function hasDismissedNotice() {
  try {
    return window.localStorage.getItem(noticeKey) === 'dismissed'
  } catch {
    return false
  }
}

export default function CookieNotice() {
  const copy = useStorefrontCopy()
  const [dismissed, setDismissed] = useState(hasDismissedNotice)

  function dismissNotice() {
    try {
      window.localStorage.setItem(noticeKey, 'dismissed')
    } catch {
      // Users can still dismiss the notice while browser storage is unavailable.
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <aside className="cookie-notice" aria-labelledby="cookie-notice-title">
      <div className="cookie-notice__content">
        <h2 id="cookie-notice-title">{copy.cookieNoticeTitle}</h2>
        <p>{copy.cookieNoticeText}</p>
      </div>
      <div className="cookie-notice__actions">
        <a href="/cookies-policy">{copy.cookiePolicy}</a>
        <button type="button" onClick={dismissNotice}>{copy.cookieNoticeDismiss}</button>
      </div>
    </aside>
  )
}
