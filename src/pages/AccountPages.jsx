import { Bone, LoadingRegion, SkeletonLines } from '../components/Skeleton'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useState } from 'react'
import { Bookmark, CircleCheck, ChevronRight, KeyRound, LogOut, MapPin, Pencil, ReceiptText, UserRound } from 'lucide-react'
import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import { CUSTOMER_EVENT, readCustomerSession, logoutCustomer, updateCustomerIdentity } from '../services/customerCartSync'
import { apiRequest } from '../api/httpClient'
import { readFavorites, setFavorite, subscribeFavorites } from '../services/favoritesService'
import '../styles/account.css'

const navItems = [
  { key: 'account', label: 'myAccount', href: '/account', icon: UserRound },
  { key: 'orders', label: 'myOrders', href: '/account/orders', icon: ReceiptText },
  { key: 'addresses', label: 'addresses', href: '/account/addresses', icon: MapPin },
  { key: 'favorites', label: 'bookmark', href: '/account/favorites', icon: Bookmark },
]

export function useCustomerSession() {
  const [session, setSession] = useState(readCustomerSession)
  useEffect(() => {
    const update = () => setSession(readCustomerSession())
    window.addEventListener(CUSTOMER_EVENT, update)
    return () => window.removeEventListener(CUSTOMER_EVENT, update)
  }, [])
  return session
}

export function AccountShell({ active, customer: profileCustomer, children }) {
  const sessionCustomer = useCustomerSession()?.customer
  return (
    <div className="account-page">
      <Navbar variant="account" homepageMobileMenu />
      <main className={`account-layout${active === 'account' ? ' account-layout--overview' : ''}${active === 'orders' ? ' account-layout--orders' : ''}`}>
        <AccountSidebar active={active} customer={profileCustomer === undefined ? sessionCustomer : profileCustomer} />
        <section className="account-main">{children}</section>
      </main>
    </div>
  )
}

function AccountSidebar({ active, customer }) {
  const copy = useStorefrontCopy()
  const name = customer?.name || copy.visitor
  const email = customer?.email || copy.signedOut
  return (
    <aside className="account-sidebar">
      <a className="account-sidebar__profile" href="/account">
        <div className="account-sidebar__profile-top">
          <span className="account-avatar account-avatar--small">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <span title={email}>{email}</span>
          </div>
          <ChevronRight size={16} aria-hidden="true" />
        </div>
      </a>
      <div className="account-sidebar__rule" />
      <nav className="account-sidebar__nav" aria-label={copy.accountNavigation}>
        {navItems.map(({ key, label, href, icon: Icon }) => (
          <a aria-current={key === active ? 'page' : undefined} href={href} key={key} data-nav-key={key}>
            <Icon size={19} aria-hidden="true" />
            <span>{copy[label]}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

export function PageHeader({ title, description, id }) {
  return (
    <div className="account-heading" id={id} tabIndex={id ? -1 : undefined}>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="account-info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}


function useRemoteProfile() {
  const accessToken = useCustomerSession()?.accessToken
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!accessToken) { setResult(null); return }
    const controller = new AbortController()
    apiRequest('/auth/me', { cache: 'no-store', signal: controller.signal,
      headers: { Authorization: 'Bearer ' + accessToken } })
      .then(customer => { if (!controller.signal.aborted) setResult({ accessToken, customer }) })
      .catch(error => { if (!controller.signal.aborted) setResult({ accessToken, error }) })
    return () => controller.abort()
  }, [accessToken])
  return { token: accessToken, customer: result?.accessToken === accessToken ? result?.customer : null,
    error: result?.accessToken === accessToken ? result?.error : null,
    loading: Boolean(accessToken && result?.accessToken !== accessToken) }
}

export function AccountOverviewPage() {
  const copy = useStorefrontCopy()
  const { token, customer, loading, error } = useRemoteProfile()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  async function signOut() {
    setLoggingOut(true); setLogoutError('')
    try { await logoutCustomer(); window.location.href = '/' }
    catch (e) { setLogoutError(e.message || 'Gagal keluar dari akun'); setLoggingOut(false) }
  }
  return <AccountShell active="account" customer={customer}>
    <div className="zetruv-profile-title">
      <h1>{copy.myAccount}</h1>
      {customer && <a className="zetruv-edit-round" href="/account/edit" aria-label={copy.editProfile} title={copy.editProfile}><Pencil size={19} /></a>}
    </div>
    {!token ? <div className="orders-figma-empty"><strong>{copy.logInToYourAccount}</strong><a className="account-btn account-btn--primary" href="/"> {copy.backToHome2} </a></div>
      : loading ? <LoadingRegion label={copy.loadingProfile}><Bone width="100%" height="200px" /></LoadingRegion>
      : error || !customer ? <div className="orders-figma-empty"><strong>{copy.profileCouldnTBeLoaded}</strong><a href="/account" className="account-btn account-btn--outline">{copy.tryAgain2}</a></div>
      : <>
        <section className="zetruv-profile-hero">
          <span className="account-avatar zetruv-profile-hero__avatar" aria-hidden="true">{customer.name?.slice(0, 1)?.toUpperCase() || 'A'}</span>
          <h2>{customer.name}</h2>
          <p>{[customer.email, customer.phone].filter(Boolean).join(' · ')}</p>
          {customer.emailVerified && <span className="zetruv-profile-verified"><CircleCheck size={14} /> {copy.emailVerified}</span>}
        </section>
        <nav className="zetruv-profile-actions" aria-label={copy.accountNavigation}>
          <a href="/account/password"><span className="zetruv-profile-actions__icon"><KeyRound size={22}/></span><span><strong>Password</strong><small>Ubah password melalui verifikasi email</small></span><ChevronRight size={18}/></a>
          <a href="/account/orders"><span className="zetruv-profile-actions__icon"><ReceiptText size={22}/></span><span><strong>{copy.myOrders}</strong><small>Pantau transaksi dan pesanan kamu</small></span><ChevronRight size={18}/></a>
          <a href="/account/addresses"><span className="zetruv-profile-actions__icon"><MapPin size={22}/></span><span><strong>{copy.addresses}</strong><small>Simpan alamat untuk merchandise</small></span><ChevronRight size={18}/></a>
          <a href="/account/favorites"><span className="zetruv-profile-actions__icon"><Bookmark size={22}/></span><span><strong>{copy.bookmark}</strong><small>Lihat produk yang kamu simpan</small></span><ChevronRight size={18}/></a>
        </nav>
        <button type="button" className="zetruv-profile-signout" onClick={signOut} disabled={loggingOut}><LogOut size={18}/>{loggingOut ? 'Keluar…' : 'Keluar dari akun'}</button>
        {logoutError && <p role="alert">{logoutError}</p>}
      </>}
  </AccountShell>
}

export function AccountEditProfilePage() {
  const copy = useStorefrontCopy()
  const { token, customer, error, loading } = useRemoteProfile()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  useEffect(() => {
    if (customer) { setName(customer.name || ''); setPhone(customer.phone || '') }
  }, [customer])
  async function save(e) {
    e.preventDefault(); setSaving(true); setFailure(''); setMessage('')
    try {
      const result = await apiRequest('/auth/me', {
        method: 'PUT', headers: { Authorization: 'Bearer ' + token },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null })
      })
      updateCustomerIdentity(result)
      setMessage('Profil berhasil disimpan.')
      window.location.href = '/account'
    } catch (e) { setFailure(e.message || 'Gagal menyimpan profil') }
    finally { setSaving(false) }
  }
  return <AccountShell active="account">
    <PageHeader title={copy.editProfile} description="Perbarui nama dan nomor HP akun Zetruv." />
    {loading ? <LoadingRegion label={copy.loadingProfile}><SkeletonLines/></LoadingRegion>
      : error || !customer ? <p role="alert">Profil tidak tersedia. Silakan masuk kembali.</p>
      : <form className="zetruv-account-form" onSubmit={save}>
        <label>Nama lengkap<input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
        <label>Email terverifikasi<input type="email" value={customer.email || ''} disabled /></label>
        <p className="zetruv-form-note">Perubahan email memerlukan verifikasi ulang. Email yang sudah terverifikasi tidak dapat langsung diganti.</p>
        <label>Nomor HP<input type="tel" placeholder="08xxxxxxxxxx" maxLength={24} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></label>
        {failure && <p role="alert" className="zetruv-form-error">{failure}</p>}
        {message && <p role="status">{message}</p>}
        <div className="zetruv-form-actions"><a href="/account" className="account-btn account-btn--outline">Batal</a><button className="account-btn account-btn--primary" disabled={saving || name.trim().length < 2} type="submit">{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button></div>
      </form>}
  </AccountShell>
}

export function AccountPasswordPage() {
  const { token, customer, loading } = useRemoteProfile()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  async function requestReset() {
    setBusy(true); setError('')
    try {
      await apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: customer.email }) })
      setSent(true)
    } catch (e) { setError(e.message || 'Gagal mengirim email') }
    finally { setBusy(false) }
  }
  return <AccountShell active="account">
    <PageHeader title="Password" description="Untuk keamanan, ubah password melalui tautan verifikasi ke email akun." />
    {loading ? <LoadingRegion label="Memuat profil"><SkeletonLines/></LoadingRegion> : !token || !customer ? <p>Silakan masuk untuk mengelola password.</p> :
      <section className="zetruv-account-form">
        <strong>{customer.email}</strong>
        <p>{sent ? 'Jika email tersedia, tautan reset sudah dikirim. Periksa kotak masuk.' : 'Kirim tautan ubah password ke email terverifikasi.'}</p>
        {error && <p role="alert" className="zetruv-form-error">{error}</p>}
        <button type="button" className="account-btn account-btn--primary" onClick={requestReset} disabled={busy || sent}>{busy ? 'Mengirim…' : sent ? 'Tautan diminta' : 'Kirim tautan ubah password'}</button>
      </section>}
  </AccountShell>
}

export { AccountAddressesPage, AccountAddressFormPage } from './CustomerAddressPages'

export function AccountFavoritesPage() {
  const copy = useStorefrontCopy()
  const [favorites, setFavorites] = useState(readFavorites)

  useEffect(() => subscribeFavorites(setFavorites), [])

  return (
    <AccountShell active="favorites">
      <PageHeader
        title={copy.favorites}
        description={favorites.length ? copy.quicklyFindTheProductsYouVeSaved : copy.productsYouSaveWillAppearHere}
      />
      <div className="favorite-grid">
        {favorites.map((item) => (
          <article className="favorite-card" key={item.id}>
            <div className="favorite-card__image">{item.image ? <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : item.code}</div>
            <h2>{item.name}</h2>
            <p>{item.type}</p>
            <strong>{item.price}</strong>
            <div className="favorite-card__actions">
              <button
                className="account-btn account-btn--outline"
                type="button"
                onClick={() => setFavorites(setFavorite(item, false))}
              >
                {copy.removeFromFavorites2}
              </button>
              <a className="account-btn account-btn--primary" href={item.href}>{copy.viewProducts}</a>
            </div>
          </article>
        ))}
        {favorites.length === 0 && (
          <div className="favorite-empty">
            <span className="favorite-empty__icon"><img src={accountIcons.heart} alt="" /></span>
            <strong>{copy.noFavoriteProductsYet}</strong>
            <p>{copy.saveTheProductsYouLikeSoYou}</p>
            <a className="account-btn account-btn--primary favorite-empty__button" href="/search">{copy.browseProducts}</a>
          </div>
        )}
      </div>
    </AccountShell>
  )
}
