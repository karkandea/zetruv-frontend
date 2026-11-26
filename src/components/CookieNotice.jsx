import { useEffect, useRef, useState } from 'react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/cookie-notice.css'

const cookieChoiceKey = 'zetruv-cookie-choice-v1'

function hasCookieChoice() {
  try {
    const choice = window.localStorage.getItem(cookieChoiceKey)
    return choice === 'allow-all' || choice === 'decline-all'
  } catch {
    return false
  }
}

export default function CookieNotice() {
  const copy = useStorefrontCopy()
  const [hasChoice, setHasChoice] = useState(hasCookieChoice)
  const noticeRef = useRef(null)
  useEffect(() => {
    const notice = noticeRef.current
    const shell = notice?.parentElement
    if (!notice || !shell) return
    const update = () => shell.style.setProperty('--cookie-notice-height', `${notice.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(notice)
    return () => { observer.disconnect(); shell.style.removeProperty('--cookie-notice-height') }
  }, [hasChoice])

  function saveChoice(choice) {
    try {
      window.localStorage.setItem(cookieChoiceKey, choice)
    } catch {
      // Users can still dismiss the notice while browser storage is unavailable.
    }
    setHasChoice(true)
  }

  if (hasChoice) return null

  return (
    <aside ref={noticeRef} className="cookie-notice" aria-labelledby="cookie-notice-title">
      <div className="cookie-notice__content">
        <h2 id="cookie-notice-title">{copy.cookieNoticeTitle}</h2>
        <p>{copy.cookieNoticeText} <a href="/cookies-policy">{copy.cookiePolicy}</a></p>
      </div>
      <div className="cookie-notice__actions">
        <a href="/cookies-policy#manage-cookies">{copy.cookieSettings}</a>
        <button type="button" onClick={() => saveChoice('allow-all')}>{copy.cookieAllowAll}</button>
        <button type="button" onClick={() => saveChoice('decline-all')}>{copy.cookieDeclineAll}</button>
      </div>
    </aside>
  )
}
