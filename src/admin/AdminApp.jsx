import { useEffect, useMemo, useRef, useState } from 'react'
import { cmsRequest, getAdminSession, loginAdmin, logoutAdmin } from './api'
import ProviderMappingPage from './ProviderMappingPage'
import { GameAccountSchemaEditor, GameAccountListingEditor } from './GameAccountEditor'
import { attributeKeyFromLabel } from './gameAccountValues'
import DiscountVouchersPage from './DiscountVouchersPage'
import BannerPage from './BannerPage'
import HomeLayoutPage from './HomeLayoutPage'
import { searchProductHref } from '../services/navbarSearchHelpers'
import CatalogImageField, { discardCatalogAssets } from './CatalogImageField'
import VariantPricingTable from './VariantPricingTable'
import { variantPriceWarning } from './variantPriceWarnings'
import GameVoucherInventory from './GameVoucherInventory'
import OrdersOperationsPage from './OrdersOperationsPage'
import FlashSaleAdminPage from './FlashSaleAdminPage'
import { toWibInput, wibInputToIso } from './flashSaleAdminUtils'
import { PRODUCT_EDITOR_FIELDS, mergeProductTab, isProductTabDirty } from './productEditorTabs'
import {
  AlertCircle, ArrowRight, ChevronDown, Clock3, CreditCard, ExternalLink,
  FileText, Image, LayoutDashboard, LogOut, Menu, Package, PanelsTopLeft,
  Settings, ShoppingBag, Tags, TicketPercent, X, Zap,
  AlertTriangle, ArrowLeft, ChevronRight, MoreHorizontal, Search, Star,
} from 'lucide-react'
import { getDashboardCounts, getRecentOrders } from './dashboardData'
import './order-destination.css'
import './catalog-ux.css'
import './product-editor-tabs.css'
import './product-variant-table.css'

const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '')

const NAV = [
  ['dashboard', 'Dashboard'],
  ['orders', 'Pesanan'],
  ['catalog', 'Katalog'],
  ['homepage', 'Banner'],
  ['home-layout', 'Susunan Beranda'],
  ['flash-sale', 'Flash Sale'],
  ['articles', 'Artikel'],
  ['promotions', 'Promosi'],
  ['discount-vouchers', 'Voucher'],
  ['site', 'Pengaturan'],
  ['provider-mapping', 'Integrasi Penyedia'],
]

const PRODUCT_KINDS = ['TopUpGame', 'TopUpLogin', 'GameVoucher', 'Joki', 'Merchandise', 'GameAccount']
const PRODUCT_LABELS = {
  TopUpGame: 'Top Up Game', TopUpLogin: 'Top Up menggunakan Login', GameVoucher: 'Voucher Game',
  Joki: 'Joki Game', GameAccount: 'Akun Game', Merchandise: 'Merchandise',
}
const FULFILLMENT_LABELS = {
  AUTO_ID: 'Diproses otomatis berdasarkan ID game',
  MANUAL_LOGIN: 'Diproses oleh admin melalui alur login resmi',
  MANUAL: 'Diproses secara manual oleh admin',
}
const INPUT_FIELD_TYPES = ['Text', 'Password', 'Email', 'Number', 'Select']
const fulfillmentForKind = (kind) => kind === 'TopUpGame' ? 'AUTO_ID' : kind === 'TopUpLogin' ? 'MANUAL_LOGIN' : 'MANUAL'
const FOOTER_GROUPS = ['Page', 'Support', 'Legality']

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))
const date = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const toInputDate = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''
const toIso = (value) => value ? new Date(value).toISOString() : null
const numberOrNull = (value) => value === '' || value == null ? null : Number(value)
const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function routeFromHash() {
  const value = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  return NAV.some(([id]) => id === value) ? value : 'dashboard'
}

function useRoute() {
  const [route, setRoute] = useState(routeFromHash)
  useEffect(() => {
    const handler = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return [route, (next) => { window.location.hash = `/${next}` }]
}

function Field({ label, hint, children, wide = false }) {
  return <label className={`admin-field${wide ? ' admin-field--wide' : ''}`}>
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
}

function TextInput(props) { return <input {...props} /> }
function TextArea(props) { return <textarea rows={4} {...props} /> }
function Select({ options, ...props }) { return <select {...props}>{options.map((option) => <option value={option.value ?? option} key={option.value ?? option}>{option.label ?? option}</option>)}</select> }

function Toggle({ checked, onChange, label }) {
  return <label className="admin-toggle"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} /><span /><b>{label}</b></label>
}

function Button({ children, tone = 'primary', ...props }) {
  return <button className={`admin-button admin-button--${tone}`} type="button" {...props}>{children}</button>
}

function PageHeader({ eyebrow, title, description, action }) {
  return <header className="admin-page-header"><div><small>{eyebrow}</small><h1>{title}</h1><p>{description}</p></div>{action}</header>
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`admin-panel ${className}`}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>{children}</section>
}

function Empty({ text = 'No data yet.' }) { return <div className="admin-empty">{text}</div> }
function ErrorBox({ error }) { return error ? <div className="admin-error">{error}</div> : null }
function Notice({ message }) { return message ? <div className="admin-notice">{message}</div> : null }
function Pill({ value }) { return <span className={`admin-pill admin-pill--${String(value || '').toLowerCase()}`}>{String(value ?? '—')}</span> }

function Modal({ title, onClose, children, wide = false }) {
  return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className={`admin-modal${wide ? ' admin-modal--wide' : ''}`}>
      <header><h2>{title}</h2><button type="button" onClick={onClose}>×</button></header>
      <div className="admin-modal-body">{children}</div>
    </div>
  </div>
}

function useCatalogUnsavedGuard(dirty) {
  useEffect(() => {
    if (!dirty) return undefined
    const initialHash = window.location.hash
    let restoring = false
    const beforeUnload = (event) => event.preventDefault()
    const onHashChange = () => {
      if (restoring) { restoring = false; return }
      if (!window.confirm('Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?')) {
        restoring = true
        window.location.hash = initialHash
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [dirty])
}

function useCatalogAssetCleanup(assets) {
  const currentAssets = useRef(assets)
  const handled = useRef(false)
  useEffect(() => { currentAssets.current = assets }, [assets])
  useEffect(() => () => { if (!handled.current) void discardCatalogAssets(currentAssets.current) }, [])
  return () => { handled.current = true }
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try { onLogin(await loginAdmin(email, password)) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return <main className="admin-login-shell">
    <section className="admin-login-card">
      <div className="admin-login-brand"><span>Z</span><div><b>Zetruv</b><small>Admin Console</small></div></div>
      <div className="admin-login-copy"><small>SECURE CMS ACCESS</small><h1>Run Zetruv from one place.</h1><p>Manage storefront content, catalog, promotions, articles, orders, and site settings using the live Zetruv backend.</p></div>
      <form onSubmit={submit}>
        <ErrorBox error={error} />
        <Field label="Email"><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></Field>
        <button className="admin-login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to Admin'}</button>
      </form>
      <p className="admin-login-foot">JWT session · Zetruv CMS API · Admin role required</p>
    </section>
    <aside className="admin-login-art"><div className="admin-login-orbit"><i /><i /><i /></div><div><span>LIVE CONTROL</span><strong>Content → Catalog → Order</strong><p>Separate admin build. Same backend. Storefront deployment stays isolated.</p></div></aside>
  </main>
}

function Shell({ session, onLogout }) {
  const [route, navigate] = useRoute()
  const [storeOpen, setStoreOpen] = useState(() => ['homepage', 'home-layout', 'flash-sale', 'articles'].includes(route))
  const [mobileOpen, setMobileOpen] = useState(false)
  const storeActive = ['homepage', 'home-layout', 'flash-sale', 'articles'].includes(route)
  useEffect(() => {
    if (storeActive) setStoreOpen(true)
  }, [storeActive])
  useEffect(() => {
    if (!mobileOpen) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])
  const goTo = (next) => { navigate(next); setMobileOpen(false) }
  const navButton = (id, label, Icon, nested = false) => (
    <button key={id} type="button" className={`${route === id ? 'is-active' : ''}${nested ? ' admin-nav-child' : ''}`}
      aria-current={route === id ? 'page' : undefined} onClick={() => goTo(id)}>
      {!nested && <i><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></i>}<span>{label}</span>
    </button>
  )
  const page = {
    dashboard: <Dashboard onNavigate={goTo} />,
    homepage: <BannerPage storefrontUrl={STOREFRONT_URL} />,
    'home-layout': <HomeLayoutPage storefrontUrl={STOREFRONT_URL} />,
    catalog: <CatalogPage />,
    'provider-mapping': <ProviderMappingPage />,
    promotions: <PromotionsPage />,
    'flash-sale': <FlashSaleAdminPage />,
    'discount-vouchers': <DiscountVouchersPage />,
    articles: <ArticlesPage />,
    orders: <OrdersOperationsPage />,
    site: <SitePage />,
  }[route]

  return <div className="admin-shell">
    {mobileOpen && <button type="button" className="admin-mobile-scrim" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--open' : ''}`}>
      <div className="admin-brand"><span>Z</span><div><strong>Zetruv</strong><small>Admin Panel</small></div><button className="admin-sidebar-close" type="button" aria-label="Tutup menu" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
      <nav aria-label="Navigasi admin">
        {navButton('dashboard', 'Dashboard', LayoutDashboard)}
        {navButton('orders', 'Pesanan', ShoppingBag)}
        {navButton('catalog', 'Katalog', Package)}
        <div className="admin-nav-group">
          <button type="button" className={`admin-nav-group-toggle${storeActive ? ' is-group-active' : ''}`} aria-expanded={storeOpen} aria-controls="admin-store-nav" onClick={() => setStoreOpen((open) => !open)}>
            <i><PanelsTopLeft aria-hidden="true" size={18} strokeWidth={1.8} /></i><span>Tampilan Toko</span><ChevronDown className="admin-nav-chevron" aria-hidden="true" size={16} />
          </button>
          {storeOpen && <div id="admin-store-nav" className="admin-nav-children">
            {navButton('homepage', 'Banner', Image, true)}
            {navButton('home-layout', 'Susunan Beranda', PanelsTopLeft, true)}
            {navButton('flash-sale', 'Flash Sale', Zap, true)}
            {navButton('articles', 'Artikel', FileText, true)}
          </div>}
        </div>
        {navButton('promotions', 'Promosi', Tags)}
        {navButton('discount-vouchers', 'Voucher', TicketPercent)}
        <div className="admin-nav-separator" />
        {navButton('site', 'Pengaturan', Settings)}
      </nav>
      <div className="admin-user"><div className="admin-user-avatar">{session.email?.[0]?.toUpperCase() || 'A'}</div><div><strong>{session.email}</strong><small>{session.role}</small></div><button type="button" title="Keluar" aria-label="Keluar" onClick={onLogout}><LogOut size={18} /></button></div>
    </aside>
    <main className="admin-main"><div className="admin-topbar">
      <button className="admin-menu-toggle" type="button" aria-label="Buka menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
      <span className="admin-env-badge">Mode Uji</span>
      {STOREFRONT_URL && <a href={STOREFRONT_URL} target="_blank" rel="noreferrer">Lihat Toko <ExternalLink aria-hidden="true" size={14} /></a>}
    </div>{page}</main>
  </div>
}

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [partialError, setPartialError] = useState(false)
  useEffect(() => {
    let mounted = true
    const endpoints = {
      heroes: '/homepage/heroes', products: '/catalog/products', promotions: '/promotions',
      orders: '/orders?page=1&pageSize=5',
      processing: '/orders?page=1&pageSize=1&status=Processing',
      paidPending: '/orders?page=1&pageSize=1&status=Pending&paymentStatus=Paid',
      paymentFailed: '/orders?page=1&pageSize=1&paymentStatus=Failed',
    }
    Promise.allSettled(Object.entries(endpoints).map(async ([key, path]) => [key, await cmsRequest(path)]))
      .then((results) => {
        if (!mounted) return
        const available = Object.fromEntries(results.filter((result) => result.status === 'fulfilled').map((result) => result.value))
        setPartialError(results.some((result) => result.status === 'rejected'))
        setStats({ ...getDashboardCounts(available), orders: getRecentOrders(available.orders) })
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const cards = stats ? [
    { label: 'Total Pesanan', value: stats.totalOrders, description: 'Lihat pesanan', icon: ShoppingBag, route: 'orders' },
    { label: 'Total Produk', value: stats.totalProducts, description: 'Kelola katalog', icon: Package, route: 'catalog' },
    { label: 'Promo Aktif', value: stats.activePromotions, description: 'Kelola promosi', icon: Tags, route: 'promotions' },
    { label: 'Banner Terdaftar', value: stats.totalBanners, description: 'Kelola banner', icon: Image, route: 'homepage' },
  ].filter((item) => item.value !== null) : []
  const alerts = stats ? [
    { label: 'Menunggu diproses', value: stats.paidPendingOrders, icon: Clock3, route: 'orders/paid-pending' },
    { label: 'Sedang diproses', value: stats.processingOrders, icon: ShoppingBag, route: 'orders/processing' },
    { label: 'Pembayaran gagal', value: stats.failedPayments, icon: CreditCard, route: 'orders/payment-failed' },
  ].filter((item) => item.value !== null) : []
  const activeAlerts = alerts.filter((item) => item.value > 0)
  const shortcuts = [
    { title: 'Banner', helper: 'Atur tampilan', icon: Image, route: 'homepage' },
    { title: 'Flash Sale', helper: 'Atur promo kilat', icon: Zap, route: 'flash-sale' },
    { title: 'Artikel', helper: 'Kelola konten', icon: FileText, route: 'articles' },
  ]

  return <div className="admin-page admin-dashboard"><PageHeader title="Dashboard" description="Ringkasan aktivitas toko" />
    {loading ? <div className="admin-loading" role="status">Memuat ringkasan toko…</div> : <>
      {partialError && <div className="admin-dashboard-warning" role="status"><AlertCircle size={17} /> Sebagian data belum bisa dimuat. Angka yang tidak tersedia disembunyikan.</div>}
      {alerts.length > 0 && <section className="admin-dashboard-attention" aria-labelledby="admin-attention-heading">
        <div className="admin-section-heading"><div><h2 id="admin-attention-heading">Perlu Perhatian</h2><p>Status pesanan dari sistem</p></div></div>
        {activeAlerts.length > 0 ? <div className="admin-attention-grid">{activeAlerts.map(({ label, value, icon: Icon, route }) => <button type="button" key={label} onClick={() => onNavigate(route)} className="admin-attention-card"><Icon size={19} aria-hidden="true" /><span>{label}</span><strong>{value}</strong><ArrowRight size={17} aria-hidden="true" /></button>)}</div> : <p className="admin-attention-clear">Tidak ada pesanan yang perlu ditangani pada status yang tersedia.</p>}
      </section>}
      {cards.length > 0 && <section aria-labelledby="admin-summary-heading">
        <div className="admin-section-heading"><div><h2 id="admin-summary-heading">Ringkasan Toko</h2><p>Seluruh data yang tercatat</p></div></div>
        <div className="admin-stat-grid">{cards.map(({ label, value, description, icon: Icon, route }) => <button type="button" className="admin-stat-card" key={label} onClick={() => onNavigate(route)} aria-label={`${label}: ${value}. ${description}`}>
          <div><small>{label}</small><strong>{value}</strong><span>{description} <ArrowRight size={13} aria-hidden="true" /></span></div><i><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></i>
        </button>)}</div>
      </section>}
      <Panel className="admin-recent-orders" title="Pesanan Terbaru" action={<button type="button" className="admin-inline-link" onClick={() => onNavigate('orders')}>Lihat Semua <ArrowRight size={15} aria-hidden="true" /></button>}>
        {!stats.orders ? <div className="admin-empty">Data pesanan belum tersedia. Coba buka halaman Pesanan.</div> : stats.orders.length === 0 ? <div className="admin-empty">Belum ada pesanan. Pesanan baru akan muncul di sini.</div> : <div className="admin-table-wrap"><table><thead><tr><th>Pesanan</th><th>Total</th><th>Status</th><th>Pembayaran</th><th /></tr></thead><tbody>{stats.orders.map((order) => <tr key={order.id}>
          <td><strong>{order.orderNumber || 'Pesanan'}</strong><small>{date(order.createdAt)}</small></td><td>{money(order.grandTotal)}</td><td><Pill value={order.status} /></td><td><Pill value={order.paymentStatus} /></td><td><button className="admin-inline-link" type="button" onClick={() => onNavigate(`orders/${encodeURIComponent(order.id)}`)}>Detail <ArrowRight size={14} aria-hidden="true" /></button></td>
        </tr>)}</tbody></table></div>}
      </Panel>
      <Panel title="Kelola Toko" subtitle="Akses cepat untuk memperbarui konten toko" className="admin-shortcuts"><div className="admin-shortcuts-grid">{shortcuts.map(({ title, helper, icon: Icon, route }) => <button type="button" key={title} onClick={() => onNavigate(route)}><i><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></i><strong>{title}</strong><span>{helper}</span><ArrowRight size={17} className="admin-shortcut-arrow" aria-hidden="true" /></button>)}</div></Panel>
    </>}
  </div>
}

const blankHero = { title: '', subtitle: '', imageUrl: '', primaryCtaLabel: '', primaryCtaUrl: '', secondaryCtaLabel: '', secondaryCtaUrl: '', isActive: true, sortOrder: 0, startsAt: '', endsAt: '' }
function HeroForm({ item, onDone }) {
  const [form, setForm] = useState(item ? { ...item, startsAt: toInputDate(item.startsAt), endsAt: toInputDate(item.endsAt) } : blankHero)
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    const payload = { ...form, sortOrder: Number(form.sortOrder || 0), startsAt: toIso(form.startsAt), endsAt: toIso(form.endsAt) }
    delete payload.id; delete payload.createdAt; delete payload.updatedAt
    try { await cmsRequest(item ? `/homepage/heroes/${item.id}` : '/homepage/heroes', { method: item ? 'PUT' : 'POST', body: JSON.stringify(payload) }); onDone() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Title" wide><TextInput value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field><Field label="Subtitle" wide><TextArea value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} required /></Field><Field label="Banner image URL" wide><TextInput value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} required /></Field><Field label="Primary CTA label"><TextInput value={form.primaryCtaLabel || ''} onChange={(e) => set('primaryCtaLabel', e.target.value)} /></Field><Field label="Primary CTA URL"><TextInput value={form.primaryCtaUrl || ''} onChange={(e) => set('primaryCtaUrl', e.target.value)} /></Field><Field label="Secondary CTA label"><TextInput value={form.secondaryCtaLabel || ''} onChange={(e) => set('secondaryCtaLabel', e.target.value)} /></Field><Field label="Secondary CTA URL"><TextInput value={form.secondaryCtaUrl || ''} onChange={(e) => set('secondaryCtaUrl', e.target.value)} /></Field><Field label="Starts at"><TextInput type="datetime-local" value={form.startsAt || ''} onChange={(e) => set('startsAt', e.target.value)} /></Field><Field label="Ends at"><TextInput type="datetime-local" value={form.endsAt || ''} onChange={(e) => set('endsAt', e.target.value)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(value) => set('isActive', value)} label="Active" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Saving…' : 'Save hero'}</button></div></form>
}

function SectionForm({ item, onDone }) {
  const [form, setForm] = useState({ ...item }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function save(event) { event.preventDefault(); setBusy(true); setError(''); try { await cmsRequest(`/homepage/sections/${item.key}`, { method: 'PUT', body: JSON.stringify({ title: form.title, subtitle: form.subtitle || null, ctaLabel: form.ctaLabel || null, ctaUrl: form.ctaUrl || null, isEnabled: form.isEnabled, sortOrder: Number(form.sortOrder || 0), itemLimit: Number(form.itemLimit || 1) }) }); onDone() } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Section key"><TextInput value={form.key} disabled /></Field><Field label="Title"><TextInput value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field><Field label="Subtitle" wide><TextArea value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></Field><Field label="CTA label"><TextInput value={form.ctaLabel || ''} onChange={(e) => set('ctaLabel', e.target.value)} /></Field><Field label="CTA URL"><TextInput value={form.ctaUrl || ''} onChange={(e) => set('ctaUrl', e.target.value)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field><Field label="Item limit"><TextInput type="number" min="1" max="50" value={form.itemLimit} onChange={(e) => set('itemLimit', e.target.value)} /></Field><Field label="Status"><Toggle checked={form.isEnabled} onChange={(value) => set('isEnabled', value)} label="Enabled" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Saving…' : 'Save section'}</button></div></form>
}

function HomepagePage() {
  const [heroes, setHeroes] = useState([]); const [sections, setSections] = useState([]); const [editingHero, setEditingHero] = useState(undefined); const [editingSection, setEditingSection] = useState(null); const [error, setError] = useState('')
  async function load() { setError(''); try { const [h, s] = await Promise.all([cmsRequest('/homepage/heroes'), cmsRequest('/homepage/sections')]); setHeroes(h); setSections(s) } catch (err) { setError(err.message) } }
  useEffect(() => { load() }, [])
  async function removeHero(item) { if (!confirm(`Delete hero “${item.title}”?`)) return; try { await cmsRequest(`/homepage/heroes/${item.id}`, { method: 'DELETE' }); load() } catch (err) { setError(err.message) } }
  return <div className="admin-page"><PageHeader eyebrow="CONTENT" title="Homepage" description="Manage the live homepage banners and section configuration exposed by GET /api/v1/homepage." action={<Button onClick={() => setEditingHero(null)}>+ New hero</Button>} /><ErrorBox error={error} />
    <Panel title="Hero banners" subtitle="Scheduled banners, CTA links, ordering, and visibility"><div className="admin-card-list">{heroes.length ? heroes.map((item) => <article className="admin-row-card" key={item.id}><div className="admin-thumb">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : '◫'}</div><div className="admin-row-card-copy"><div><strong>{item.title}</strong><Pill value={item.isActive ? 'Active' : 'Inactive'} /></div><p>{item.subtitle}</p><small>Sort {item.sortOrder} · {item.startsAt ? `Starts ${date(item.startsAt)}` : 'Always available'}</small></div><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditingHero(item)}>Edit</Button><Button tone="danger" onClick={() => removeHero(item)}>Delete</Button></div></article>) : <Empty text="No hero banners configured." />}</div></Panel>
    <Panel title="Homepage sections" subtitle="Titles, CTA text, ordering, visibility, and item limits"><div className="admin-table-wrap"><table><thead><tr><th>Key</th><th>Title</th><th>Status</th><th>Limit</th><th>Order</th><th /></tr></thead><tbody>{sections.map((item) => <tr key={item.key}><td><code>{item.key}</code></td><td><strong>{item.title}</strong><small>{item.subtitle}</small></td><td><Pill value={item.isEnabled ? 'Enabled' : 'Disabled'} /></td><td>{item.itemLimit}</td><td>{item.sortOrder}</td><td><Button tone="ghost" onClick={() => setEditingSection(item)}>Edit</Button></td></tr>)}</tbody></table></div></Panel>
    {editingHero !== undefined && <Modal title={editingHero ? 'Edit hero banner' : 'Create hero banner'} onClose={() => setEditingHero(undefined)} wide><HeroForm item={editingHero} onDone={() => { setEditingHero(undefined); load() }} /></Modal>}
    {editingSection && <Modal title={`Edit ${editingSection.key}`} onClose={() => setEditingSection(null)}><SectionForm item={editingSection} onDone={() => { setEditingSection(null); load() }} /></Modal>}
  </div>
}

function CategoryForm({ item, hasProducts, onDone, onCancel, onDirtyChange }) {
  const initial = useMemo(() => item || { key: '', name: '', slug: '', description: '', iconUrl: '', kind: 'TopUpGame', isActive: true, sortOrder: 0 }, [item])
  const [form, setForm] = useState(initial)
  const [assets, setAssets] = useState([])
  const markAssetsHandled = useCatalogAssetCleanup(assets)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [imageReady, setImageReady] = useState(!initial.iconUrl)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])
  useCatalogUnsavedGuard(dirty)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function cancel() {
    if (dirty && !confirm('Perubahan kategori belum disimpan. Batalkan?')) return
    await discardCatalogAssets(assets)
    markAssetsHandled()
    onCancel()
  }
  async function save(event) {
    event.preventDefault(); setError(''); setBusy(true)
    if (form.iconUrl && !imageReady) { setError('Ikon kategori tidak dapat dimuat. Unggah gambar pengganti.'); setBusy(false); return }
    const slug = item?.slug || slugify(form.name)
    try {
      await cmsRequest(item ? `/catalog/categories/${item.id}` : '/catalog/categories', {
        method: item ? 'PUT' : 'POST',
        body: JSON.stringify({ key: item?.key || slug.replaceAll('-', '_'), name: form.name.trim(), slug,
          description: form.description || null, iconUrl: form.iconUrl || null,
          kind: form.kind, isActive: form.isActive, sortOrder: Number(form.sortOrder || 0) }),
      })
      await discardCatalogAssets(assets, form.iconUrl)
      markAssetsHandled()
      onDone()
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <form className="catalog-compact-form" onSubmit={save}>
    <ErrorBox error={error} />
    <Field label="Nama Kategori"><TextInput value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} required placeholder="Contoh: Top Up Game" /></Field>
    <Field label="Jenis Produk" hint={hasProducts ? 'Jenis dikunci karena kategori sudah digunakan oleh produk.' : 'Jenis menentukan pengaturan produk dalam kategori ini.'}>
      <Select disabled={Boolean(hasProducts)} value={form.kind} onChange={(e) => set('kind', e.target.value)} options={PRODUCT_KINDS.map((value) => ({ value, label: PRODUCT_LABELS[value] }))} />
    </Field>
    <CatalogImageField compact title="Ikon Kategori" value={form.iconUrl} onChange={(value) => set('iconUrl', value)} onValidityChange={setImageReady} onUploaded={(asset) => setAssets((previous) => [...previous, asset])} />
    <Field label="Deskripsi (opsional)"><TextArea rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Jelaskan kategori secara singkat…" /></Field>
    <Toggle checked={form.isActive} onChange={(value) => set('isActive', value)} label="Tampilkan di Toko" />
    <div className="catalog-editor-footer"><Button tone="ghost" onClick={cancel}>Batal</Button><button className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Menyimpan…' : item ? 'Simpan Perubahan' : 'Tambah Kategori'}</button></div>
  </form>
}

function GameForm({ item, onDone, onCancel, onDirtyChange }) {
  const initial = useMemo(() => item || { name: '', slug: '', publisher: '', imageUrl: '', isActive: true, isPopular: false, sortOrder: 0 }, [item])
  const [form, setForm] = useState(initial)
  const [assets, setAssets] = useState([])
  const markAssetsHandled = useCatalogAssetCleanup(assets)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [imageReady, setImageReady] = useState(!initial.imageUrl)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])
  useCatalogUnsavedGuard(dirty)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function cancel() {
    if (dirty && !confirm('Perubahan game belum disimpan. Batalkan?')) return
    await discardCatalogAssets(assets)
    markAssetsHandled()
    onCancel()
  }
  async function save(event) {
    event.preventDefault(); setError(''); setBusy(true)
    if (form.imageUrl && !imageReady) { setError('Logo game tidak dapat dimuat. Unggah gambar pengganti.'); setBusy(false); return }
    try {
      await cmsRequest(item ? `/catalog/games/${item.id}` : '/catalog/games', {
        method: item ? 'PUT' : 'POST',
        body: JSON.stringify({ name: form.name.trim(), slug: item?.slug || slugify(form.name),
          publisher: form.publisher || null, imageUrl: form.imageUrl || null,
          isActive: form.isActive, isPopular: form.isPopular, sortOrder: Number(form.sortOrder || 0) }),
      })
      await discardCatalogAssets(assets, form.imageUrl)
      markAssetsHandled()
      onDone()
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <form className="catalog-compact-form" onSubmit={save}>
    <ErrorBox error={error} />
    <Field label="Nama Game"><TextInput value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} required placeholder="Contoh: Mobile Legends: Bang Bang" /></Field>
    <Field label="Penerbit (opsional)"><TextInput value={form.publisher || ''} onChange={(e) => set('publisher', e.target.value)} placeholder="Contoh: Moonton" /></Field>
    <CatalogImageField compact title="Logo Game" value={form.imageUrl} onChange={(value) => set('imageUrl', value)} onValidityChange={setImageReady} onUploaded={(asset) => setAssets((previous) => [...previous, asset])} />
    <Toggle checked={form.isActive} onChange={(value) => set('isActive', value)} label="Tampilkan di Toko" />
    <Toggle checked={form.isPopular} onChange={(value) => set('isPopular', value)} label="Tampilkan sebagai Game Populer" />
    <div className="catalog-editor-footer"><Button tone="ghost" onClick={cancel}>Batal</Button><button className="admin-button admin-button--primary" disabled={busy}>{busy ? 'Menyimpan…' : item ? 'Simpan Perubahan' : 'Tambah Game'}</button></div>
  </form>
}

function VariantEditor({ productId, detail, onReload, section = 'variants' }) {
  const [editing, setEditing] = useState(undefined); const [imageEditing, setImageEditing] = useState(undefined); const [fieldEditing, setFieldEditing] = useState(undefined); const [voucherVariant, setVoucherVariant] = useState(null); const [error, setError] = useState('')
  async function saveVariant(form, id, assets = [], markHandled) { const managedVoucherStock = detail.kind === 'GameVoucher'; const body = { name: form.name, sku: form.sku, price: Number(form.price), compareAtPrice: numberOrNull(form.compareAtPrice), stockQuantity: managedVoucherStock ? 0 : numberOrNull(form.stockQuantity), weightGrams: numberOrNull(form.weightGrams), groupName: form.groupName?.trim() || null, iconUrl: form.iconUrl?.trim() || null, isActive: form.isActive, sortOrder: Number(form.sortOrder || 0) }; try { await cmsRequest(id ? `/catalog/products/${productId}/variants/${id}` : `/catalog/products/${productId}/variants`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); await discardCatalogAssets(assets, form.iconUrl); markHandled?.(); setEditing(undefined); onReload() } catch (err) { setError(err.message) } }
  async function saveImage(form, id, assets = [], markHandled) { try { await cmsRequest(id ? `/catalog/products/${productId}/images/${id}` : `/catalog/products/${productId}/images`, { method: id ? 'PUT' : 'POST', body: JSON.stringify({ url: form.url, altText: form.altText || null, sortOrder: Number(form.sortOrder || 0) }) }); await discardCatalogAssets(assets, form.url); markHandled?.(); setImageEditing(undefined); onReload() } catch (err) { setError(err.message) } }
  async function saveInputField(form, id) {
    const scope = detail.fulfillmentMethod === 'AUTO_ID' ? 'AccountValidation' : 'LoginCredential'
    const isSensitive = detail.fulfillmentMethod === 'AUTO_ID' ? false : form.type === 'Password' ? true : Boolean(form.isSensitive)
    const options = form.type === 'Select' ? String(form.optionsText || '').split(/[,\n]/).map((value) => value.trim()).filter(Boolean) : []
    const body = { key: id ? form.key : attributeKeyFromLabel(form.label, detail.inputFields?.map((entry) => entry.key)), label: form.label, scope, type: form.type, placeholder: form.placeholder || null, helpText: form.helpText || null, isRequired: Boolean(form.isRequired), isSensitive, maxLength: Number(form.maxLength || 200), options, sortOrder: Number(form.sortOrder || 0) }
    try { await cmsRequest(id ? `/catalog/products/${productId}/input-fields/${id}` : `/catalog/products/${productId}/input-fields`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); setFieldEditing(undefined); onReload() } catch (err) { setError(err.message) }
  }
  async function disableVariant(item) { if (!confirm(`Nonaktifkan varian ${item.name}? Data penjualan lama tetap tersimpan.`)) return; try { await cmsRequest(`/catalog/products/${productId}/variants/${item.id}`, { method: 'DELETE' }); onReload() } catch (err) { setError(err.message) } }
  async function deleteImage(item) { if (!confirm('Hapus gambar dari galeri produk ini?')) return; try { await cmsRequest(`/catalog/products/${productId}/images/${item.id}`, { method: 'DELETE' }); onReload() } catch (err) { setError(err.message) } }
  async function deleteInputField(item) { if (!confirm(`Nonaktifkan informasi ${item.label}?`)) return; try { await cmsRequest(`/catalog/products/${productId}/input-fields/${item.id}`, { method: 'DELETE' }); onReload() } catch (err) { setError(err.message) } }
  const supportsInputSchema = detail.fulfillmentMethod === 'AUTO_ID' || detail.fulfillmentMethod === 'MANUAL_LOGIN'
  return <div className="admin-product-subresources"><ErrorBox error={error} />
    {section === 'variants' && <Panel title="Harga & Varian" subtitle="Kelola nominal, harga, dan ketersediaan produk." action={<Button tone="ghost" onClick={() => setEditing(null)}>+ Tambah Varian</Button>}>
      <VariantPricingTable variants={detail.variants || []} kind={detail.kind} onEdit={setEditing} onDisable={disableVariant} onVoucher={setVoucherVariant} />
    </Panel>}
    {section === 'images' && <Panel title="Galeri Produk" subtitle="Gambar tambahan yang dapat dilihat pelanggan" action={<Button tone="ghost" onClick={() => setImageEditing(null)}>+ Unggah Gambar</Button>}>
      {detail.images?.length ? <div className="admin-image-grid">{detail.images.map((image) => <article key={image.id}>{image.url ? <img src={image.url} alt={image.altText || ''} /> : <span>Gambar</span>}
        <div><small>{image.altText || 'Tanpa keterangan'}</small><div><Button tone="ghost" onClick={() => setImageEditing(image)}>Ubah</Button><Button tone="danger" onClick={() => deleteImage(image)}>Hapus</Button></div></div></article>)}</div>
      : <div className="catalog-editor-empty"><Image size={28} /><strong>Belum ada gambar tambahan</strong><p>Unggah gambar lain agar pembeli bisa melihat produk dari beberapa sisi.</p><Button onClick={() => setImageEditing(null)}>Unggah Gambar</Button></div>}
    </Panel>}
    {section === 'inputs' && supportsInputSchema && <Panel title="Informasi yang Diisi Pembeli" subtitle={detail.fulfillmentMethod === 'AUTO_ID' ? 'Informasi akun nonrahasia untuk validasi sebelum pemesanan' : 'Data login dikumpulkan hanya saat checkout melalui proses aman'} action={<Button tone="ghost" onClick={() => setFieldEditing(null)}>+ Tambah Isian</Button>}>
      <div className="admin-mini-list">{detail.inputFields?.length ? detail.inputFields.map((item) => <div key={item.id}><div><strong>{item.label}</strong><small>{item.isRequired ? 'Wajib diisi' : 'Opsional'}</small></div>
        <span>{item.type === 'Text' ? 'Teks' : item.type === 'Number' ? 'Angka' : item.type === 'Select' ? 'Pilihan' : item.type === 'Password' ? 'Kata Sandi' : item.type}</span><span>{item.isSensitive ? 'Data sensitif' : 'Data umum'}</span>
        <div><Button tone="ghost" onClick={() => setFieldEditing(item)}>Ubah</Button><Button tone="danger" onClick={() => deleteInputField(item)}>Nonaktifkan</Button></div>
      </div>) : <Empty text="Belum ada isian pembeli. Produk tertentu memerlukan informasi ini agar dapat dipesan." />}</div>
    </Panel>}
    {section === 'inputs' && !supportsInputSchema && <div className="catalog-editor-empty"><strong>Produk ini tidak memerlukan isian pembeli.</strong><p>Informasi akun hanya dibutuhkan untuk produk top up via ID atau login.</p></div>}
    {editing !== undefined && <Modal title={editing ? 'Ubah Varian' : 'Tambah Varian'} onClose={() => setEditing(undefined)}><VariantForm item={editing} kind={detail.kind} siblings={detail.variants || []} onSave={(form, assets, markHandled) => saveVariant(form, editing?.id, assets, markHandled)} onCancel={() => setEditing(undefined)} /></Modal>}
    {voucherVariant && <Modal title={`${voucherVariant.name} · Kode Voucher Terenkripsi`} onClose={() => setVoucherVariant(null)} wide><GameVoucherInventory productId={productId} variant={voucherVariant} onStockChanged={onReload} /></Modal>}
    {imageEditing !== undefined && <Modal title={imageEditing ? 'Ubah Gambar' : 'Tambah Gambar'} onClose={() => setImageEditing(undefined)}><ImageForm item={imageEditing} onSave={(form, assets, markHandled) => saveImage(form, imageEditing?.id, assets, markHandled)} onCancel={() => setImageEditing(undefined)} /></Modal>}
    {fieldEditing !== undefined && <Modal title={fieldEditing ? 'Ubah Isian Pembeli' : 'Tambah Isian Pembeli'} onClose={() => setFieldEditing(undefined)}><InputFieldForm item={fieldEditing} fulfillmentMethod={detail.fulfillmentMethod} onSave={(form) => saveInputField(form, fieldEditing?.id)} onCancel={() => setFieldEditing(undefined)} /></Modal>}
  </div>
}

function VariantForm({ item, kind, siblings = [], onSave, onCancel }) {
  const [form, setForm] = useState(item || { name: '', sku: '', groupName: '', price: '', compareAtPrice: '', stockQuantity: kind === 'GameAccount' ? 1 : kind === 'GameVoucher' ? 0 : '', weightGrams: '', iconUrl: '', isActive: true, sortOrder: 0 })
  const [assets, setAssets] = useState([])
  const markAssetsHandled = useCatalogAssetCleanup(assets)
  const [imageReady, setImageReady] = useState(!item?.iconUrl)
  const [error, setError] = useState('')
  const [acknowledgePrice, setAcknowledgePrice] = useState(false)
  const priceWarning = variantPriceWarning({ ...form, id: item?.id }, siblings)
  const set = (key, value) => { setForm((old) => ({ ...old, [key]: value })); if (['price', 'name', 'groupName'].includes(key)) setAcknowledgePrice(false) }
  return <form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); setError(''); if (form.iconUrl && !imageReady) { setError('Ikon belum dapat dimuat. Ganti atau hapus ikon sebelum menyimpan.'); return } if (priceWarning && !acknowledgePrice) { setError('Periksa dan konfirmasi peringatan harga sebelum menyimpan varian.'); return } onSave(form, assets, markAssetsHandled) }}>
    <Field label="Nama Varian"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Contoh: 86 Diamonds" /></Field>
    <Field label="Kode SKU" hint="Kode unik varian untuk stok dan transaksi."><TextInput value={form.sku} onChange={(e) => set('sku', e.target.value)} required /></Field>
    {kind !== 'Merchandise' && <Field label="Kelompok Paket (opsional)" hint="Contoh: Diamonds, Starlight, UC."><TextInput maxLength={80} value={form.groupName || ''} onChange={(e) => set('groupName', e.target.value)} /></Field>}
    <Field label="Harga Jual"><TextInput type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} required /></Field>
    {priceWarning && <div className="catalog-price-advice" role="status"><AlertTriangle size={18} /><div><strong>Periksa pola harga varian</strong><p>{priceWarning}</p><label><input type="checkbox" checked={acknowledgePrice} onChange={(e) => setAcknowledgePrice(e.target.checked)} /> Saya sudah memeriksa harga ini dan ingin melanjutkan.</label></div></div>}
    <section className="catalog-variant-icon-panel">
      <CatalogImageField title="Ikon Varian (opsional)" value={form.iconUrl || ''} uploadPath="/media/catalog/variant-icon" compact onChange={(url) => { set('iconUrl', url); setError('') }} onUploaded={(asset) => setAssets((old) => [...old, asset])} onValidityChange={setImageReady} />
      <p className="catalog-muted">Ikon ditampilkan di pilihan paket pada toko. Dioptimasi otomatis menjadi WebP, maksimal 256 px dan target 100 KB.</p>
      {form.iconUrl && <Button tone="ghost" onClick={() => { set('iconUrl', ''); setImageReady(true); setError('') }}>Hapus Ikon Varian</Button>}
    </section>
    <Field label="Harga Coret (opsional)"><TextInput type="number" min="0" value={form.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value)} /></Field>
    <Field label="Stok" hint={kind === 'GameVoucher' ? 'Stok mengikuti daftar kode voucher terenkripsi.' : kind === 'GameAccount' ? 'Setiap akun game adalah satu produk unik.' : 'Kosongkan untuk stok tanpa batas.'}>
      <TextInput type="number" min="0" value={kind === 'GameVoucher' ? 0 : kind === 'GameAccount' ? 1 : form.stockQuantity ?? ''} disabled={kind === 'GameVoucher' || kind === 'GameAccount'} onChange={(e) => set('stockQuantity', e.target.value)} />
    </Field>
    {kind === 'Merchandise' && <Field label="Berat Barang (gram)"><TextInput type="number" min="0" value={form.weightGrams ?? ''} onChange={(e) => set('weightGrams', e.target.value)} /></Field>}
    <Field label="Penayangan"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Varian Aktif" /></Field>
    <div className="admin-form-actions"><Button tone="ghost" onClick={onCancel}>Batal</Button><button className="admin-button admin-button--primary">Simpan Varian</button></div>
  </form>
}
function ImageForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || { url: '', altText: '', sortOrder: 0 })
  const [assets, setAssets] = useState([])
  const markAssetsHandled = useCatalogAssetCleanup(assets)
  const [imageReady, setImageReady] = useState(!item?.url)
  const [error, setError] = useState('')
  async function cancel() { await discardCatalogAssets(assets); markAssetsHandled(); onCancel() }
  return <form className="catalog-compact-form" onSubmit={(event) => { event.preventDefault(); if (!form.url || !imageReady) { setError('Gambar belum dapat dimuat. Unggah gambar yang valid.'); return } onSave(form, assets, markAssetsHandled) }}>
    <CatalogImageField title="Gambar Galeri" value={form.url} onChange={(url) => setForm((previous) => ({ ...previous, url }))} onUploaded={(asset) => setAssets((previous) => [...previous, asset])} onValidityChange={setImageReady} />
    <Field label="Keterangan Gambar"><TextInput value={form.altText || ''} onChange={(event) => setForm({ ...form, altText: event.target.value })} placeholder="Contoh: Tampilan dalam game" /></Field>
    <ErrorBox error={error} /><div className="catalog-editor-footer"><Button tone="ghost" onClick={cancel}>Batal</Button><button className="admin-button admin-button--primary">Simpan Gambar</button></div>
  </form>
}

function InputFieldForm({ item, fulfillmentMethod, onSave, onCancel }) {
  const [form, setForm] = useState(item ? { ...item, optionsText: (item.options || []).join(', ') } : { key: '', label: '', type: 'Text', placeholder: '', helpText: '', isRequired: true, isSensitive: false, maxLength: 200, optionsText: '', sortOrder: 0 })
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  function typeChanged(value) { setForm((old) => ({ ...old, type: value, isSensitive: fulfillmentMethod === 'AUTO_ID' ? false : value === 'Password' ? true : old.isSensitive, optionsText: value === 'Select' ? old.optionsText : '' })) }
  return <form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
    <Field label="Nama Isian"><TextInput value={form.label} onChange={(e) => set('label', e.target.value)} required placeholder="Contoh: User ID" /></Field>
    <Field label="Jenis Isian"><Select value={form.type} onChange={(e) => typeChanged(e.target.value)} options={INPUT_FIELD_TYPES.filter((value) => fulfillmentMethod !== 'AUTO_ID' || value !== 'Password').map((value) => ({ value, label: ({ Text: 'Teks', Password: 'Kata Sandi', Email: 'Email', Number: 'Angka', Select: 'Pilihan' })[value] }))} /></Field>
    <Field label="Contoh Isian"><TextInput value={form.placeholder || ''} onChange={(e) => set('placeholder', e.target.value)} /></Field>
    <Field label="Petunjuk untuk Pembeli" wide><TextArea value={form.helpText || ''} onChange={(e) => set('helpText', e.target.value)} /></Field>
    {form.type === 'Select' && <Field label="Daftar Pilihan" hint="Pisahkan dengan koma atau baris baru." wide><TextArea value={form.optionsText || ''} onChange={(e) => set('optionsText', e.target.value)} required /></Field>}
    <Field label="Validasi"><Toggle checked={form.isRequired} onChange={(v) => set('isRequired', v)} label="Wajib diisi" /></Field>
    {fulfillmentMethod === 'MANUAL_LOGIN' && <Field label="Keamanan"><Toggle checked={form.type === 'Password' ? true : form.isSensitive} onChange={(v) => set('isSensitive', v)} label="Informasi sensitif" /></Field>}
    <details className="catalog-advanced admin-field--wide"><summary>Pengaturan Lanjutan</summary>
      <Field label="Batas Panjang Isian"><TextInput type="number" min="1" max="1000" value={form.maxLength} onChange={(e) => set('maxLength', e.target.value)} required /></Field>
      {item && <div><span>Identitas isian (tetap)</span><code>{form.key}</code></div>}
    </details>
    <div className="admin-form-actions"><Button tone="ghost" onClick={onCancel}>Batal</Button><button className="admin-button admin-button--primary">Simpan Isian</button></div>
  </form>
}



function ProductEditor({ item, categories, games, onDone }) {
  const initialCategory = categories.find((category) => category.id === item?.categoryId) || categories[0]
  const initial = useMemo(() => item ? { ...item } : {
    categoryId: initialCategory?.id || '', gameId: '', name: '', slug: '', shortDescription: '',
    description: '', thumbnailUrl: '', kind: initialCategory?.kind || 'TopUpGame',
    isActive: true, isFeatured: false, sortOrder: 0,
  }, [item])
  const [form, setForm] = useState(initial)
  const [savedForm, setSavedForm] = useState(initial)
  const [activeTab, setActiveTab] = useState('information')
  const [notice, setNotice] = useState('')
  const [detail, setDetail] = useState(null)
  const [assets, setAssets] = useState([])
  const markAssetsHandled = useCatalogAssetCleanup(assets)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [imageReady, setImageReady] = useState(!initial.thumbnailUrl)
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm)
  const tabHasChanges = (tab) => isProductTabDirty(savedForm, form, tab)
  const tabDirty = tabHasChanges(activeTab)
  const tabs = [['information', 'Informasi'], ['variants', 'Harga & Varian (' + (detail?.variants?.length ?? 0) + ')'], ['images', 'Gambar'], ['inputs', 'Isian Pembeli (' + (detail?.inputFields?.length ?? 0) + ')'], ['publishing', 'Penayangan']]
  useCatalogUnsavedGuard(dirty)
  const set = (key, value) => { setForm((old) => ({ ...old, [key]: value })); setError('') }
  async function loadDetail() { if (!item?.id) return; try { setDetail(await cmsRequest(`/catalog/products/${item.id}`)) } catch (cause) { setError(cause.message) } }
  useEffect(() => { loadDetail() }, [item?.id])
  const lockedKind = Boolean(item?.id && (detail?.variants?.length || item.activeVariantCount))
  const availableCategories = lockedKind ? categories.filter((value) => value.kind === item.kind) : categories
  function categoryChanged(id) {
    const category = categories.find((value) => value.id === id)
    if (!category) return
    setForm((old) => ({ ...old, categoryId: id, kind: category.kind }))
  }
  async function cancel() {
    if (dirty && !window.confirm('Perubahan produk belum disimpan. Yakin ingin kembali?')) return
    await discardCatalogAssets(assets)
    markAssetsHandled()
    onDone(null)
  }
  function resetTab() {
    const keys = PRODUCT_EDITOR_FIELDS[activeTab] || []
    setForm((previous) => ({ ...previous, ...Object.fromEntries(keys.map((key) => [key, savedForm[key]])) }))
    setError(''); setNotice('')
    if (activeTab === 'images') setImageReady(!savedForm.thumbnailUrl)
  }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    if (activeTab === 'images' && form.thumbnailUrl && !imageReady) { setError('Gambar produk tidak dapat dimuat. Unggah gambar pengganti.'); setBusy(false); return }
    const nextSaved = item ? mergeProductTab(savedForm, form, activeTab) : { ...form }
    const fulfillmentMethod = fulfillmentForKind(nextSaved.kind)
    const payload = {
      categoryId: nextSaved.categoryId, gameId: nextSaved.gameId || null, name: String(nextSaved.name || '').trim(),
      slug: item?.slug || slugify(nextSaved.name), shortDescription: nextSaved.shortDescription || null,
      description: nextSaved.description || null, thumbnailUrl: nextSaved.thumbnailUrl || null, kind: nextSaved.kind,
      fulfillmentMethod, requiresGameAccountValidation: fulfillmentMethod === 'AUTO_ID',
      isActive: nextSaved.isActive, isFeatured: nextSaved.isFeatured, sortOrder: Number(nextSaved.sortOrder || 0),
    }
    try {
      const result = await cmsRequest(item ? '/catalog/products/' + item.id : '/catalog/products', {
        method: item ? 'PUT' : 'POST', body: JSON.stringify(payload),
      })
      if (activeTab === 'images') {
        await discardCatalogAssets(assets, nextSaved.thumbnailUrl)
        setAssets([])
      }
      if (item) {
        setSavedForm(nextSaved)
        if (activeTab === 'information') await loadDetail()
        setNotice(activeTab === 'information' ? 'Informasi berhasil disimpan.' : activeTab === 'images' ? 'Gambar utama berhasil disimpan.' : 'Penayangan berhasil disimpan.')
      } else {
        markAssetsHandled()
        onDone(result)
      }
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  return <div className="admin-page catalog-product-editor">
    <button className="catalog-back" type="button" onClick={cancel}><ArrowLeft size={17} /> Kembali ke Katalog</button>
    <header className="catalog-editor-heading"><div><h1>{form.name || (item ? 'Ubah Produk' : 'Tambah Produk')}</h1><div className="catalog-editor-badges"><Pill value={form.isActive ? 'Aktif' : 'Nonaktif'} />{form.isFeatured && <Pill value="Unggulan" />}</div></div>
      {item?.slug && STOREFRONT_URL && <a className="catalog-store-link" href={STOREFRONT_URL + searchProductHref({ ...item, ...savedForm })} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Lihat di Toko</a>}
    </header>
    <nav className="catalog-editor-tabs" role="tablist" aria-label="Bagian produk">
      {tabs.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={activeTab === value} className={activeTab === value ? 'is-active' : ''} disabled={!item && value !== 'information'} title={!item && value !== 'information' ? 'Buat produk pada tab Informasi terlebih dahulu.' : undefined} onClick={() => { setActiveTab(value); setError(''); setNotice('') }}>{label}{item && tabHasChanges(value) && <span className="catalog-tab-dirty" title="Belum disimpan" />}</button>)}
    </nav>
    {!item && <p className="catalog-editor-guidance">Simpan informasi produk terlebih dahulu untuk membuka pengaturan harga, gambar, isian pembeli, dan penayangan.</p>}
    <ErrorBox error={error} /><Notice message={notice} />
    {!['variants', 'inputs'].includes(activeTab) && <form onSubmit={save} className="catalog-product-form">

      <div className={'catalog-product-grid is-' + activeTab}>
        <div className="catalog-form-stack">
          {activeTab === 'information' && <section className="catalog-form-card"><h2>Informasi Produk</h2>
            <Field label="Nama Produk"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={180} placeholder="Contoh: Mobile Legends: Bang Bang" /></Field>
            <Field label="Kategori"><Select value={form.categoryId} onChange={(e) => categoryChanged(e.target.value)} required options={availableCategories.map((value) => ({ value: value.id, label: value.name }))} /></Field>
            <p className="catalog-field-note">Jenis produk: <strong>{PRODUCT_LABELS[form.kind]}</strong>{lockedKind && ' · Tidak dapat diubah karena sudah memiliki varian.'}</p>
            <Field label="Game" hint={form.kind === 'GameAccount' ? 'Wajib untuk akun game yang dijual.' : 'Pilih game terkait jika ada.'}>
              <Select required={form.kind === 'GameAccount'} value={form.gameId || ''} onChange={(e) => set('gameId', e.target.value)} options={[{ value: '', label: 'Pilih game' }, ...games.map((value) => ({ value: value.id, label: value.name }))]} />
            </Field>
            <Field label="Deskripsi Singkat (opsional)"><TextArea rows={3} value={form.shortDescription || ''} onChange={(e) => set('shortDescription', e.target.value)} placeholder="Tulis keunggulan utama produk…" /></Field>
            <Field label="Detail Produk"><TextArea rows={6} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Informasi untuk pelanggan…" /></Field>
          </section>}


        </div>
        <div className="catalog-form-stack">
          {activeTab === 'images' && <section className="catalog-form-card"><CatalogImageField title="Gambar Utama Produk" value={form.thumbnailUrl} onChange={(value) => set('thumbnailUrl', value)} onValidityChange={setImageReady} onUploaded={(asset) => setAssets((old) => [...old, asset])} /></section>}
          {activeTab === 'information' && <section className="catalog-form-card"><h2>Pratinjau Produk</h2><div className="catalog-customer-preview">
            <div className="catalog-customer-preview-image">{form.thumbnailUrl ? <img src={form.thumbnailUrl} alt="" /> : <Package size={27} />}</div>
            <div><strong>{form.name || 'Nama Produk'}</strong><small>{PRODUCT_LABELS[form.kind] || 'Jenis produk'} · {categories.find((entry) => entry.id === form.categoryId)?.name || 'Kategori'}</small>
              <span>{form.isActive ? 'Tampil di toko' : 'Disembunyikan dari toko'}{form.isFeatured && ' · Unggulan'}</span></div>
          </div><p className="catalog-muted">Pratinjau kartu akan mengikuti perubahan yang belum disimpan.</p></section>}

          {activeTab === 'publishing' && <section className="catalog-form-card"><h2>Penayangan</h2>
            <p className="catalog-muted">Atur apakah produk dapat ditemukan pelanggan dan ditampilkan sebagai unggulan.</p>
            <Toggle checked={form.isActive} onChange={(value) => set('isActive', value)} label="Tampilkan di Toko" />
            <Toggle checked={form.isFeatured} onChange={(value) => set('isFeatured', value)} label="Jadikan Produk Unggulan" />
            <details className="catalog-advanced"><summary>Pengaturan Lanjutan</summary><div><span>Alamat produk (otomatis)</span><code>{item?.slug || slugify(form.name) || 'akan-dibuat-otomatis'}</code><p>Alamat lama dijaga agar tautan yang sudah dibagikan tetap berfungsi.</p><span>Proses pesanan</span><p>{FULFILLMENT_LABELS[fulfillmentForKind(savedForm.kind)]}</p>{savedForm.kind === 'TopUpLogin' && <p>Gunakan proses login resmi yang diizinkan penyedia game.</p>}</div></details>
          </section>}
        </div>
      </div>
      <footer className="catalog-sticky-footer"><span>{tabDirty ? 'Perubahan pada tab ini belum disimpan' : 'Tidak ada perubahan pada tab ini'}</span><div><Button tone="ghost" onClick={resetTab} disabled={!tabDirty || busy}>Batal</Button><button className="admin-button admin-button--primary" disabled={busy || (Boolean(item) && !tabDirty)}>{busy ? 'Menyimpan…' : !item ? 'Buat Produk' : activeTab === 'information' ? 'Simpan Informasi' : activeTab === 'images' ? 'Simpan Gambar Utama' : 'Simpan Penayangan'}</button></div></footer>
    </form>}
    {item?.id && detail && activeTab === 'variants' && <div className="catalog-editor-extras"><VariantEditor key="variants" section="variants" productId={item.id} detail={detail} onReload={loadDetail} />{detail.kind === 'GameAccount' && <GameAccountListingEditor productId={item.id} />}</div>}
    {item?.id && detail && activeTab === 'images' && <div className="catalog-editor-extras"><VariantEditor key="images" section="images" productId={item.id} detail={detail} onReload={loadDetail} /></div>}
    {item?.id && detail && activeTab === 'inputs' && <div className="catalog-editor-extras"><VariantEditor key="inputs" section="inputs" productId={item.id} detail={detail} onReload={loadDetail} /></div>}
    {item?.id && !detail && ['variants', 'images', 'inputs'].includes(activeTab) && <div className="admin-loading">Memuat pengaturan produk…</div>}
  </div>
}

function CatalogPage() {
  const [tab, setTab] = useState('products')
  const [data, setData] = useState({ categories: [], games: [], products: [] })
  const [editor, setEditor] = useState(undefined)
  const [editorDirty, setEditorDirty] = useState(false)
  const [schemaGame, setSchemaGame] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  async function load() {
    try {
      const [categories, games, products] = await Promise.all([
        cmsRequest('/catalog/categories'), cmsRequest('/catalog/games'), cmsRequest('/catalog/products'),
      ])
      const updated = { categories, games, products }
      setData(updated); setError('')
      return updated
    } catch (cause) { setError(cause.message); return null }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const current = tab === 'products' ? data.products : tab === 'categories' ? data.categories : data.games
  const filtered = current.filter((item) => {
    const term = query.trim().toLocaleLowerCase('id')
    if (term && ![item.name, item.gameName, item.categoryName, item.publisher].some((value) => String(value || '').toLocaleLowerCase('id').includes(term))) return false
    if (tab === 'products' && category && item.categoryId !== category) return false
    if (tab === 'products' && kind && item.kind !== kind) return false
    if (status === 'active' && !item.isActive) return false
    if (status === 'inactive' && item.isActive) return false
    if (status === 'featured' && !(tab === 'games' ? item.isPopular : item.isFeatured)) return false
    return true
  })
  async function disable(type, item) {
    if (!confirm(`Nonaktifkan ${item.name}? Data tetap tersimpan, tetapi tidak akan ditampilkan di toko.`)) return
    try { await cmsRequest(`/catalog/${type}/${item.id}`, { method: 'DELETE' }); await load() }
    catch (cause) { setError(cause.message) }
  }
  async function doneProduct(createdId) {
    const updated = await load()
    const found = typeof createdId === 'string' ? updated?.products.find((row) => row.id === createdId) : null
    setEditor(found || undefined)
  }
  const openEditor = (item) => { setEditorDirty(false); setEditor(item) }
  const create = () => openEditor(null)
  const tabs = [['products', 'Produk'], ['categories', 'Kategori'], ['games', 'Game']]
  if (schemaGame) return <div className="admin-page catalog-ux"><GameAccountSchemaEditor key={schemaGame.id} game={schemaGame} onBack={() => setSchemaGame(null)} /></div>
  if (tab === 'products' && editor !== undefined) return <ProductEditor key={editor?.id || 'new-product'} item={editor} categories={data.categories} games={data.games} onDone={doneProduct} />
  return <div className="admin-page catalog-ux">
    <PageHeader eyebrow="KATALOG TOKO" title="Katalog" description="Kelola produk, kategori, dan game di Zetruv."
      action={<Button onClick={create}>+ Tambah {tab === 'products' ? 'Produk' : tab === 'categories' ? 'Kategori' : 'Game'}</Button>} />
    <ErrorBox error={error} />
    <div className="admin-tabs" role="tablist" aria-label="Jenis katalog">{tabs.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} className={tab === value ? 'is-active' : ''}
      onClick={() => { setTab(value); setEditor(undefined); setQuery(''); setCategory(''); setKind(''); setStatus('') }}>{label}</button>)}</div>
    <div className="catalog-toolbar"><label className="catalog-search"><Search size={17} /><input aria-label="Cari katalog" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === 'products' ? 'Cari nama produk atau game…' : tab === 'games' ? 'Cari game…' : 'Cari kategori…'} /></label>
      <div className="catalog-filter-row">{tab === 'products' && <>
        <select aria-label="Filter kategori" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Semua Kategori</option>{data.categories.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select>
        <select aria-label="Filter jenis produk" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">Semua Jenis</option>{PRODUCT_KINDS.map((value) => <option key={value} value={value}>{PRODUCT_LABELS[value]}</option>)}</select>
      </>}
      <select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option>{tab !== 'categories' && <option value="featured">{tab === 'games' ? 'Game Populer' : 'Unggulan'}</option>}</select></div>
    </div>
    <Panel title={tab === 'products' ? 'Daftar Produk' : tab === 'categories' ? 'Daftar Kategori' : 'Daftar Game'} subtitle={`${filtered.length} dari ${current.length} ${tab === 'products' ? 'produk' : tab === 'categories' ? 'kategori' : 'game'}`}>
      {loading ? <div className="admin-loading">Memuat katalog…</div> : filtered.length === 0 ? <Empty text="Tidak ada data yang cocok. Ubah pencarian atau filter untuk melihat data lain." /> : <div className="catalog-record-list">
        {filtered.map((item) => <article className="catalog-record" key={item.id}>
          <div className="catalog-record-thumb">{(tab === 'products' ? item.thumbnailUrl : tab === 'categories' ? item.iconUrl : item.imageUrl) ? <img src={tab === 'products' ? item.thumbnailUrl : tab === 'categories' ? item.iconUrl : item.imageUrl} alt="" /> : <Package size={22} />}</div>
          <div className="catalog-record-main"><strong>{item.name}</strong><p>{tab === 'products' ? `${PRODUCT_LABELS[item.kind] || item.kind} · ${item.categoryName || 'Tanpa kategori'}` : tab === 'categories' ? PRODUCT_LABELS[item.kind] || item.kind : item.publisher || 'Penerbit belum diisi'}</p>
            {tab === 'products' && <small>{item.minPrice == null ? 'Belum ada varian' : item.minPrice === item.maxPrice ? money(item.minPrice) : `${money(item.minPrice)} – ${money(item.maxPrice)}`}</small>}
            <div className="catalog-badges"><span className={`catalog-state ${item.isActive ? 'is-active' : 'is-inactive'}`}>{item.isActive ? 'Aktif' : 'Nonaktif'}</span>{(tab === 'products' ? item.isFeatured : tab === 'games' && item.isPopular) && <span className="catalog-state is-featured"><Star size={12} fill="currentColor" /> {tab === 'games' ? 'Populer' : 'Unggulan'}</span>}</div>
          </div>
          <div className="catalog-record-actions">{tab === 'games' && <Button tone="ghost" onClick={() => setSchemaGame(item)}>Informasi Akun</Button>}
            <Button tone="ghost" onClick={() => openEditor(item)}>{tab === 'products' ? 'Kelola' : 'Ubah'}</Button>
            <details className="catalog-more"><summary aria-label={`Opsi ${item.name}`}><MoreHorizontal size={19} /></summary><div>{item.isActive && <button type="button" onClick={(event) => { event.currentTarget.closest('details').open = false; disable(tab, item) }}>Nonaktifkan</button>}</div></details>
          </div>
        </article>)}
      </div>}
    </Panel>
    {editor !== undefined && tab !== 'products' && <Modal title={`${editor ? 'Ubah' : 'Tambah'} ${tab === 'categories' ? 'Kategori' : 'Game'}`} onClose={() => { if (editorDirty && !confirm('Perubahan belum disimpan. Tutup editor?')) return; setEditor(undefined) }}>
      {tab === 'games' ? <GameForm key={editor?.id || 'new-game'} item={editor} onDirtyChange={setEditorDirty} onCancel={() => setEditor(undefined)} onDone={() => { setEditor(undefined); load() }} />
        : <CategoryForm key={editor?.id || 'new-category'} item={editor} hasProducts={Boolean(editor && data.products.some((product) => product.categoryId === editor.id))} onDirtyChange={setEditorDirty} onCancel={() => setEditor(undefined)} onDone={() => { setEditor(undefined); load() }} />}
    </Modal>}
  </div>
}

function PromotionForm({ item, variantOptions, onDone }) {
  const [form, setForm] = useState(item ? { ...item, startsAt: toWibInput(item.startsAt), endsAt: toWibInput(item.endsAt), items: item.items || [] } : { name: '', slug: '', isFlashSale: false, isActive: true, startsAt: '', endsAt: '', items: [] }); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const changeItem = (index, key, value) => setForm((old) => ({ ...old, items: old.items.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }))
  async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/promotions/${item.id}` : '/promotions', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug || slugify(form.name), isFlashSale: form.isFlashSale, isActive: form.isActive, startsAt: wibInputToIso(form.startsAt), endsAt: wibInputToIso(form.endsAt), items: form.items.map((row, index) => ({ productVariantId: row.productVariantId, salePrice: Number(row.salePrice), sortOrder: Number(row.sortOrder ?? index) })) }) }); onDone() } catch (err) { setError(err.message) } }
  return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Promotion name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.name)} /></Field><Field label="Starts at"><TextInput type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} required /></Field><Field label="Ends at"><TextInput type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} required /></Field><Field label="Type"><Toggle checked={form.isFlashSale} onChange={(v) => set('isFlashSale', v)} label="Flash sale" /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active" /></Field><div className="admin-field admin-field--wide"><span>Promotion items</span><div className="admin-promo-items">{form.items.map((row, index) => <div key={`${row.productVariantId}-${index}`}><Select value={row.productVariantId} onChange={(e) => changeItem(index, 'productVariantId', e.target.value)} options={[{ value: '', label: 'Choose product variant' }, ...variantOptions]} /><input type="number" min="0" placeholder="Sale price" value={row.salePrice} onChange={(e) => changeItem(index, 'salePrice', e.target.value)} required /><button type="button" onClick={() => set('items', form.items.filter((_, i) => i !== index))}>×</button></div>)}<Button tone="ghost" onClick={() => set('items', [...form.items, { productVariantId: '', salePrice: '', sortOrder: form.items.length }])}>+ Add variant</Button></div></div><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save promotion</button></div></form>
}

function PromotionsPage({ flashSaleOnly = false }) {
  const [promotions, setPromotions] = useState([]); const [variants, setVariants] = useState([]); const [editing, setEditing] = useState(undefined); const [error, setError] = useState('')
  async function load() { try { const [promo, products] = await Promise.all([cmsRequest('/promotions'), cmsRequest('/catalog/products')]); setPromotions(promo); const details = await Promise.all(products.map((product) => cmsRequest(`/catalog/products/${product.id}`))); setVariants(details.flatMap((product) => (product.variants || []).map((variant) => ({ value: variant.id, label: `${product.name} · ${variant.name} · ${money(variant.price)}` })))); } catch (err) { setError(err.message) } }
  useEffect(() => { load() }, [])
  async function disable(item) { if (!confirm(`Disable ${item.name}?`)) return; await cmsRequest(`/promotions/${item.id}`, { method: 'DELETE' }); load() }
  const visiblePromotions = flashSaleOnly ? promotions.filter((item) => item.isFlashSale) : promotions
  return <div className="admin-page">
    <PageHeader eyebrow="TOKO" title={flashSaleOnly ? 'Flash Sale' : 'Promosi'} description={flashSaleOnly ? 'Atur promo kilat yang tampil di toko.' : 'Kelola promosi dan jadwal potongan harga.'} action={<Button onClick={() => setEditing(null)}>+ {flashSaleOnly ? 'Buat Flash Sale' : 'Buat Promosi'}</Button>} />
    <ErrorBox error={error} />
    <Panel title={flashSaleOnly ? 'Daftar Flash Sale' : 'Daftar Promosi'} subtitle={`${visiblePromotions.length} tercatat`}>
      <div className="admin-card-list">{visiblePromotions.length === 0 ? <Empty text="Belum ada promosi di bagian ini." /> : visiblePromotions.map((item) => <article className="admin-row-card" key={item.id}>
        <div className="admin-promo-icon">⚡</div><div className="admin-row-card-copy"><div><strong>{item.name}</strong><Pill value={item.isActive ? 'Active' : 'Inactive'} /></div><p>{item.items?.length || 0} variants · {item.isFlashSale ? 'Flash Sale' : 'Promotion'}</p><small>{date(item.startsAt)} → {date(item.endsAt)}</small></div>
        <div className="admin-row-actions"><Button tone="ghost" onClick={() => item.isFlashSale ? (window.location.hash = `/flash-sale/${item.id}`) : setEditing(item)}>Edit</Button><Button tone="danger" onClick={() => disable(item)}>Disable</Button></div>
      </article>)}</div>
    </Panel>
    {editing !== undefined && <Modal title={editing ? 'Edit promotion' : 'Create promotion'} onClose={() => setEditing(undefined)} wide><PromotionForm item={editing} variantOptions={variants} onDone={() => { setEditing(undefined); load() }} /></Modal>}
  </div>
}

function ArticleCategoryForm({ item, onDone }) { const [form, setForm] = useState(item || { name: '', slug: '', isActive: true, sortOrder: 0 }); const [error, setError] = useState(''); async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/articles/categories/${item.id}` : '/articles/categories', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug || slugify(form.name), isActive: form.isActive, sortOrder: Number(form.sortOrder || 0) }) }); onDone() } catch (err) { setError(err.message) } } return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save category</button></div></form> }
function ArticleForm({ item, categories, onDone }) { const [form, setForm] = useState(item ? { ...item, publishedAt: toInputDate(item.publishedAt) } : { categoryId: categories[0]?.id || '', title: '', slug: '', excerpt: '', content: '', thumbnailUrl: '', authorName: '', isPublished: false, isFeatured: false, publishedAt: '' }); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value })); async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/articles/${item.id}` : '/articles', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ categoryId: form.categoryId, title: form.title, slug: form.slug || slugify(form.title), excerpt: form.excerpt, content: form.content, thumbnailUrl: form.thumbnailUrl, authorName: form.authorName || null, isPublished: form.isPublished, isFeatured: form.isFeatured, publishedAt: form.isPublished ? toIso(form.publishedAt || new Date()) : form.publishedAt ? toIso(form.publishedAt) : null }) }); onDone() } catch (err) { setError(err.message) } } return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Title" wide><TextInput value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.title)} /></Field><Field label="Category"><Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} options={categories.map((category) => ({ value: category.id, label: category.name }))} /></Field><Field label="Author"><TextInput value={form.authorName || ''} onChange={(e) => set('authorName', e.target.value)} /></Field><Field label="Published at"><TextInput type="datetime-local" value={form.publishedAt || ''} onChange={(e) => set('publishedAt', e.target.value)} /></Field><Field label="Thumbnail URL" wide><TextInput value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} required /></Field><Field label="Excerpt" wide><TextArea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} required /></Field><Field label="Content" wide><TextArea rows={14} value={form.content} onChange={(e) => set('content', e.target.value)} required /></Field><Field label="Publishing"><Toggle checked={form.isPublished} onChange={(v) => set('isPublished', v)} label="Published" /></Field><Field label="Homepage"><Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Featured" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save article</button></div></form> }

function ArticlesPage() {
  const [tab, setTab] = useState('articles'); const [articles, setArticles] = useState([]); const [categories, setCategories] = useState([]); const [editing, setEditing] = useState(undefined); const [error, setError] = useState('')
  async function load() { try { const [a, c] = await Promise.all([cmsRequest('/articles'), cmsRequest('/articles/categories')]); setArticles(a); setCategories(c) } catch (err) { setError(err.message) } } useEffect(() => { load() }, [])
  async function remove(item) { if (!confirm(`${tab === 'articles' ? 'Delete' : 'Disable'} ${item.title || item.name}?`)) return; await cmsRequest(tab === 'articles' ? `/articles/${item.id}` : `/articles/categories/${item.id}`, { method: 'DELETE' }); load() }
  return <div className="admin-page"><PageHeader eyebrow="EDITORIAL" title="Articles" description="Draft, schedule, publish, feature, and organize editorial content." action={<Button onClick={() => setEditing(null)}>+ New {tab === 'articles' ? 'article' : 'category'}</Button>} /><ErrorBox error={error} /><div className="admin-tabs"><button className={tab === 'articles' ? 'is-active' : ''} onClick={() => { setTab('articles'); setEditing(undefined) }} type="button">articles</button><button className={tab === 'categories' ? 'is-active' : ''} onClick={() => { setTab('categories'); setEditing(undefined) }} type="button">categories</button></div>{tab === 'articles' ? <Panel title="Editorial library" subtitle={`${articles.length} articles`}><div className="admin-table-wrap"><table><thead><tr><th>Article</th><th>Category</th><th>Publishing</th><th>Updated</th><th /></tr></thead><tbody>{articles.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.slug}</small></td><td>{item.categoryName}</td><td><Pill value={item.isPublished ? item.isFeatured ? 'Featured' : 'Published' : 'Draft'} /></td><td>{date(item.updatedAt)}</td><td><div className="admin-row-actions"><Button tone="ghost" onClick={async () => setEditing(await cmsRequest(`/articles/${item.id}`))}>Edit</Button><Button tone="danger" onClick={() => remove(item)}>Delete</Button></div></td></tr>)}</tbody></table></div></Panel> : <Panel title="Article categories" subtitle="Public article taxonomy"><div className="admin-card-list">{categories.map((item) => <article className="admin-row-card" key={item.id}><div className="admin-promo-icon">#</div><div className="admin-row-card-copy"><div><strong>{item.name}</strong><Pill value={item.isActive ? 'Active' : 'Inactive'} /></div><p>{item.articleCount} articles</p><small>{item.slug}</small></div><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditing(item)}>Edit</Button><Button tone="danger" onClick={() => remove(item)}>Disable</Button></div></article>)}</div></Panel>}{editing !== undefined && <Modal title={`${editing ? 'Edit' : 'Create'} ${tab === 'articles' ? 'article' : 'category'}`} onClose={() => setEditing(undefined)} wide={tab === 'articles'}>{tab === 'articles' ? <ArticleForm item={editing} categories={categories} onDone={() => { setEditing(undefined); load() }} /> : <ArticleCategoryForm item={editing} onDone={() => { setEditing(undefined); load() }} />}</Modal>}</div>
}


function CollectionEditor({ title, items, fields, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(undefined)
  return <Panel title={title} action={<Button tone="ghost" onClick={() => setEditing({})}>+ Add</Button>}><div className="admin-settings-list">{items.map((item) => <div key={item.id}><div><strong>{item.label || item.name || item.platform}</strong><small>{item.url || item.code || item.group}</small></div><Pill value={item.isActive ? 'Active' : 'Inactive'} /><Button tone="ghost" onClick={() => setEditing(item)}>Edit</Button><Button tone="danger" onClick={() => onDelete(item)}>Delete</Button></div>)}</div>{editing !== undefined && <Modal title={`${editing.id ? 'Edit' : 'Add'} ${title}`} onClose={() => setEditing(undefined)}><DynamicForm item={editing} fields={fields} onDone={async (value) => { if (editing.id) await onUpdate(editing.id, value); else await onCreate(value); setEditing(undefined) }} onCancel={() => setEditing(undefined)} /></Modal>}</Panel>
}
function DynamicForm({ item, fields, onDone, onCancel }) { const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field.key, item[field.key] ?? field.default ?? (field.type === 'toggle' ? true : '')]))); return <form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); onDone(form) }}>{fields.map((field) => <Field label={field.label} key={field.key} wide={field.wide}>{field.type === 'toggle' ? <Toggle checked={form[field.key]} onChange={(value) => setForm({ ...form, [field.key]: value })} label="Active" /> : field.type === 'select' ? <Select value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} options={field.options} /> : <TextInput type={field.type || 'text'} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })} required={field.required} />}</Field>)}<div className="admin-form-actions"><Button tone="ghost" onClick={onCancel}>Cancel</Button><button className="admin-button admin-button--primary">Save</button></div></form> }

function SitePage() {
  const [data, setData] = useState({ settings: null, footer: [], socials: [], payments: [] }); const [error, setError] = useState(''); const [notice, setNotice] = useState('')
  async function load() { try { const [settings, footer, socials, payments] = await Promise.all([cmsRequest('/site/settings'), cmsRequest('/site/footer-links'), cmsRequest('/site/social-links'), cmsRequest('/site/payment-methods')]); setData({ settings, footer, socials, payments }) } catch (err) { setError(err.message) } } useEffect(() => { load() }, [])
  async function updateSettings(form) { try { await cmsRequest('/site/settings', { method: 'PUT', body: JSON.stringify(form) }); setNotice('Site settings saved.'); load() } catch (err) { setError(err.message) } }
  async function mutate(path, method, body) { try { await cmsRequest(path, { method, body: body ? JSON.stringify(body) : undefined }); load() } catch (err) { setError(err.message) } }
  const footerFields = [{ key: 'group', label: 'Group', type: 'select', options: FOOTER_GROUPS }, { key: 'label', label: 'Label', required: true }, { key: 'url', label: 'URL', wide: true, required: true }, { key: 'sortOrder', label: 'Sort order', type: 'number', default: 0 }, { key: 'isActive', label: 'Status', type: 'toggle', default: true }]
  const socialFields = [{ key: 'platform', label: 'Platform', required: true }, { key: 'url', label: 'URL', wide: true, required: true }, { key: 'iconUrl', label: 'Icon URL', wide: true }, { key: 'sortOrder', label: 'Sort order', type: 'number', default: 0 }, { key: 'isActive', label: 'Status', type: 'toggle', default: true }]
  const paymentFields = [{ key: 'code', label: 'Code', required: true }, { key: 'name', label: 'Name', required: true }, { key: 'iconUrl', label: 'Icon URL', wide: true }, { key: 'sortOrder', label: 'Sort order', type: 'number', default: 0 }, { key: 'isActive', label: 'Status', type: 'toggle', default: true }]
  return <div className="admin-page">
    <PageHeader title="Pengaturan" description="Kelola informasi dan pengaturan toko." />
    <ErrorBox error={error} /><Notice message={notice} />
    {data.settings && <SiteSettingsForm item={data.settings} onSave={updateSettings} />}
    <div className="admin-settings-grid">
      <CollectionEditor title="Footer links" items={data.footer} fields={footerFields} onCreate={(body) => mutate('/site/footer-links', 'POST', body)} onUpdate={(id, body) => mutate(`/site/footer-links/${id}`, 'PUT', body)} onDelete={(item) => confirm(`Delete ${item.label}?`) && mutate(`/site/footer-links/${item.id}`, 'DELETE')} />
      <CollectionEditor title="Social links" items={data.socials} fields={socialFields} onCreate={(body) => mutate('/site/social-links', 'POST', body)} onUpdate={(id, body) => mutate(`/site/social-links/${id}`, 'PUT', body)} onDelete={(item) => confirm(`Delete ${item.platform}?`) && mutate(`/site/social-links/${item.id}`, 'DELETE')} />
      <CollectionEditor title="Payment methods" items={data.payments} fields={paymentFields} onCreate={(body) => mutate('/site/payment-methods', 'POST', body)} onUpdate={(id, body) => mutate(`/site/payment-methods/${id}`, 'PUT', body)} onDelete={(item) => confirm(`Delete ${item.name}?`) && mutate(`/site/payment-methods/${item.id}`, 'DELETE')} />
    </div>
    <Panel title="Pengaturan Lanjutan" subtitle="Untuk admin yang mengelola integrasi teknis">
      <a href="#/provider-mapping" className="admin-settings-advanced"><Settings size={20} aria-hidden="true" /><span><strong>Integrasi Penyedia</strong><small>Atur hubungan produk dan penyedia layanan</small></span><ArrowRight size={18} aria-hidden="true" /></a>
    </Panel>
  </div>
}
function SiteSettingsForm({ item, onSave }) { const [form, setForm] = useState({ logoUrl: item.logoUrl || '', brandDescription: item.brandDescription || '', copyrightText: item.copyrightText || '', contactTeamLabel: item.contactTeamLabel || '', contactTeamUrl: item.contactTeamUrl || '' }); return <Panel title="Brand & contact" subtitle="Global settings used by site/footer responses"><form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, logoUrl: form.logoUrl || null, contactTeamUrl: form.contactTeamUrl || null }) }}><Field label="Logo URL" wide><TextInput value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></Field><Field label="Brand description" wide><TextArea value={form.brandDescription} onChange={(e) => setForm({ ...form, brandDescription: e.target.value })} required /></Field><Field label="Copyright"><TextInput value={form.copyrightText} onChange={(e) => setForm({ ...form, copyrightText: e.target.value })} required /></Field><Field label="Contact CTA label"><TextInput value={form.contactTeamLabel} onChange={(e) => setForm({ ...form, contactTeamLabel: e.target.value })} required /></Field><Field label="Contact CTA URL" wide><TextInput value={form.contactTeamUrl} onChange={(e) => setForm({ ...form, contactTeamUrl: e.target.value })} /></Field><div className="admin-form-actions"><button className="admin-button admin-button--primary">Save site settings</button></div></form></Panel> }

export default function AdminApp() {
  const [session, setSession] = useState(getAdminSession)
  if (!session) return <Login onLogin={setSession} />
  return <Shell session={session} onLogout={() => { logoutAdmin(); setSession(null) }} />
}
