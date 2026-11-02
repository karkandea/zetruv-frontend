import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, LoaderCircle, MailCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import { apiRequest } from '../api/httpClient'
import { activateCustomerCart, setCustomerSession } from '../services/customerCartSync'
import { clearPendingRegistration, readPendingRegistration, validCustomerEmail } from '../services/registrationVerification'

export default function VerifyEmailPage() {
  const tokenRef = useRef(new URLSearchParams(window.location.search).get('token') || '')
  const started = useRef(false)
  const [status, setStatus] = useState(tokenRef.current ? 'verifying' : 'invalid')
  const [message, setMessage] = useState(tokenRef.current ? '' : 'Tautan verifikasi tidak memiliki token. Minta tautan baru di bawah.')
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
        method: 'POST', body: JSON.stringify({ token: tokenRef.current }),
      })
      if (!response?.accessToken) throw Error('Sesi login tidak diterima dari server.')
      setCustomerSession(response)
      clearPendingRegistration()
      setStatus('verified')
      tokenRef.current = '' // Verification links are single-use.
      try {
        await activateCustomerCart()
      } catch {
        setCartWarning('Akun aktif, tetapi keranjang belum tersinkron. Coba buka Keranjang untuk memuat ulang.')
      }
    } catch (error) {
      const expired = error.code === 'VERIFICATION_LINK_EXPIRED'
      const invalid = error.code === 'VERIFICATION_LINK_INVALID'
      setStatus(expired ? 'expired' : invalid ? 'invalid' : 'error')
      setMessage(expired ? 'Tautan ini sudah kedaluwarsa. Minta tautan verifikasi baru.'
        : invalid ? 'Tautan tidak berlaku atau sudah dipakai. Jika akun sudah aktif, silakan login.'
          : error.message || 'Server belum dapat memverifikasi email. Coba lagi.')
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
      setResendError('Masukkan alamat email yang valid.')
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
      setResendError(error.message || 'Belum dapat mengirim tautan baru.')
    } finally {
      setResendBusy(false)
    }
  }

  return <div className="verify-email-page">
    <Navbar />
    <main className="verify-email-main">
      <section className="verify-email-card" aria-live="polite">
        {status === 'verifying' && <>
          <LoaderCircle className="verify-email-icon verify-email-icon--loading" size={48} aria-hidden="true" />
          <h1>Verifying your email</h1>
          <p>Just a moment. We’re activating your Zetruv account.</p>
        </>}
        {status === 'verified' && <>
          <CheckCircle2 className="verify-email-icon verify-email-icon--success" size={48} aria-hidden="true" />
          <h1>Email verified!</h1>
          <p>Your account is active and you’re signed in. Welcome to Zetruv!</p>
          {cartWarning && <p className="verify-email-warning" role="status">{cartWarning}</p>}
          <div className="verify-email-actions">
            <a href="/account" className="auth-submit verify-email-button">Go to My Account</a>
            <a href="/cart" className="auth-secondary verify-email-button">View Cart</a>
          </div>
        </>}
        {status !== 'verified' && status !== 'verifying' && <>
          <CircleAlert className="verify-email-icon verify-email-icon--error" size={48} aria-hidden="true" />
          <h1>{status === 'expired' ? 'Verification link expired' : 'Unable to verify email'}</h1>
          <p>{message}</p>
          {status === 'error' && <button className="auth-submit verify-email-button" type="button" onClick={() => void verifyToken()}>Try again</button>}
          {resendDone ? <div className="verify-email-sent" role="status">
            <MailCheck size={24} aria-hidden="true" />
            If the account is awaiting verification, a new email will arrive shortly. Check your inbox and spam folder.
          </div> : <form className="verify-email-resend-form" onSubmit={handleResend}>
            <label htmlFor="verify-resend-email">Send a new verification link</label>
            <input id="verify-resend-email" className="auth-input" type="email" autoComplete="email" required
              maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
            {resendError && <p className="auth-reset-error" role="alert">{resendError}</p>}
            <button className="auth-submit verify-email-button" type="submit" disabled={resendBusy}>{resendBusy ? 'Sending...' : 'Resend verification email'}</button>
          </form>}
          <a className="verify-email-back" href="/">Back to Zetruv</a>
        </>}
      </section>
    </main>
  </div>
}
