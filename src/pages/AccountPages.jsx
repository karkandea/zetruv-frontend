import { useEffect, useState } from 'react'
import { ArrowUpRight, Bookmark, CircleCheck, Info, MapPin, ReceiptText, UserRound } from 'lucide-react'
import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import { CUSTOMER_EVENT, readCustomerSession } from '../services/customerCartSync'
import { apiRequest } from '../api/httpClient'
import { readFavorites, setFavorite, subscribeFavorites } from '../services/favoritesService'
import '../styles/account.css'

const navItems = [
  { key: 'account', label: 'Akun Saya', href: '/account', icon: UserRound },
  { key: 'orders', label: 'Pesanan Saya', href: '/account/orders', icon: ReceiptText },
  { key: 'addresses', label: 'Alamat', href: '/account/addresses', icon: MapPin },
  { key: 'favorites', label: 'Bookmark', href: '/account/favorites', icon: Bookmark },
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
  const name = customer?.name || 'Pengunjung'
  const email = customer?.email || 'Belum masuk'
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
      <nav className="account-sidebar__nav" aria-label="Navigasi akun">
        {navItems.map(({ key, label, href, icon: Icon }) => (
          <a aria-current={key === active ? 'page' : undefined} href={href} key={key}>
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
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
      <PageHeader id="account-settings" title="Akun Saya" description="Informasi akun yang digunakan untuk transaksi Zetruv." />
      {state !== 'ready' ? (
        <div className="orders-figma-empty" role="status">
          <strong>{state === 'loading' ? 'Memuat profil…' : state === 'guest' ? 'Silakan masuk ke akun' : state === 'expired' ? 'Sesi login sudah berakhir' : 'Profil belum bisa dimuat'}</strong>
          <p>{state === 'error' ? 'Periksa koneksi dan coba muat ulang halaman.' : 'Informasi profil hanya ditampilkan setelah diverifikasi oleh backend.'}</p>
          <a className="account-btn account-btn--primary" href={state === 'error' ? '/account' : '/'}>{state === 'error' ? 'Coba Lagi' : 'Ke Beranda'}</a>
        </div>
      ) : (
        <>
          <section className="account-info-card" aria-labelledby="account-profile-title">
            <div className="profile-overview__identity">
              <span className="account-avatar account-avatar--large">{String(customer.name || 'A').slice(0,1).toUpperCase()}</span>
              <div>
                <h2 id="account-profile-title">{customer.name || 'Pengguna Zetruv'}</h2>
                <span className="account-profile-status" data-verified={Boolean(customer.emailVerified)}>
                  {customer.emailVerified && <CircleCheck size={15} aria-hidden="true" />}
                  {customer.emailVerified ? 'Email terverifikasi' : 'Email belum terverifikasi'}
                </span>
              </div>
            </div>
            <dl className="account-info-grid">
              <InfoRow label="Nama lengkap" value={customer.name || '—'} />
              <InfoRow label="Email" value={customer.email || '—'} />
              <InfoRow label="Nomor HP" value="Belum tersedia" />
            </dl>
            <div className="account-note"><Info size={18} aria-hidden="true" /><span>Pengubahan profil dan penambahan nomor HP belum tersedia.</span></div>
          </section>
        </>
      )}
    </AccountShell>
  )
}

export function AccountEditProfilePage() {
  return <AccountShell active="account">
    <PageHeader title="Ubah Profil" description="Pengaturan profil belum dapat disimpan saat ini." />
    <div className="orders-figma-empty"><strong>Pengubahan profil belum tersedia</strong><p>Data profil tetap mengikuti akun terverifikasi, tanpa perubahan semu.</p><a className="account-btn account-btn--outline" href="/account">Kembali ke Akun Saya</a></div>
  </AccountShell>
}

export function AccountOrdersPage() {
  const customer = useCustomerSession()?.customer
  return <AccountShell active="orders">
    <PageHeader title="Pesanan Saya" />
    <section className="account-orders-empty" aria-labelledby="account-orders-empty-title">
      <img src="/assets/account/orders-empty.svg" alt="" width="132" height="129" />
      <h2 id="account-orders-empty-title">{customer ? 'Riwayat pesanan belum tersedia' : 'Masuk untuk melihat pesanan'}</h2>
      <p>{customer
        ? 'Kamu masih bisa cek status pesanan menggunakan kode pesanan.'
        : 'Punya kode pesanan? Kamu bisa langsung cek statusnya.'}</p>
      <a className="account-btn account-btn--primary" href="/order-status">Cek Pesanan <ArrowUpRight size={16} aria-hidden="true" /></a>
    </section>
  </AccountShell>
}

export function AccountAddressFormPage() {
  return <AccountShell active="addresses">
    <PageHeader title="Alamat Pengiriman" description="Alamat untuk pengiriman merchandise." />
    <div className="orders-figma-empty"><strong>Penyimpanan alamat belum tersedia</strong><p>Belum ada layanan alamat akun yang terhubung. Formulir tidak ditampilkan agar tidak memberi kesan alamat berhasil tersimpan.</p><a className="account-btn account-btn--outline" href="/account/addresses">Kembali ke Alamat</a></div>
  </AccountShell>
}

export function AccountAddressesPage() {
  const customer = useCustomerSession()?.customer
  return <AccountShell active="addresses">
    <PageHeader title="Alamat" description="Kelola alamat pengiriman merchandise." />
    <div className="orders-figma-empty" role="status">
      <strong>{customer ? 'Alamat tersimpan belum tersedia' : 'Masuk untuk melihat alamat'}</strong>
      <p>{customer
        ? 'Belum ada layanan penyimpanan alamat akun. Kami tidak menampilkan contoh alamat sebagai data pribadimu.'
        : 'Login terlebih dahulu untuk melihat alamat pengiriman.'}</p>
      <a className="account-btn account-btn--outline" href="/merchandise">Lihat Merchandise</a>
    </div>
  </AccountShell>
}

export function AccountFavoritesPage() {
  const [favorites, setFavorites] = useState(readFavorites)

  useEffect(() => subscribeFavorites(setFavorites), [])

  return (
    <AccountShell active="favorites">
      <PageHeader
        title="Favorit"
        description={favorites.length ? 'Produk yang kamu simpan untuk dibuka kembali dengan cepat.' : 'Produk yang kamu simpan akan muncul di sini.'}
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
                Hapus Favorit
              </button>
              <a className="account-btn account-btn--primary" href={item.href}>Lihat Produk</a>
            </div>
          </article>
        ))}
        {favorites.length === 0 && (
          <div className="favorite-empty">
            <span className="favorite-empty__icon"><img src={accountIcons.heart} alt="" /></span>
            <strong>Belum ada produk favorit</strong>
            <p>Simpan produk yang kamu suka supaya mudah ditemukan lagi.</p>
            <a className="account-btn account-btn--primary favorite-empty__button" href="/search">Jelajahi Produk</a>
          </div>
        )}
      </div>
    </AccountShell>
  )
}
