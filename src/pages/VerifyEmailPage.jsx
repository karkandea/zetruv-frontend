import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, LoaderCircle, MailCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import { apiRequest } from '../api/httpClient'
import { activateCustomerCart, setCustomerSession } from '../services/customerCartSync'
import { clearPendingRegistration, readPendingRegistration, validCustomerEmail } from '../services/registrationVerification'

export default function VerifyEmailPage() {
  const copy = useStorefrontCopy()
  const tokenRef = useRef(new URLSearchParams(window.location.search).get('token') || '')
  const started = useRef(false)
  const [status, setStatus] = useState(tokenRef.current ? 'verifying' : 'invalid')
  const verifyingLink = useRef(Boolean(tokenRef.current))
  const [message, setMessage] = useState(tokenRef.current ? '' : 'thisVerificationLinkIsIncompleteRequestA')
  const [email, setEmail] = useState(() => readPendingRegistration()?.email || '')
  const [resendBusy, setResendBusy] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [resendError, setResendError] = useState('')
  const [cartWarning, setCartWarning] = useState('')

  async function verifyToken() {
    if (!tokenRef.current) return
    setStatus('verifying')
    setMessage('')
    try {
      const response = await apiRequest('/auth/verify-email', {
        method: 'POST', credentials: 'include', body: JSON.stringify({ token: tokenRef.current }),
      })
      if (!response?.accessToken) throw Error(copy.weCouldnTStartYourSession)
      setCustomerSession(response)
      clearPendingRegistration()
      setStatus('verified')
      tokenRef.current = '' // Verification links are single-use.
      try {
        await activateCustomerCart()
      } catch {
        setCartWarning('yourAccountIsActiveOpenYourCart')
      }
    } catch (error) {
      const expired = error.code === 'VERIFICATION_LINK_EXPIRED'
      const invalid = error.code === 'VERIFICATION_LINK_INVALID'
      setStatus(expired ? 'expired' : invalid ? 'invalid' : 'error')
      setMessage(expired ? 'thisLinkHasExpiredRequestANew'
        : invalid ? 'thisLinkIsInvalidOrHasAlready'
          : 'weCouldnTVerifyYourEmailPlease')
    }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (tokenRef.current) {
      // Never leave a one-time secret in the address bar or copied URL.
      window.history.replaceState(window.history.state, '', '/auth/verify-email')
      void verifyToken()
    }
  }, [])

  async function handleResend(event) {
    event.preventDefault()
    if (resendBusy) return
    if (!validCustomerEmail(email)) {
      setResendError('enterAValidEmailAddress')
      return
    }
    setResendBusy(true)
    setResendError('')
    try {
      await apiRequest('/auth/resend-verification', {
        method: 'POST', body: JSON.stringify({ email: email.trim() }),
      })
      setResendDone(true)
    } catch (error) {
      setResendError('weCouldnTSendANewLink')
    } finally {
      setResendBusy(false)
    }
  }

  return <div className="verify-email-page">
    <Navbar restoreSession={!verifyingLink.current || status === 'verified'} />
    <main className="verify-email-main">
      <section className="verify-email-card" aria-live="polite">
        {status === 'verifying' && <>
          <LoaderCircle className="verify-email-icon verify-email-icon--loading" size={48} aria-hidden="true" />
          <h1>{copy.verifyingYourEmail}</h1>
          <p>{copy.justAMomentWeReActivatingYour}</p>
        </>}
        {status === 'verified' && <>
          <CheckCircle2 className="verify-email-icon verify-email-icon--success" size={48} aria-hidden="true" />
          <h1>{copy.emailVerified2}</h1>
          <p>{copy.yourAccountIsActiveAndYouRe}</p>
          {cartWarning && <p className="verify-email-warning" role="status">{copy[cartWarning]}</p>}
          <div className="verify-email-actions">
            <a href="/account" className="auth-submit verify-email-button">{copy.goToMyAccount}</a>
            <a href="/" className="auth-secondary verify-email-button">{copy.backToHome}</a>
          </div>
        </>}
        {status !== 'verified' && status !== 'verifying' && <>
          <CircleAlert className="verify-email-icon verify-email-icon--error" size={48} aria-hidden="true" />
          <h1>{status === 'expired' ? copy.verificationLinkExpired : copy.unableToVerifyEmail}</h1>
          <p>{copy[message]}</p>
          {status === 'error' && <button className="auth-submit verify-email-button" type="button" onClick={() => void verifyToken()}>{copy.tryAgain}</button>}
          {resendDone ? <div className="verify-email-sent" role="status">
            <MailCheck size={24} aria-hidden="true" />
            {copy.ifTheAccountIsAwaitingVerificationA}
          </div> : <form className="verify-email-resend-form" onSubmit={handleResend}>
            <label htmlFor="verify-resend-email">{copy.sendANewVerificationLink}</label>
            <input id="verify-resend-email" className="auth-input" type="email" autoComplete="email" required
              maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.emailAddress} />
            {resendError && <p className="auth-reset-error" role="alert">{copy[resendError]}</p>}
            <button className="auth-submit verify-email-button" type="submit" disabled={resendBusy}>{resendBusy ? copy.sending2 : copy.resendVerificationEmail}</button>
          </form>}
          <a className="verify-email-back" href="/">{copy.backToZetruv}</a>
        </>}
      </section>
    </main>
  </div>
}
