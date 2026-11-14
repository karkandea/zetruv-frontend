import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Bookmark, CircleCheck, Info, MapPin, ReceiptText, UserRound } from 'lucide-react'
import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import { CUSTOMER_EVENT, readCustomerSession } from '../services/customerCartSync'
import { apiRequest } from '../api/httpClient'
import { readFavorites, setFavorite, subscribeFavorites } from '../services/favoritesService'
import '../styles/account.css'

const navItems = [
  { key: 'account', label: 'myAccount', href: '/account', icon: UserRound },
  { key: 'orders', label: 'myOrders', href: '/account/orders', icon: ReceiptText },
  { key: 'addresses', label: 'addresses', href: '/account/addresses', icon: MapPin },
  { key: 'favorites', label: 'bookmark', href: '/account/favorites', icon: Bookmark },
]

function useCustomerSession() {
  const [session, setSession] = useState(readCustomerSession)
  useEffect(() => {
    const update = () => setSession(readCustomerSession())
    window.addEventListener(CUSTOMER_EVENT, update)
    return () => window.removeEventListener(CUSTOMER_EVENT, update)
  }, [])
  return session
}

function AccountShell({ active, customer: profileCustomer, children }) {
  const sessionCustomer = useCustomerSession()?.customer
  return (
    <div className="account-page">
      <Navbar variant="account" homepageMobileMenu />
      <main className="account-layout">
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
      <div className="account-sidebar__profile">
        <div className="account-sidebar__profile-top">
          <span className="account-avatar account-avatar--small">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <span title={email}>{email}</span>
          </div>
        </div>
      </div>
      <div className="account-sidebar__rule" />
      <nav className="account-sidebar__nav" aria-label={copy.accountNavigation}>
        {navItems.map(({ key, label, href, icon: Icon }) => (
          <a aria-current={key === active ? 'page' : undefined} href={href} key={key}>
            <Icon size={19} aria-hidden="true" />
            <span>{copy[label]}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

function PageHeader({ title, description, id }) {
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

export function AccountOverviewPage() {
  const copy = useStorefrontCopy()
  const accessToken = useCustomerSession()?.accessToken
  const [profile, setProfile] = useState(null)
  const state = !accessToken ? 'guest' : profile?.token === accessToken ? profile.state : 'loading'
  const customer = state === 'ready' ? profile.customer : null

  useEffect(() => {
    if (!accessToken) { setProfile(null); return }
    const controller = new AbortController()
    apiRequest('/auth/me', {
      cache: 'no-store', signal: controller.signal,
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((result) => {
      if (!controller.signal.aborted) setProfile({ token: accessToken, state: 'ready', customer: result })
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setProfile({ token: accessToken, state: error.status === 401 || error.status === 403 ? 'expired' : 'error' })
      }
    })
    return () => controller.abort()
  }, [accessToken])

  return (
    <AccountShell active="account" customer={customer}>
      <PageHeader id="account-settings" title={copy.myAccount} description={copy.accountDetailsUsedForYourZetruvPurchases} />
      {state !== 'ready' ? (
        <div className="orders-figma-empty" role="status">
          <strong>{state === 'loading' ? copy.loadingProfile : state === 'guest' ? copy.logInToYourAccount : state === 'expired' ? copy.yourSessionHasEnded : copy.profileCouldnTBeLoaded}</strong>
          <p>{state === 'error' ? copy.checkYourConnectionAndReloadThePage : copy.logInWithAVerifiedAccountTo}</p>
          <a className="account-btn account-btn--primary" href={state === 'error' ? '/account' : '/'}>{state === 'error' ? copy.tryAgain2 : copy.backToHome2}</a>
        </div>
      ) : (
        <>
          <section className="account-info-card" aria-labelledby="account-profile-title">
            <div className="profile-overview__identity">
              <span className="account-avatar account-avatar--large">{String(customer.name || 'A').slice(0,1).toUpperCase()}</span>
              <div>
                <h2 id="account-profile-title">{customer.name || copy.zetruvCustomer}</h2>
                <span className="account-profile-status" data-verified={Boolean(customer.emailVerified)}>
                  {customer.emailVerified && <CircleCheck size={15} aria-hidden="true" />}
                  {customer.emailVerified ? copy.emailVerified : copy.emailUnverified}
                </span>
              </div>
            </div>
            <dl className="account-info-grid">
              <InfoRow label={copy.fullName} value={customer.name || '—'} />
              <InfoRow label={copy.email} value={customer.email || '—'} />
              <InfoRow label={copy.phoneNumber2} value={copy.notAvailableYet} />
            </dl>
            <div className="account-note"><Info size={18} aria-hidden="true" /><span>{copy.profileOrPhoneEditingUnavailable}</span></div>
          </section>
        </>
      )}
    </AccountShell>
  )
}

export function AccountEditProfilePage() {
  const copy = useStorefrontCopy()
  return <AccountShell active="account">
    <PageHeader title={copy.editProfile} description={copy.profileSettingsCanTBeSavedRight} />
    <div className="orders-figma-empty"><strong>{copy.profileEditingIsUnavailable}</strong><p>{copy.yourProfileShowsDetailsFromYourVerified}</p><a className="account-btn account-btn--outline" href="/account">{copy.backToMyAccount}</a></div>
  </AccountShell>
}

export function AccountOrdersPage() {
  const copy = useStorefrontCopy()
  const customer = useCustomerSession()?.customer
  return <AccountShell active="orders">
    <PageHeader title={copy.myOrders} />
    <section className="account-orders-empty" aria-labelledby="account-orders-empty-title">
      <img src="/assets/account/orders-empty.svg" alt="" width="132" height="129" />
      <h2 id="account-orders-empty-title">{customer ? copy.orderHistoryIsUnavailable : copy.logInToViewOrders}</h2>
      <p>{customer
        ? copy.useYourOrderNumberToCheckAn
        : copy.checkStatusWithOrderNumber}</p>
      <a className="account-btn account-btn--primary" href="/order-status">{copy.checkOrder} <ArrowUpRight size={16} aria-hidden="true" /></a>
    </section>
  </AccountShell>
}

export function AccountAddressFormPage() {
  const copy = useStorefrontCopy()
  return <AccountShell active="addresses">
    <PageHeader title={copy.shippingAddress} description={copy.addressForMerchandiseDelivery} />
    <div className="orders-figma-empty"><strong>{copy.addressSavingIsUnavailable}</strong><p>{copy.savingAShippingAddressIsCurrentlyUnavailable}</p><a className="account-btn account-btn--outline" href="/account/addresses">{copy.backToAddresses}</a></div>
  </AccountShell>
}

export function AccountAddressesPage() {
  const copy = useStorefrontCopy()
  const customer = useCustomerSession()?.customer
  return <AccountShell active="addresses">
    <PageHeader title={copy.addresses} description={copy.manageYourShippingAddressesForMerchandise} />
    <div className="orders-figma-empty" role="status">
      <strong>{customer ? copy.savedAddressesAreUnavailable : copy.logInToViewAddresses}</strong>
      <p>{customer
        ? copy.savingAddressesToYourAccountIsCurrently
        : copy.logInToViewShippingAddresses}</p>
      <a className="account-btn account-btn--outline" href="/merchandise">{copy.browseMerchandise}</a>
    </div>
  </AccountShell>
}

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
