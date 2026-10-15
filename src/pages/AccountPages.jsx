import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import { readCustomerSession } from '../services/customerCartSync'
import { readFavorites, setFavorite, subscribeFavorites } from '../services/favoritesService'
import '../styles/account.css'

const navItems = [
  { key: 'account', label: 'Akun Saya', href: '/account', icon: accountIcons.account },
  { key: 'orders', label: 'Pesanan Saya', href: '/account/orders', icon: accountIcons.orders },
  { key: 'addresses', label: 'Alamat', href: '/account/addresses', icon: accountIcons.address },
  { key: 'favorites', label: 'Favorit', href: '/account/favorites', icon: accountIcons.favorite },
]

function AccountShell({ active, children, tall = false }) {
  return (
    <div className="account-page">
      <Navbar variant="account" />
      <main className={`account-layout${tall ? ' account-layout--tall' : ''}`}>
        <AccountSidebar active={active} tall={tall} />
        <section className="account-main">{children}</section>
      </main>
    </div>
  )
}

function AccountSidebar({ active, tall }) {
  const customer = readCustomerSession()?.customer
  const name = customer?.name || 'Pengunjung'
  const email = customer?.email || 'Belum masuk'
  return (
    <aside className={`account-sidebar${tall ? ' account-sidebar--tall' : ''}`}>
      <div className="account-sidebar__profile">
        <div className="account-sidebar__profile-top">
          <span className="account-avatar account-avatar--small">{name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>Akun Saya</strong>
            <span>{email}</span>
          </div>
        </div>
        <p>Kelola data akun dan transaksi</p>
      </div>
      <div className="account-sidebar__rule" />
      <nav className="account-sidebar__nav" aria-label="Navigasi akun">
        {navItems.map((item) => (
          <a className={item.key === active ? 'is-active' : ''} href={item.href} key={item.key}>
            <span className="account-sidebar__icon"><img src={item.icon} alt="" /></span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

function PageHeader({ title, description, action }) {
  return (
    <div className="account-heading-row">
      <div className="account-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="account-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function AccountOverviewPage() {
  const customer = readCustomerSession()?.customer
  return (
    <AccountShell active="account">
      <PageHeader title="Akun Saya" description="Informasi akun yang digunakan untuk transaksi Zetruv." />
      {!customer ? (
        <div className="orders-figma-empty"><strong>Silakan masuk ke akun</strong><p>Login untuk melihat profilmu.</p><a className="account-btn account-btn--primary" href="/">Ke Beranda</a></div>
      ) : (
        <>
          <section className="profile-overview">
            <div className="profile-overview__identity">
              <span className="account-avatar account-avatar--large">{String(customer.name || 'A').slice(0,1).toUpperCase()}</span>
              <div><h2>{customer.name || 'Pengguna Zetruv'}</h2><p>{customer.email}</p><small>Informasi berasal dari sesi akun yang terverifikasi.</small></div>
            </div>
          </section>
          <section className="account-info-card">
            <h2>Informasi Akun</h2>
            <InfoRow label="Nama" value={customer.name || '—'} />
            <InfoRow label="Email" value={customer.email || '—'} />
            <InfoRow label="Nomor HP" value="Belum tersedia" />
          </section>
          <div className="account-note"><img src={accountIcons.info} alt="" /><span>Pengubahan profil serta penyimpanan nomor HP belum tersedia. Detail akun tidak dapat diubah dari halaman ini.</span></div>
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
  const customer = readCustomerSession()?.customer
  return <AccountShell active="orders">
    <PageHeader title="Pesanan Saya" description="Pantau pesanan yang tercatat di akun Zetruv." />
    <div className="orders-figma-empty" role="status">
      <strong>{customer ? 'Riwayat pesanan akun belum dapat ditampilkan' : 'Masuk untuk melihat pesanan'}</strong>
      <p>{customer
        ? 'Daftar pesanan akun belum didukung oleh layanan saat ini. Tidak ada data contoh yang ditampilkan. Kamu masih bisa memeriksa pesanan menggunakan kode pesanan.'
        : 'Login dulu untuk mengakses informasi pesanan pribadi.'}</p>
      <a className="account-btn account-btn--primary" href="/order-status">Cek Pesanan</a>
    </div>
  </AccountShell>
}

export function AccountAddressFormPage() {
  return <AccountShell active="addresses">
    <PageHeader title="Alamat Pengiriman" description="Alamat untuk pengiriman merchandise." />
    <div className="orders-figma-empty"><strong>Penyimpanan alamat belum tersedia</strong><p>Belum ada layanan alamat akun yang terhubung. Formulir tidak ditampilkan agar tidak memberi kesan alamat berhasil tersimpan.</p><a className="account-btn account-btn--outline" href="/account/addresses">Kembali ke Alamat</a></div>
  </AccountShell>
}

export function AccountAddressesPage() {
  const customer = readCustomerSession()?.customer
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
