import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useMemo, useRef, useState } from 'react'
import { assets } from '../data/assets'
import { ArrowLeft } from 'lucide-react'
import { authenticateCheckoutCustomer } from '../services/checkoutGatewayService'
import { apiRequest } from '../api/httpClient'
import { clearPendingRegistration, readPendingRegistration, savePendingRegistration, validCustomerEmail } from '../services/registrationVerification'

function maskEmail(email, fallback) {
  const value = String(email || '').trim()
  if (!value.includes('@')) return fallback

  const [local, domain] = value.split('@')
  const shown = (local || '').slice(0, 4)
  return `${shown}***@${domain || 'gmail.com'}`
}

export default function AuthModal({ mode = 'login', onModeChange, onClose, onAuthenticated, resetToken = '' }) {
  const copy = useStorefrontCopy()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [authBusy,setAuthBusy] = useState(false)
  const [authError,setAuthError] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState('')
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [registerEmail, setRegisterEmail] = useState(() => readPendingRegistration()?.email || '')
  const [registrationToken, setRegistrationToken] = useState(() => readPendingRegistration()?.token || '')
  const [editedEmail, setEditedEmail] = useState('')
  const [registerBusy, setRegisterBusy] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resendSeconds, setResendSeconds] = useState(0)
  const dialogRef = useRef(null)

  const isRegister = mode === 'register'
  const isRegisterVerify = mode === 'register-verify'
  const isRegisterVerified = mode === 'register-verified'
  const isRegisterExpired = mode === 'register-expired'
  const isRegisterEdit = mode === 'register-edit'
  const isRegisterFlow = isRegisterVerify || isRegisterVerified || isRegisterExpired || isRegisterEdit

  const isForgotRequest = mode === 'forgot'
  const isForgotCheck = mode === 'forgot-check'
  const isForgotNew = mode === 'forgot-new'
  const isForgotSuccess = mode === 'forgot-success'
  const isForgotFlow = isForgotRequest || isForgotCheck || isForgotNew || isForgotSuccess

  const maskedResetEmail = useMemo(() => maskEmail(resetEmail, copy.theEmailAddressYouEntered), [resetEmail, copy])
  const maskedRegisterEmail = useMemo(() => maskEmail(registerEmail, copy.theEmailAddressYouEntered), [registerEmail, copy])

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
    const needsTimer = isForgotCheck || isRegisterVerify
    if (!needsTimer || resendSeconds <= 0) return undefined

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isForgotCheck, isRegisterVerify, resendSeconds])

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose?.()
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    if(authBusy)return
    setAuthBusy(true);setAuthError('')
    let submittedEmail = ''
    try {
      const form=new FormData(event.currentTarget)
      const email=String(form.get('email')||'').trim()
      submittedEmail = email
      const password=String(form.get('password')||'')
      if(isRegister){
        const result = await apiRequest('/auth/register',{method:'POST',body:JSON.stringify({
          name:String(form.get('name')||'').trim(),email,password,
        })})
        setRegistrationToken(result?.registrationToken || '')
        savePendingRegistration(email, result?.registrationToken, result?.verificationExpiresInHours)
        setRegisterEmail(email)
        setRegisterError('')
        setResendSeconds(Number(result?.resendAfterSeconds) || 45)
        onModeChange?.('register-verify')
      }else{
        const response=await authenticateCheckoutCustomer(email,password)
        if(!response?.accessToken)throw Error(copy.weCouldnTVerifyYourSignIn)
        clearPendingRegistration()
        onAuthenticated?.(response)
        onClose?.()
      }
    }catch(e){
      if (!isRegister && e.code === 'EMAIL_NOT_VERIFIED') {
        const pending = readPendingRegistration()
        setRegisterEmail(submittedEmail)
        setRegistrationToken(pending?.email.toLowerCase() === submittedEmail.toLowerCase() ? pending.token : '')
        setResendSeconds(0)
        setRegisterError('yourEmailIsUnverifiedRequestANew')
        onModeChange?.('register-verify')
      } else {
        setAuthError(e.status===401?'yourZetruvEmailOrPasswordIsIncorrect':
          'weCouldnTConnectToTheServer')
      }
    }
    finally{setAuthBusy(false)}
  }

  async function requestVerificationEmail() {
    if (registerBusy) return
    const email = registerEmail.trim()
    if (!validCustomerEmail(email)) {
      setRegisterError('enterAValidEmailAddressToReceive')
      return
    }
    setRegisterBusy(true)
    setRegisterError('')
    try {
      const result = await apiRequest('/auth/resend-verification', {
        method: 'POST', body: JSON.stringify({ email }),
      })
      setResendSeconds(Number(result?.resendAfterSeconds) || 45)
      onModeChange?.('register-verify')
    } catch (error) {
      setRegisterError('weCouldnTSendAVerificationEmail')
    } finally {
      setRegisterBusy(false)
    }
  }

  async function handleChangeRegistrationEmail(event) {
    event.preventDefault()
    if (registerBusy) return
    const newEmail = editedEmail.trim()
    if (!validCustomerEmail(newEmail)) {
      setRegisterError('enterAValidEmailAddress')
      return
    }
    if (!registrationToken) {
      setRegisterError('yourEmailEditingSessionExpiredResendThe')
      return
    }
    setRegisterBusy(true)
    setRegisterError('')
    try {
      const result = await apiRequest('/auth/change-registration-email', {
        method: 'POST', body: JSON.stringify({ registrationToken, newEmail }),
      })
      setRegisterEmail(newEmail)
      setRegistrationToken(result?.registrationToken || '')
      savePendingRegistration(newEmail, result?.registrationToken, result?.verificationExpiresInHours)
      setResendSeconds(Number(result?.resendAfterSeconds) || 45)
      onModeChange?.('register-verify')
    } catch (error) {
      if (error?.code === 'REGISTRATION_SESSION_INVALID') {
        setRegistrationToken('')
        clearPendingRegistration()
      }
      setRegisterError('weCouldnTUpdateYourEmailPlease')
    } finally {
      setRegisterBusy(false)
    }
  }

  async function requestResetLink() {
    if (resetBusy) return
    const email = resetEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      setResetError('enterAValidEmailAddressToReceive2')
      return
    }
    setResetBusy(true)
    setResetError('')
    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST', body: JSON.stringify({ email }),
      })
      setResendSeconds(Number(result?.resendAfterSeconds) || 45)
      onModeChange?.('forgot-check')
    } catch (error) {
      setResetError('weCouldnTSendYourResetRequest')
    } finally {
      setResetBusy(false)
    }
  }

  async function handleResetRequest(event) {
    event.preventDefault()
    await requestResetLink()
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    if (resetBusy) return
    if (!resetToken) {
      setResetError('openTheResetLinkInYourEmail')
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setResetError('useAtLeast8CharactersIncludingAn')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError('thePasswordsDonTMatch')
      return
    }
    setResetBusy(true)
    setResetError('')
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, newPassword, confirmPassword }),
      })
      window.history.replaceState({}, '', '/')
      setNewPassword('')
      setConfirmPassword('')
      onModeChange?.('forgot-success')
    } catch (error) {
      setResetError(error.status === 410 || /expir/i.test(error.message || '')
        ? 'resetLinkExpired' : 'weCouldnTChangeYourPasswordRequest')
    } finally {
      setResetBusy(false)
    }
  }

  function handleResend() {
    if (resendSeconds !== 0) return
    if (isRegisterVerify) void requestVerificationEmail()
    else if (isForgotCheck) void requestResetLink()
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onMouseDown={handleBackdrop}>
      <section
        className={`auth-modal${isForgotFlow || isRegisterFlow ? ' auth-modal--state-flow' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={
          isRegisterVerify ? copy.verifyYourEmail
            : isRegisterVerified ? copy.emailVerified
              : isRegisterExpired ? copy.verificationLinkExpired
                : isRegisterEdit ? copy.editRegistrationEmail
                : isForgotRequest ? copy.forgotPassword
                  : isForgotCheck ? copy.checkYourEmail
                    : isForgotNew ? copy.createANewPassword
                      : isForgotSuccess ? copy.passwordUpdated
                        : isRegister ? copy.register2
                          : copy.logIn2
        }
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="auth-modal__visual" aria-hidden="true">
          <div className="auth-modal__visual-inner">
            <img src={assets.authHero} alt="" />
          </div>
        </div>

        {isRegisterVerify && (
          <div className="auth-modal__content auth-modal__content--register-verify">
            <div className="auth-register-icon auth-register-icon--verify">
              <img src={assets.authRegisterVerify} alt="" />
            </div>

            <div className="auth-register-heading auth-register-heading--verify">
              <h2>{copy.verifyYourEmail}</h2>
              <p>
                {registerEmail ? formatCopy(copy.weSentAVerificationLinkToOpen, { email: maskedRegisterEmail }) : copy.enterYourRegisteredEmailToRequestA}
              </p>
            </div>

            {registrationToken ? (
              <button className="auth-secondary auth-register-edit" type="button" onClick={() => {
                setEditedEmail(registerEmail)
                setRegisterError('')
                onModeChange?.('register-edit')
              }}>{copy.editEmailAddress}</button>
            ) : (
              <input className="auth-input auth-register-email-input" type="email" value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder={copy.registeredEmail} autoComplete="email" maxLength={320} aria-label={copy.registeredEmail} />
            )}

            {registerError && <p className="auth-reset-error" role="alert">{copy[registerError]}</p>}

            <div className="auth-register-resend">
              <span>{copy.didnTGetIt}</span>
              <button type="button" disabled={registerBusy || resendSeconds > 0} onClick={handleResend}>
                {registerBusy ? copy.sending2 : resendSeconds > 0 ? formatCopy(copy.resendIn00, { seconds: String(resendSeconds).padStart(2, '0') }) : copy.resendNow}
              </button>
            </div>

            <p className="auth-register-note">{copy.verificationLinksExpireAfter24Hours}</p>
          </div>
        )}

        {isRegisterEdit && (
          <div className="auth-modal__content auth-modal__content--register-verify">
            <div className="auth-register-icon auth-register-icon--verify">
              <img src={assets.authRegisterVerify} alt="" />
            </div>
            <div className="auth-register-heading">
              <h2>{copy.editEmailAddress}</h2>
              <p>{copy.weLlSendANewVerificationLink}</p>
            </div>
            <form className="auth-register-edit-form" onSubmit={handleChangeRegistrationEmail}>
              <input className="auth-input" type="email" name="newEmail" placeholder={copy.newEmailAddress}
                autoComplete="email" required maxLength={320} value={editedEmail}
                onChange={(event) => setEditedEmail(event.target.value)} />
              {registerError && <p className="auth-reset-error" role="alert">{copy[registerError]}</p>}
              <button className="auth-submit auth-register-primary" type="submit" disabled={registerBusy}>
                {registerBusy ? 'Updating...' : copy.saveAndSendVerification}
              </button>
              <button className="auth-secondary" type="button" onClick={() => {
                setRegisterError('')
                onModeChange?.('register-verify')
              }}>{copy.backToVerification}</button>
            </form>
          </div>
        )}

        {isRegisterVerified && (
          <div className="auth-modal__content auth-modal__content--register-verified">
            <div className="auth-register-icon auth-register-icon--verified">
              <img src={assets.authRegisterVerified} alt="" />
            </div>

            <div className="auth-register-heading auth-register-heading--verified">
              <h2>{copy.emailVerified}</h2>
              <p>{copy.yourEmailHasBeenVerifiedSuccessfullyYour}</p>
            </div>

            <button className="auth-submit auth-register-primary" type="button" onClick={() => onModeChange?.('login')}>
              {copy.continueToLogin}
            </button>

            <p className="auth-register-ready">{copy.yourAccountIsNowVerifiedAndReady}</p>
          </div>
        )}

        {isRegisterExpired && (
          <div className="auth-modal__content auth-modal__content--register-expired">
            <div className="auth-register-icon auth-register-icon--expired">
              <img src={assets.authRegisterExpired} alt="" />
            </div>

            <div className="auth-register-heading auth-register-heading--expired">
              <h2>{copy.verificationLinkExpired}</h2>
              <p>{copy.thisLinkIsNoLongerValidRequest}</p>
            </div>

            <input className="auth-input auth-register-email-input" type="email" value={registerEmail}
              onChange={(event) => setRegisterEmail(event.target.value)}
              placeholder={copy.registeredEmail} autoComplete="email" maxLength={320} aria-label={copy.registeredEmail} />
            {registerError && <p className="auth-reset-error" role="alert">{copy[registerError]}</p>}
            <div className="auth-register-actions">
              <button
                className="auth-submit auth-register-primary"
                type="button"
                disabled={registerBusy}
                onClick={() => void requestVerificationEmail()}
              >
                {registerBusy ? copy.sending2 : copy.sendNewVerificationEmail}
              </button>
              <button className="auth-secondary" type="button" onClick={() => onModeChange?.('login')}>
                {copy.backToLogin}
              </button>
            </div>

            <p className="auth-register-note auth-register-note--expired">
              {copy.forSecurityOnlyTheMostRecentVerification}
            </p>
          </div>
        )}

        {isForgotRequest && (
          <div className="auth-modal__content auth-modal__content--forgot">
            <button className="auth-back-login" type="button" onClick={() => onModeChange?.('login')}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
              <span>{copy.backToLogin}</span>
            </button>

            <div className="auth-forgot-heading">
              <h2>{copy.forgotPassword2}</h2>
              <p>{copy.enterTheEmailAssociatedWithYourAccount}</p>
            </div>

            <form className="auth-reset-form" onSubmit={handleResetRequest}>
              <input
                className="auth-input auth-reset-email"
                type="email"
                name="reset-email"
                placeholder={copy.email}
                autoComplete="email"
                required
                maxLength={320}
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
              />
              {resetError && <p className="auth-reset-error" role="alert">{copy[resetError]}</p>}
              <button className="auth-submit auth-reset-submit" type="submit" disabled={resetBusy}>{resetBusy ? copy.sending3 : copy.sendResetLink}</button>
            </form>

            <p className="auth-security-note">
              {copy.forSecurityThisConfirmationLooksTheSame}
            </p>
          </div>
        )}

        {isForgotCheck && (
          <div className="auth-modal__content auth-modal__content--check-email">
            <div className="auth-state-icon auth-state-icon--mail">
              <img src={assets.authMail} alt="" />
            </div>

            <div className="auth-state-heading auth-state-heading--check">
              <h2>{copy.checkYourEmail}</h2>
              <p>
                {formatCopy(copy.ifAnAccountExistsForAPassword, { email: maskedResetEmail })}
              </p>
            </div>

            <div className="auth-check-actions">
              <p className="auth-email-hint">{copy.openYourInboxAndClickTheReset}</p>
              <button className="auth-secondary" type="button" onClick={() => onModeChange?.('forgot')}>
                {copy.useAnotherEmail}
              </button>
            </div>

            <div className="auth-resend">
              <span>{copy.didnTGetTheEmail}</span>
              <button type="button" disabled={resetBusy || resendSeconds > 0} onClick={handleResend}>
                {resetBusy ? copy.sending2 : resendSeconds > 0 ? formatCopy(copy.resendIn00, { seconds: String(resendSeconds).padStart(2, '0') }) : copy.resendNow}
              </button>
            </div>
          </div>
        )}

        {isForgotNew && (
          <div className="auth-modal__content auth-modal__content--new-password">
            <div className="auth-new-heading">
              <h2>{copy.createANewPassword}</h2>
              <p>{copy.chooseAPasswordYouHavenTUsed}</p>
            </div>

            <form className="auth-new-form" onSubmit={handleResetPassword}>
              <div className="auth-new-fields">
                <div className="auth-password auth-password--wide">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    name="new-password"
                    placeholder={copy.newPassword}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <button
                    className="auth-password__toggle"
                    type="button"
                    aria-label={passwordVisible ? copy.hidePassword : copy.showPassword}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    <img src={assets.authEye} alt="" />
                  </button>
                </div>

                <div className="auth-password auth-password--wide">
                  <input
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    name="confirm-new-password"
                    placeholder={copy.confirmNewPassword}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    className="auth-password__toggle"
                    type="button"
                    aria-label={confirmPasswordVisible ? copy.hidePassword : copy.showPassword}
                    onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                  >
                    <img src={assets.authEye} alt="" />
                  </button>
                </div>
              </div>

              <div className="auth-requirements">
                <p>{copy.passwordRequirements}</p>
                <div className={`auth-requirement${newPassword.length >= 8 ? ' is-complete' : ''}`}><span>{newPassword.length >= 8 ? '✓' : '•'}</span><strong>{copy.atLeast8Characters}</strong></div>
                <div className={`auth-requirement${/[A-Z]/.test(newPassword) ? ' is-complete' : ''}`}><span>{/[A-Z]/.test(newPassword) ? '✓' : '•'}</span><strong>{copy.label1UppercaseLetter}</strong></div>
                <div className={`auth-requirement${/[0-9]/.test(newPassword) ? ' is-complete' : ''}`}><span>{/[0-9]/.test(newPassword) ? '✓' : '•'}</span><strong>{copy.label1Number}</strong></div>
              </div>

              {!resetToken && <p className="auth-reset-error" role="alert">{copy.theResetLinkIsMissingRequestA}</p>}
              {resetError && <p className="auth-reset-error" role="alert">{copy[resetError]}</p>}
              <button className="auth-submit auth-reset-password" type="submit" disabled={resetBusy || !resetToken}>{resetBusy ? copy.saving : copy.resetPassword}</button>
              {!resetToken && <button className="auth-secondary" type="button" onClick={() => onModeChange?.('forgot')}>{copy.requestResetLink}</button>}
            </form>
          </div>
        )}

        {isForgotSuccess && (
          <div className="auth-modal__content auth-modal__content--password-updated">
            <div className="auth-state-icon auth-state-icon--success">
              <img src={assets.authSuccess} alt="" />
            </div>

            <div className="auth-state-heading auth-state-heading--success">
              <h2>{copy.passwordUpdated}</h2>
              <p>{copy.yourPasswordHasBeenChangedSuccessfullyYou}</p>
            </div>

            <button className="auth-submit auth-success-login" type="button" onClick={() => onModeChange?.('login')}>
              {copy.backToLogin}
            </button>

            <p className="auth-success-tip">{copy.useAPasswordThatSUniqueTo}</p>
          </div>
        )}

        {!isForgotFlow && !isRegisterFlow && (
          <div className="auth-modal__content">
            <div className="auth-modal__content-inner">
              <div className="auth-tabs" role="tablist" aria-label={copy.authentication}>
                <button
                  className={`auth-tab${!isRegister ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={!isRegister}
                  onClick={() => onModeChange?.('login')}
                >
                  {copy.logIn2}
                </button>
                <button
                  className={`auth-tab${isRegister ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={isRegister}
                  onClick={() => onModeChange?.('register')}
                >
                  {copy.register2}
                </button>
              </div>

              <div className="auth-heading">
                <h2>{isRegister ? copy.register2 : copy.logIn2}</h2>
                <p>{isRegister ? copy.createYourAccountAndStartTheAdventure : copy.logInToStartTheAdventure}</p>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {authError && <p role="alert" className="auth-error">{copy[authError]}</p>}
                {isRegister && (
                  <input className="auth-input" type="text" name="name" placeholder={copy.name2} autoComplete="name" maxLength={120} required />
                )}

                {isRegister ? (
                  <input
                    className="auth-input"
                    type="email"
                    name="email"
                    placeholder={copy.email}
                    autoComplete="email"
                    required
                    maxLength={320}
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                  />
                ) : (
                  <input className="auth-input" type="email" name="email" placeholder={copy.email} autoComplete="email" required maxLength={320} />
                )}

                <div className="auth-password-group">
                  <div className="auth-password">
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      name="password"
                      placeholder={copy.password}
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                      required
                    />
                    <button
                      className="auth-password__toggle"
                      type="button"
                      aria-label={passwordVisible ? copy.hidePassword : copy.showPassword}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                    >
                      <img src={assets.authEye} alt="" />
                    </button>
                  </div>

                  {!isRegister && (
                    <button
                      className="auth-forgot"
                      type="button"
                      onClick={() => onModeChange?.('forgot')}
                    >
                      {copy.forgotPassword3}
                    </button>
                  )}
                </div>

                <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy?copy.processing2:isRegister?copy.register2:copy.logIn2}</button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
