import { useEffect, useMemo, useRef, useState } from 'react'
import { assets } from '../data/assets'

function maskEmail(email) {
  const value = String(email || '').trim()
  if (!value.includes('@')) return 'arka***@gmail.com'

  const [local, domain] = value.split('@')
  const shown = (local || 'arka').slice(0, 4)
  return `${shown}***@${domain || 'gmail.com'}`
}

export default function AuthModal({ mode = 'login', onModeChange, onClose, onAuthenticated }) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resendSeconds, setResendSeconds] = useState(45)
  const dialogRef = useRef(null)

  const isRegister = mode === 'register'
  const isForgotRequest = mode === 'forgot'
  const isForgotCheck = mode === 'forgot-check'
  const isForgotNew = mode === 'forgot-new'
  const isForgotSuccess = mode === 'forgot-success'
  const isForgotFlow = isForgotRequest || isForgotCheck || isForgotNew || isForgotSuccess
  const maskedEmail = useMemo(() => maskEmail(resetEmail), [resetEmail])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => dialogRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    setPasswordVisible(false)
    setConfirmPasswordVisible(false)
  }, [mode])

  useEffect(() => {
    if (!isForgotCheck || resendSeconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [isForgotCheck, resendSeconds])

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose?.()
  }

  function handleAuthSubmit(event) {
    event.preventDefault()
    if (!isRegister) {
      onAuthenticated?.()
      onClose?.()
    }
  }

  function handleResetRequest(event) {
    event.preventDefault()
    setResendSeconds(45)
    onModeChange?.('forgot-check')
  }

  function handleResetPassword(event) {
    event.preventDefault()
    onModeChange?.('forgot-success')
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={handleBackdrop}>
      <section
        className={`auth-modal${isForgotFlow ? ' auth-modal--forgot-flow' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={
          isForgotRequest ? 'Forgot password'
            : isForgotCheck ? 'Check your email'
              : isForgotNew ? 'Create a new password'
                : isForgotSuccess ? 'Password updated'
                  : isRegister ? 'Register'
                    : 'Login'
        }
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="auth-modal__visual" aria-hidden="true">
          <div className="auth-modal__visual-inner">
            <img src={assets.authHero} alt="" />
          </div>
        </div>

        {isForgotRequest && (
          <div className="auth-modal__content auth-modal__content--forgot">
            <button className="auth-back-login" type="button" onClick={() => onModeChange?.('login')}>
              <img src={assets.authBackArrow} alt="" />
              <span>Back to login</span>
            </button>

            <div className="auth-forgot-heading">
              <h2>Forgot password?</h2>
              <p>Enter the email associated with your account. We’ll send you a secure link to reset your password.</p>
            </div>

            <form className="auth-reset-form" onSubmit={handleResetRequest}>
              <input
                className="auth-input auth-reset-email"
                type="email"
                name="reset-email"
                placeholder="Email"
                autoComplete="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
              />
              <button className="auth-submit auth-reset-submit" type="submit">Send reset link</button>
            </form>

            <p className="auth-security-note">
              For security, we’ll show the same confirmation whether or not an account exists for that email.
            </p>
          </div>
        )}

        {isForgotCheck && (
          <div className="auth-modal__content auth-modal__content--check-email">
            <div className="auth-state-icon auth-state-icon--mail">
              <img src={assets.authMail} alt="" />
            </div>

            <div className="auth-state-heading auth-state-heading--check">
              <h2>Check your email</h2>
              <p>
                If an account exists for {maskedEmail}, a password reset link is on the way. The link expires in 15 minutes.
              </p>
            </div>

            <div className="auth-check-actions">
              <button className="auth-submit auth-check-open" type="button" onClick={() => onModeChange?.('forgot-new')}>
                Open email
              </button>
              <button className="auth-secondary" type="button" onClick={() => onModeChange?.('forgot')}>
                Use another email
              </button>
            </div>

            <div className="auth-resend">
              <span>Didn’t get the email?</span>
              <button
                type="button"
                disabled={resendSeconds > 0}
                onClick={() => {
                  if (resendSeconds === 0) setResendSeconds(45)
                }}
              >
                {resendSeconds > 0 ? `Resend in 00:${String(resendSeconds).padStart(2, '0')}` : 'Resend now'}
              </button>
            </div>
          </div>
        )}

        {isForgotNew && (
          <div className="auth-modal__content auth-modal__content--new-password">
            <div className="auth-new-heading">
              <h2>Create a new password</h2>
              <p>Choose a password you haven’t used before.</p>
            </div>

            <form className="auth-new-form" onSubmit={handleResetPassword}>
              <div className="auth-new-fields">
                <div className="auth-password auth-password--wide">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    name="new-password"
                    placeholder="New password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <button
                    className="auth-password__toggle"
                    type="button"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    <img src={assets.authEye} alt="" />
                  </button>
                </div>

                <div className="auth-password auth-password--wide">
                  <input
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    name="confirm-new-password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    className="auth-password__toggle"
                    type="button"
                    aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}
                    onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                  >
                    <img src={assets.authEye} alt="" />
                  </button>
                </div>
              </div>

              <div className="auth-requirements">
                <p>Password must include:</p>
                <div className="auth-requirement is-complete"><span>✓</span><strong>At least 8 characters</strong></div>
                <div className="auth-requirement is-complete"><span>✓</span><strong>1 uppercase letter</strong></div>
                <div className="auth-requirement"><span>•</span><strong>1 number</strong></div>
              </div>

              <button className="auth-submit auth-reset-password" type="submit">Reset password</button>
            </form>
          </div>
        )}

        {isForgotSuccess && (
          <div className="auth-modal__content auth-modal__content--password-updated">
            <div className="auth-state-icon auth-state-icon--success">
              <img src={assets.authSuccess} alt="" />
            </div>

            <div className="auth-state-heading auth-state-heading--success">
              <h2>Password updated</h2>
              <p>Your password has been changed successfully. You can now sign in with your new password.</p>
            </div>

            <button className="auth-submit auth-success-login" type="button" onClick={() => onModeChange?.('login')}>
              Back to login
            </button>

            <p className="auth-success-tip">Tip: keep your password unique to Zetruv.</p>
          </div>
        )}

        {!isForgotFlow && (
          <div className="auth-modal__content">
            <div className="auth-modal__content-inner">
              <div className="auth-tabs" role="tablist" aria-label="Authentication">
                <button
                  className={`auth-tab${!isRegister ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={!isRegister}
                  onClick={() => onModeChange?.('login')}
                >
                  Login
                </button>
                <button
                  className={`auth-tab${isRegister ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={isRegister}
                  onClick={() => onModeChange?.('register')}
                >
                  Register
                </button>
              </div>

              <div className="auth-heading">
                <h2>{isRegister ? 'Register' : 'Login'}</h2>
                <p>{isRegister ? 'Create your account and start the adventure' : 'Please login to your account and start the adventure'}</p>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {isRegister && (
                  <input className="auth-input" type="text" name="name" placeholder="Name" autoComplete="name" />
                )}

                <input className="auth-input" type="email" name="email" placeholder="Email" autoComplete="email" />

                <div className="auth-password-group">
                  <div className="auth-password">
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                    <button
                      className="auth-password__toggle"
                      type="button"
                      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                    >
                      <img src={assets.authEye} alt="" />
                    </button>
                  </div>

                  {!isRegister && (
                    <button
                      className="auth-forgot"
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onModeChange?.('forgot')
                      }}
                    >
                      Forget password?
                    </button>
                  )}
                </div>

                <button className="auth-submit" type="submit">{isRegister ? 'Register' : 'Login'}</button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
