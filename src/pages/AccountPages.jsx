import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { accountIcons } from '../data/accountIcons'
import '../styles/account.css'

const navItems = [
  { key: 'account', label: 'Akun Saya', href: '/account', icon: accountIcons.account },
  { key: 'orders', label: 'Pesanan Saya', href: '/account/orders', icon: accountIcons.orders },
  { key: 'addresses', label: 'Alamat', href: '/account/addresses', icon: accountIcons.address },
  { key: 'favorites', label: 'Favorit', href: '/account/favorites', icon: accountIcons.favorite },
]

const orders = [
  {
    id: '#ZTR-260818-1042',
    date: '18 Agu 2026 · 14:32',
    status: 'BELUM DIBAYAR',
    tone: 'warning',
    thumb: '12D',
    product: 'Mobile Legends · 12 Diamond',
    detail: 'User ID 12345678 · Zona 1234',
    total: 'Rp12.234',
    action: 'Bayar Sekarang',
  },
  {
    id: '#ZTR-260818-0988',
    date: '18 Agu 2026 · 11:05',
    status: 'DIPROSES',
    tone: 'process',
    thumb: 'GAME',
    product: 'Game Via Login · 500 Coins',
    detail: 'Akun sedang diproses oleh seller',
    total: 'Rp76.000',
  },
  {
    id: '#ZTR-260817-0871',
    date: '17 Agu 2026 · 16:48',
    status: 'DIKIRIM',
    tone: 'success',
    thumb: 'JRSY',
    product: 'Zetruv Gaming Jersey',
    detail: 'Ukuran L · Reguler',
    total: 'Rp267.000',
    action: 'Lacak Pesanan',
  },
  {
    id: '#ZTR-260816-0764',
    date: '16 Agu 2026 · 20:14',
    status: 'SELESAI',
    tone: 'process',
    thumb: '172D',
    product: 'Mobile Legends · 172 Diamonds',
    detail: 'User ID 12345678 · Zona 1234',
    total: 'Rp95.000',
  },
]

const favoriteSeed = [
  { id: 1, code: '12D', name: 'Mobile Legends · 12 Diamond', type: 'Top Up Via ID', price: 'Rp10.234', href: '/search' },
  { id: 2, code: 'GAME', name: 'Game Via Login · 500 Coins', type: 'Top Up Via Login', price: 'Rp75.000', href: '/search/login' },
  { id: 3, code: 'JRSY', name: 'Zetruv Gaming Jersey', type: 'Merchandise', price: 'Rp249.000', href: '/#merch' },
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
  return (
    <aside className={`account-sidebar${tall ? ' account-sidebar--tall' : ''}`}>
      <div className="account-sidebar__profile">
        <div className="account-sidebar__profile-top">
          <span className="account-avatar account-avatar--small">M</span>
          <div>
            <strong>Akun Saya</strong>
            <span>m***@email.com</span>
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
  return (
    <AccountShell active="account">
      <PageHeader title="Akun Saya" description="Kelola informasi akun yang digunakan untuk transaksi Zetruv." />
      <section className="profile-overview">
        <div className="profile-overview__identity">
          <span className="account-avatar account-avatar--large">M</span>
          <div>
            <h2>Muhammad</h2>
            <p>muhammad@email.com · 0812 3456 7878</p>
            <small>Informasi akun untuk identitas dan notifikasi transaksi.</small>
          </div>
        </div>
        <a className="account-btn account-btn--outline" href="/account/edit">Ubah Profil</a>
      </section>
      <section className="account-info-card">
        <h2>Informasi Akun</h2>
        <InfoRow label="Nama" value="Muhammad" />
        <InfoRow label="Email" value="muhammad@email.com" />
        <InfoRow label="Nomor HP" value="0812 3456 7878" />
      </section>
      <div className="account-note">
        <img src={accountIcons.info} alt="" />
        <span>Credential game Via Login tidak ditampilkan kembali di area akun.</span>
      </div>
    </AccountShell>
  )
}

export function AccountEditProfilePage() {
  const [name, setName] = useState('Muhammad')

  return (
    <AccountShell active="account">
      <PageHeader title="Ubah Profil" description="Perbarui informasi dasar akun Zetruv." />
      <form
        className="account-form"
        onSubmit={(event) => {
          event.preventDefault()
          window.location.href = '/account'
        }}
      >
        <label>
          <span>Nama</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Email</span>
          <div className="account-form__locked">
            <span>muhammad@email.com</span>
            <button className="account-btn account-btn--outline account-btn--change" type="button">Ubah</button>
          </div>
        </label>
        <label>
          <span>Nomor HP</span>
          <div className="account-form__locked">
            <span>0812 3456 7878</span>
            <button className="account-btn account-btn--outline account-btn--change" type="button">Ubah</button>
          </div>
        </label>
        <div className="account-note account-note--form">
          <img src={accountIcons.info} alt="" />
          <span>Perubahan email atau nomor HP memerlukan verifikasi keamanan.</span>
        </div>
        <div className="account-form__actions">
          <a className="account-btn account-btn--outline account-btn--cancel" href="/account">Batal</a>
          <button className="account-btn account-btn--primary account-btn--save" type="submit">Simpan Nama</button>
        </div>
      </form>
    </AccountShell>
  )
}

function FilterButton({ item, current, setFilter }) {
  return (
    <button className={current === item ? 'is-active' : ''} onClick={() => setFilter(item)} type="button">
      {item}
    </button>
  )
}

function OrderCard({ order }) {
  return (
    <article className="order-card">
      <header>
        <div className="order-card__meta">
          <strong>{order.id}</strong>
          <img src={accountIcons.dot} alt="" />
          <span>{order.date}</span>
        </div>
        <span className={`order-status order-status--${order.tone}`}>{order.status}</span>
      </header>
      <div className="order-card__body">
        <div className="order-card__thumb">{order.thumb}</div>
        <div className="order-card__product">
          <strong>{order.product}</strong>
          <span>{order.detail}</span>
        </div>
        <div className="order-card__price">
          <span>Total</span>
          <strong>{order.total}</strong>
        </div>
        <div className="order-card__actions">
          <a className="account-btn account-btn--outline account-btn--detail" href="/order-status">Lihat Detail</a>
          {order.action && <a className="account-btn account-btn--primary account-btn--order-action" href="/order-status">{order.action}</a>}
        </div>
      </div>
    </article>
  )
}

export function AccountOrdersPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Semua')
  const primaryFilters = ['Semua', 'Belum Dibayar', 'Diproses', 'Dikirim', 'Selesai']
  const attentionFilters = ['Perlu Tindakan', 'Bermasalah']

  const visibleOrders = useMemo(() => orders.filter((order) => {
    const normalizedFilter = filter.toUpperCase()
    const statusMatch = filter === 'Semua'
      || (filter === 'Belum Dibayar' && order.status === 'BELUM DIBAYAR')
      || order.status === normalizedFilter
    const queryMatch = !query || `${order.id} ${order.product}`.toLowerCase().includes(query.toLowerCase())
    return statusMatch && queryMatch
  }), [query, filter])

  return (
    <AccountShell active="orders" tall>
      <PageHeader title="Pesanan Saya" description="Pantau pesanan aktif dan riwayat selesai dalam satu tempat." />
      <div className="active-order-callout">
        <span className="active-order-callout__icon"><img src={accountIcons.info} alt="" /></span>
        <div>
          <strong>2 pesanan masih aktif</strong>
          <span>1 menunggu pembayaran · 1 sedang diproses</span>
        </div>
      </div>
      <div className="order-tools">
        <label className="order-search">
          <img src={accountIcons.search} alt="" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari ID pesanan atau produk" />
        </label>
        <div className="order-filters">
          <span className="order-filters__label">Status</span>
          {primaryFilters.map((item) => <FilterButton item={item} current={filter} setFilter={setFilter} key={item} />)}
          <i aria-hidden="true" />
          <span className="order-filters__label">Butuh perhatian</span>
          {attentionFilters.map((item) => <FilterButton item={item} current={filter} setFilter={setFilter} key={item} />)}
        </div>
      </div>
      <div className="order-list">
        {visibleOrders.map((order) => <OrderCard order={order} key={order.id} />)}
        {visibleOrders.length === 0 && <div className="account-empty-state">Tidak ada pesanan yang cocok dengan filter ini.</div>}
      </div>
    </AccountShell>
  )
}

function AddressRow({ label, value }) {
  return <div className="address-row"><span>{label}</span><strong>{value}</strong></div>
}

export function AccountAddressesPage() {
  return (
    <AccountShell active="addresses">
      <PageHeader
        title="Alamat"
        description="Kelola alamat yang dipakai untuk pengiriman merchandise."
        action={<button className="account-btn account-btn--primary account-btn--add" type="button">+ Tambah Alamat</button>}
      />
      <section className="address-card">
        <header>
          <div>
            <h2>Rumah · Alamat Utama</h2>
            <p>Muhammad · 0812 3456 7878</p>
          </div>
          <button className="account-btn account-btn--outline account-btn--small" type="button">Ubah</button>
        </header>
        <AddressRow label="Provinsi" value="Kalimantan Barat" />
        <AddressRow label="Kota / Kabupaten" value="Kota Pontianak" />
        <AddressRow label="Kecamatan" value="Pontianak Barat" />
        <AddressRow label="Kode Pos" value="78113" />
        <AddressRow label="Alamat Lengkap" value="Jl. Tabrani Ahmad Gg Setara" />
      </section>
    </AccountShell>
  )
}

export function AccountFavoritesPage() {
  const [favorites, setFavorites] = useState(favoriteSeed)

  return (
    <AccountShell active="favorites">
      <PageHeader title="Favorit" description="Produk yang kamu simpan untuk dibuka kembali dengan cepat." />
      <div className="favorite-grid">
        {favorites.map((item) => (
          <article className="favorite-card" key={item.id}>
            <div className="favorite-card__image">{item.code}</div>
            <h2>{item.name}</h2>
            <p>{item.type}</p>
            <strong>{item.price}</strong>
            <div className="favorite-card__actions">
              <button
                className="account-btn account-btn--outline"
                type="button"
                onClick={() => setFavorites((items) => items.filter((favorite) => favorite.id !== item.id))}
              >
                Hapus Favorit
              </button>
              <a className="account-btn account-btn--primary" href={item.href}>Lihat Produk</a>
            </div>
          </article>
        ))}
        {favorites.length === 0 && <div className="favorite-empty">Belum ada produk favorit.</div>}
      </div>
    </AccountShell>
  )
}
