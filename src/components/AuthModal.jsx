import { useEffect, useRef, useState } from 'react'
import { assets } from '../data/assets'

export default function AuthModal({ mode = 'login', onModeChange, onClose, onAuthenticated }) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const dialogRef = useRef(null)
  const isRegister = mode === 'register'

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

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose?.()
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!isRegister) {
      onAuthenticated?.()
      onClose?.()
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={handleBackdrop}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isRegister ? 'Register' : 'Login'}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="auth-modal__visual" aria-hidden="true">
          <div className="auth-modal__visual-inner">
            <img src={assets.authHero} alt="" />
          </div>
        </div>

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
              <p>
                {isRegister
                  ? 'Create your account and start the adventure'
                  : 'Please login to your account and start the adventure'}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {isRegister && (
                <input
                  className="auth-input"
                  type="text"
                  name="name"
                  placeholder="Name"
                  autoComplete="name"
                />
              )}

              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
              />

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
                  <button className="auth-forgot" type="button">
                    Forget password?
                  </button>
                )}
              </div>

              <button className="auth-submit" type="submit">
                {isRegister ? 'Register' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
