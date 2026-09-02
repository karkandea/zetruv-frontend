import { useEffect, useMemo, useState } from 'react'
import { cmsRequest, getAdminSession, loginAdmin, logoutAdmin } from './api'

const NAV = [
  ['dashboard', 'Overview', '⌂'],
  ['homepage', 'Homepage', '◫'],
  ['catalog', 'Catalog', '▦'],
  ['promotions', 'Promotions', '⚡'],
  ['articles', 'Articles', '✎'],
  ['orders', 'Orders', '◎'],
  ['site', 'Site settings', '⚙'],
]

const PRODUCT_KINDS = ['TopUpGame', 'TopUpLogin', 'GameVoucher', 'Joki', 'Merchandise', 'GameAccount']
const ORDER_STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled']
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded']
const SHIPMENT_STATUSES = ['Pending', 'ReadyToShip', 'Shipped', 'Delivered', 'Cancelled']
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
  const page = {
    dashboard: <Dashboard />,
    homepage: <HomepagePage />,
    catalog: <CatalogPage />,
    promotions: <PromotionsPage />,
    articles: <ArticlesPage />,
    orders: <OrdersPage />,
    site: <SitePage />,
  }[route]

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>Z</span><div><strong>Zetruv</strong><small>Admin</small></div></div>
      <nav>{NAV.map(([id, label, icon]) => <button className={route === id ? 'is-active' : ''} key={id} type="button" onClick={() => navigate(id)}><i>{icon}</i><span>{label}</span></button>)}</nav>
      <div className="admin-user"><div className="admin-user-avatar">{session.email?.[0]?.toUpperCase() || 'A'}</div><div><strong>{session.email}</strong><small>{session.role}</small></div><button type="button" title="Sign out" onClick={onLogout}>↗</button></div>
    </aside>
    <main className="admin-main"><div className="admin-topbar"><span className="admin-live-dot" /> Connected to live CMS API <a href="https://zetruv.dualangka.com" target="_blank" rel="noreferrer">Open storefront ↗</a></div>{page}</main>
  </div>
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([
      cmsRequest('/homepage/heroes'), cmsRequest('/catalog/categories'), cmsRequest('/catalog/games'), cmsRequest('/catalog/products'),
      cmsRequest('/promotions'), cmsRequest('/articles'), cmsRequest('/orders?page=1&pageSize=1'),
    ]).then(([heroes, categories, games, products, promotions, articles, orders]) => setStats({
      heroes: heroes.length, categories: categories.length, games: games.length, products: products.length,
      promotions: promotions.filter((item) => item.isActive).length, articles: articles.length, orders: orders.totalItems || 0,
      featured: products.filter((item) => item.isFeatured).length,
    })).catch((err) => setError(err.message))
  }, [])

  const cards = stats ? [
    ['Products', stats.products, `${stats.featured} featured`, '▦'], ['Orders', stats.orders, 'All-time records', '◎'], ['Games', stats.games, `${stats.categories} categories`, '◇'],
    ['Articles', stats.articles, 'CMS content', '✎'], ['Active promos', stats.promotions, 'Scheduled campaigns', '⚡'], ['Hero banners', stats.heroes, 'Homepage slots', '◫'],
  ] : []

  return <div className="admin-page"><PageHeader eyebrow="ZETRUV OPERATIONS" title="Overview" description="A live snapshot of the content and commerce data currently owned by the Zetruv backend." />
    <ErrorBox error={error} />
    {!stats ? <div className="admin-loading">Loading operational data…</div> : <><div className="admin-stat-grid">{cards.map(([label, value, helper, icon]) => <article key={label}><div><small>{label}</small><strong>{value}</strong><span>{helper}</span></div><i>{icon}</i></article>)}</div>
      <div className="admin-dashboard-grid"><Panel title="Admin coverage" subtitle="Backend modules already wired into this console"><div className="admin-coverage-list">{['Homepage content', 'Catalog & products', 'Promotions', 'Articles', 'Orders & payment status', 'Shipment fulfillment', 'Site & footer settings'].map((item) => <div key={item}><span>✓</span>{item}</div>)}</div></Panel>
      <Panel title="Deployment model" subtitle="Storefront and admin stay independently deployable"><div className="admin-architecture"><div><b>Storefront</b><code>dist/</code><span>zetruv.dualangka.com</span></div><i>→</i><div><b>Same API</b><code>/api/v1</code><span>.NET + PostgreSQL</span></div><i>←</i><div><b>Admin</b><code>dist-admin/</code><span>admin.zetruv.dualangka.com</span></div></div></Panel></div></>}
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

function CategoryForm({ item, onDone }) {
  const [form, setForm] = useState(item || { key: '', name: '', slug: '', description: '', iconUrl: '', kind: 'TopUpGame', isActive: true, sortOrder: 0 }); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function save(e) { e.preventDefault(); setError(''); try { await cmsRequest(item ? `/catalog/categories/${item.id}` : '/catalog/categories', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ key: form.key, name: form.name, slug: form.slug || slugify(form.name), description: form.description || null, iconUrl: form.iconUrl || null, kind: form.kind, isActive: form.isActive, sortOrder: Number(form.sortOrder || 0) }) }); onDone() } catch (err) { setError(err.message) } }
  return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field><Field label="Key"><TextInput value={form.key} onChange={(e) => set('key', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.name)} /></Field><Field label="Product kind"><Select value={form.kind} onChange={(e) => set('kind', e.target.value)} options={PRODUCT_KINDS} /></Field><Field label="Icon URL" wide><TextInput value={form.iconUrl || ''} onChange={(e) => set('iconUrl', e.target.value)} /></Field><Field label="Description" wide><TextArea value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(value) => set('isActive', value)} label="Active" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save category</button></div></form>
}

function GameForm({ item, onDone }) {
  const [form, setForm] = useState(item || { name: '', slug: '', publisher: '', imageUrl: '', isActive: true, isPopular: false, sortOrder: 0 }); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/catalog/games/${item.id}` : '/catalog/games', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug || slugify(form.name), publisher: form.publisher || null, imageUrl: form.imageUrl || null, isActive: form.isActive, isPopular: form.isPopular, sortOrder: Number(form.sortOrder || 0) }) }); onDone() } catch (err) { setError(err.message) } }
  return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Game name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.name)} /></Field><Field label="Publisher"><TextInput value={form.publisher || ''} onChange={(e) => set('publisher', e.target.value)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field><Field label="Image URL" wide><TextInput value={form.imageUrl || ''} onChange={(e) => set('imageUrl', e.target.value)} /></Field><Field label="Visibility"><Toggle checked={form.isActive} onChange={(value) => set('isActive', value)} label="Active" /></Field><Field label="Homepage"><Toggle checked={form.isPopular} onChange={(value) => set('isPopular', value)} label="Popular" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save game</button></div></form>
}

function VariantEditor({ productId, detail, onReload }) {
  const [editing, setEditing] = useState(undefined); const [imageEditing, setImageEditing] = useState(undefined); const [error, setError] = useState('')
  async function saveVariant(form, id) { const body = { name: form.name, sku: form.sku, price: Number(form.price), compareAtPrice: numberOrNull(form.compareAtPrice), stockQuantity: numberOrNull(form.stockQuantity), weightGrams: numberOrNull(form.weightGrams), isActive: form.isActive, sortOrder: Number(form.sortOrder || 0) }; try { await cmsRequest(id ? `/catalog/products/${productId}/variants/${id}` : `/catalog/products/${productId}/variants`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); setEditing(undefined); onReload() } catch (err) { setError(err.message) } }
  async function saveImage(form, id) { try { await cmsRequest(id ? `/catalog/products/${productId}/images/${id}` : `/catalog/products/${productId}/images`, { method: id ? 'PUT' : 'POST', body: JSON.stringify({ url: form.url, altText: form.altText || null, sortOrder: Number(form.sortOrder || 0) }) }); setImageEditing(undefined); onReload() } catch (err) { setError(err.message) } }
  async function disableVariant(item) { if (!confirm(`Disable SKU ${item.sku}?`)) return; await cmsRequest(`/catalog/products/${productId}/variants/${item.id}`, { method: 'DELETE' }); onReload() }
  async function deleteImage(item) { if (!confirm('Delete this image?')) return; await cmsRequest(`/catalog/products/${productId}/images/${item.id}`, { method: 'DELETE' }); onReload() }
  return <div className="admin-product-subresources"><ErrorBox error={error} /><Panel title="Variants" subtitle="Price, stock, physical weight, and SKU" action={<Button tone="ghost" onClick={() => setEditing(null)}>+ Variant</Button>}><div className="admin-mini-list">{detail.variants?.map((item) => <div key={item.id}><div><strong>{item.name}</strong><code>{item.sku}</code></div><span>{money(item.price)}</span><span>{item.stockQuantity == null ? 'Unlimited' : `${item.stockQuantity} stock`}</span><Pill value={item.isActive ? 'Active' : 'Inactive'} /><div><Button tone="ghost" onClick={() => setEditing(item)}>Edit</Button><Button tone="danger" onClick={() => disableVariant(item)}>Disable</Button></div></div>)}</div></Panel><Panel title="Images" subtitle="Product gallery URLs" action={<Button tone="ghost" onClick={() => setImageEditing(null)}>+ Image</Button>}><div className="admin-image-grid">{detail.images?.map((item) => <article key={item.id}>{item.url ? <img src={item.url} alt={item.altText || ''} /> : <span>Image</span>}<div><small>{item.altText || 'No alt text'}</small><div><Button tone="ghost" onClick={() => setImageEditing(item)}>Edit</Button><Button tone="danger" onClick={() => deleteImage(item)}>Delete</Button></div></div></article>)}</div></Panel>
    {editing !== undefined && <Modal title={editing ? 'Edit variant' : 'Add variant'} onClose={() => setEditing(undefined)}><VariantForm item={editing} onSave={(form) => saveVariant(form, editing?.id)} onCancel={() => setEditing(undefined)} /></Modal>}
    {imageEditing !== undefined && <Modal title={imageEditing ? 'Edit image' : 'Add image'} onClose={() => setImageEditing(undefined)}><ImageForm item={imageEditing} onSave={(form) => saveImage(form, imageEditing?.id)} onCancel={() => setImageEditing(undefined)} /></Modal>}
  </div>
}

function VariantForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || { name: '', sku: '', price: '', compareAtPrice: '', stockQuantity: '', weightGrams: '', isActive: true, sortOrder: 0 }); const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  return <form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); onSave(form) }}><Field label="Name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field><Field label="SKU"><TextInput value={form.sku} onChange={(e) => set('sku', e.target.value)} required /></Field><Field label="Price"><TextInput type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} required /></Field><Field label="Compare-at price"><TextInput type="number" min="0" value={form.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value)} /></Field><Field label="Stock"><TextInput type="number" min="0" value={form.stockQuantity ?? ''} onChange={(e) => set('stockQuantity', e.target.value)} placeholder="Blank = unlimited" /></Field><Field label="Weight (grams)"><TextInput type="number" min="0" value={form.weightGrams ?? ''} onChange={(e) => set('weightGrams', e.target.value)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onCancel}>Cancel</Button><button className="admin-button admin-button--primary">Save variant</button></div></form>
}
function ImageForm({ item, onSave, onCancel }) { const [form, setForm] = useState(item || { url: '', altText: '', sortOrder: 0 }); return <form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); onSave(form) }}><Field label="Image URL" wide><TextInput value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required /></Field><Field label="Alt text"><TextInput value={form.altText || ''} onChange={(e) => setForm({ ...form, altText: e.target.value })} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onCancel}>Cancel</Button><button className="admin-button admin-button--primary">Save image</button></div></form> }

function ProductEditor({ item, categories, games, onDone }) {
  const initialCategory = categories.find((category) => category.id === item?.categoryId) || categories[0]
  const [form, setForm] = useState(item ? { ...item } : { categoryId: initialCategory?.id || '', gameId: '', name: '', slug: '', shortDescription: '', description: '', thumbnailUrl: '', kind: initialCategory?.kind || 'TopUpGame', requiresGameAccountValidation: false, isActive: true, isFeatured: false, sortOrder: 0 })
  const [detail, setDetail] = useState(null); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  async function loadDetail() { if (!item?.id) return; try { setDetail(await cmsRequest(`/catalog/products/${item.id}`)) } catch (err) { setError(err.message) } }
  useEffect(() => { loadDetail() }, [item?.id])
  function categoryChanged(id) { const category = categories.find((value) => value.id === id); setForm((old) => ({ ...old, categoryId: id, kind: category?.kind || old.kind })) }
  async function save(e) { e.preventDefault(); const payload = { categoryId: form.categoryId, gameId: form.gameId || null, name: form.name, slug: form.slug || slugify(form.name), shortDescription: form.shortDescription || null, description: form.description || null, thumbnailUrl: form.thumbnailUrl || null, kind: form.kind, requiresGameAccountValidation: form.requiresGameAccountValidation, isActive: form.isActive, isFeatured: form.isFeatured, sortOrder: Number(form.sortOrder || 0) }; try { await cmsRequest(item ? `/catalog/products/${item.id}` : '/catalog/products', { method: item ? 'PUT' : 'POST', body: JSON.stringify(payload) }); onDone() } catch (err) { setError(err.message) } }
  return <><form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Product name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.name)} /></Field><Field label="Category"><Select value={form.categoryId} onChange={(e) => categoryChanged(e.target.value)} options={categories.map((value) => ({ value: value.id, label: `${value.name} · ${value.kind}` }))} /></Field><Field label="Game"><Select value={form.gameId || ''} onChange={(e) => set('gameId', e.target.value)} options={[{ value: '', label: 'No game' }, ...games.map((value) => ({ value: value.id, label: value.name }))]} /></Field><Field label="Product kind"><TextInput value={form.kind} disabled /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field><Field label="Thumbnail URL" wide><TextInput value={form.thumbnailUrl || ''} onChange={(e) => set('thumbnailUrl', e.target.value)} /></Field><Field label="Short description" wide><TextArea value={form.shortDescription || ''} onChange={(e) => set('shortDescription', e.target.value)} /></Field><Field label="Full description" wide><TextArea rows={7} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field><Field label="Visibility"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active" /></Field><Field label="Homepage"><Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Featured" /></Field><Field label="Validation"><Toggle checked={form.requiresGameAccountValidation} onChange={(v) => set('requiresGameAccountValidation', v)} label="Requires game account validation" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save product</button></div></form>{item?.id && detail && <VariantEditor productId={item.id} detail={detail} onReload={loadDetail} />}</>
}

function CatalogPage() {
  const [tab, setTab] = useState('products'); const [data, setData] = useState({ categories: [], games: [], products: [] }); const [editor, setEditor] = useState(undefined); const [error, setError] = useState('')
  async function load() { try { const [categories, games, products] = await Promise.all([cmsRequest('/catalog/categories'), cmsRequest('/catalog/games'), cmsRequest('/catalog/products')]); setData({ categories, games, products }) } catch (err) { setError(err.message) } }
  useEffect(() => { load() }, [])
  async function disable(type, item) { if (!confirm(`Disable ${item.name}?`)) return; try { await cmsRequest(`/catalog/${type}/${item.id}`, { method: 'DELETE' }); load() } catch (err) { setError(err.message) } }
  const create = () => setEditor(null)
  return <div className="admin-page"><PageHeader eyebrow="COMMERCE" title="Catalog" description="Categories, games, products, variants, stock, pricing, and product media." action={<Button onClick={create}>+ New {tab === 'products' ? 'product' : tab === 'games' ? 'game' : 'category'}</Button>} /><ErrorBox error={error} /><div className="admin-tabs">{['products', 'categories', 'games'].map((value) => <button className={tab === value ? 'is-active' : ''} type="button" key={value} onClick={() => { setTab(value); setEditor(undefined) }}>{value}</button>)}</div>
    {tab === 'products' && <Panel title="Products" subtitle={`${data.products.length} products currently stored`}><div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Kind</th><th>Category</th><th>Price range</th><th>Status</th><th /></tr></thead><tbody>{data.products.map((item) => <tr key={item.id}><td><div className="admin-product-cell">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <i>▦</i>}<div><strong>{item.name}</strong><small>{item.gameName || item.slug}</small></div></div></td><td><code>{item.kind}</code></td><td>{item.categoryName}</td><td>{item.minPrice == null ? 'No variants' : item.minPrice === item.maxPrice ? money(item.minPrice) : `${money(item.minPrice)} – ${money(item.maxPrice)}`}</td><td><Pill value={item.isActive ? item.isFeatured ? 'Featured' : 'Active' : 'Inactive'} /></td><td><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditor(item)}>Manage</Button><Button tone="danger" onClick={() => disable('products', item)}>Disable</Button></div></td></tr>)}</tbody></table></div></Panel>}
    {tab === 'categories' && <Panel title="Categories" subtitle="Category kind controls which product type can live inside it"><div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Key / slug</th><th>Kind</th><th>Status</th><th /></tr></thead><tbody>{data.categories.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td><code>{item.key}</code><small>{item.slug}</small></td><td>{item.kind}</td><td><Pill value={item.isActive ? 'Active' : 'Inactive'} /></td><td><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditor(item)}>Edit</Button><Button tone="danger" onClick={() => disable('categories', item)}>Disable</Button></div></td></tr>)}</tbody></table></div></Panel>}
    {tab === 'games' && <Panel title="Games" subtitle="Game taxonomy and homepage popularity"><div className="admin-card-list">{data.games.map((item) => <article className="admin-row-card" key={item.id}><div className="admin-thumb">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : '◇'}</div><div className="admin-row-card-copy"><div><strong>{item.name}</strong>{item.isPopular && <Pill value="Popular" />}</div><p>{item.publisher || 'No publisher'}</p><small>{item.slug}</small></div><Pill value={item.isActive ? 'Active' : 'Inactive'} /><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditor(item)}>Edit</Button><Button tone="danger" onClick={() => disable('games', item)}>Disable</Button></div></article>)}</div></Panel>}
    {editor !== undefined && <Modal title={`${editor ? 'Edit' : 'Create'} ${tab === 'products' ? 'product' : tab === 'games' ? 'game' : 'category'}`} onClose={() => setEditor(undefined)} wide={tab === 'products'}>{tab === 'products' ? <ProductEditor item={editor} categories={data.categories} games={data.games} onDone={() => { setEditor(undefined); load() }} /> : tab === 'games' ? <GameForm item={editor} onDone={() => { setEditor(undefined); load() }} /> : <CategoryForm item={editor} onDone={() => { setEditor(undefined); load() }} />}</Modal>}
  </div>
}

function PromotionForm({ item, variantOptions, onDone }) {
  const [form, setForm] = useState(item ? { ...item, startsAt: toInputDate(item.startsAt), endsAt: toInputDate(item.endsAt), items: item.items || [] } : { name: '', slug: '', isFlashSale: true, isActive: true, startsAt: '', endsAt: '', items: [] }); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const changeItem = (index, key, value) => setForm((old) => ({ ...old, items: old.items.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }))
  async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/promotions/${item.id}` : '/promotions', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug || slugify(form.name), isFlashSale: form.isFlashSale, isActive: form.isActive, startsAt: toIso(form.startsAt), endsAt: toIso(form.endsAt), items: form.items.map((row, index) => ({ productVariantId: row.productVariantId, salePrice: Number(row.salePrice), sortOrder: Number(row.sortOrder ?? index) })) }) }); onDone() } catch (err) { setError(err.message) } }
  return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Promotion name"><TextInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.name)} /></Field><Field label="Starts at"><TextInput type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} required /></Field><Field label="Ends at"><TextInput type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} required /></Field><Field label="Type"><Toggle checked={form.isFlashSale} onChange={(v) => set('isFlashSale', v)} label="Flash sale" /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active" /></Field><div className="admin-field admin-field--wide"><span>Promotion items</span><div className="admin-promo-items">{form.items.map((row, index) => <div key={`${row.productVariantId}-${index}`}><Select value={row.productVariantId} onChange={(e) => changeItem(index, 'productVariantId', e.target.value)} options={[{ value: '', label: 'Choose product variant' }, ...variantOptions]} /><input type="number" min="0" placeholder="Sale price" value={row.salePrice} onChange={(e) => changeItem(index, 'salePrice', e.target.value)} required /><button type="button" onClick={() => set('items', form.items.filter((_, i) => i !== index))}>×</button></div>)}<Button tone="ghost" onClick={() => set('items', [...form.items, { productVariantId: '', salePrice: '', sortOrder: form.items.length }])}>+ Add variant</Button></div></div><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save promotion</button></div></form>
}

function PromotionsPage() {
  const [promotions, setPromotions] = useState([]); const [variants, setVariants] = useState([]); const [editing, setEditing] = useState(undefined); const [error, setError] = useState('')
  async function load() { try { const [promo, products] = await Promise.all([cmsRequest('/promotions'), cmsRequest('/catalog/products')]); setPromotions(promo); const details = await Promise.all(products.map((product) => cmsRequest(`/catalog/products/${product.id}`))); setVariants(details.flatMap((product) => (product.variants || []).map((variant) => ({ value: variant.id, label: `${product.name} · ${variant.name} · ${money(variant.price)}` })))); } catch (err) { setError(err.message) } }
  useEffect(() => { load() }, [])
  async function disable(item) { if (!confirm(`Disable ${item.name}?`)) return; await cmsRequest(`/promotions/${item.id}`, { method: 'DELETE' }); load() }
  return <div className="admin-page"><PageHeader eyebrow="MERCHANDISING" title="Promotions" description="Schedule flash sales and override variant prices without changing the base catalog price." action={<Button onClick={() => setEditing(null)}>+ New promotion</Button>} /><ErrorBox error={error} /><Panel title="Campaigns" subtitle={`${promotions.length} promotion records`}><div className="admin-card-list">{promotions.map((item) => <article className="admin-row-card" key={item.id}><div className="admin-promo-icon">⚡</div><div className="admin-row-card-copy"><div><strong>{item.name}</strong><Pill value={item.isActive ? 'Active' : 'Inactive'} /></div><p>{item.items?.length || 0} variants · {item.isFlashSale ? 'Flash Sale' : 'Promotion'}</p><small>{date(item.startsAt)} → {date(item.endsAt)}</small></div><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditing(item)}>Edit</Button><Button tone="danger" onClick={() => disable(item)}>Disable</Button></div></article>)}</div></Panel>{editing !== undefined && <Modal title={editing ? 'Edit promotion' : 'Create promotion'} onClose={() => setEditing(undefined)} wide><PromotionForm item={editing} variantOptions={variants} onDone={() => { setEditing(undefined); load() }} /></Modal>}</div>
}

function ArticleCategoryForm({ item, onDone }) { const [form, setForm] = useState(item || { name: '', slug: '', isActive: true, sortOrder: 0 }); const [error, setError] = useState(''); async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/articles/categories/${item.id}` : '/articles/categories', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug || slugify(form.name), isActive: form.isActive, sortOrder: Number(form.sortOrder || 0) }) }); onDone() } catch (err) { setError(err.message) } } return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field><Field label="Sort order"><TextInput type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field><Field label="Status"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save category</button></div></form> }
function ArticleForm({ item, categories, onDone }) { const [form, setForm] = useState(item ? { ...item, publishedAt: toInputDate(item.publishedAt) } : { categoryId: categories[0]?.id || '', title: '', slug: '', excerpt: '', content: '', thumbnailUrl: '', authorName: '', isPublished: false, isFeatured: false, publishedAt: '' }); const [error, setError] = useState(''); const set = (key, value) => setForm((old) => ({ ...old, [key]: value })); async function save(e) { e.preventDefault(); try { await cmsRequest(item ? `/articles/${item.id}` : '/articles', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ categoryId: form.categoryId, title: form.title, slug: form.slug || slugify(form.title), excerpt: form.excerpt, content: form.content, thumbnailUrl: form.thumbnailUrl, authorName: form.authorName || null, isPublished: form.isPublished, isFeatured: form.isFeatured, publishedAt: form.isPublished ? toIso(form.publishedAt || new Date()) : form.publishedAt ? toIso(form.publishedAt) : null }) }); onDone() } catch (err) { setError(err.message) } } return <form className="admin-form-grid" onSubmit={save}><ErrorBox error={error} /><Field label="Title" wide><TextInput value={form.title} onChange={(e) => set('title', e.target.value)} required /></Field><Field label="Slug"><TextInput value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.title)} /></Field><Field label="Category"><Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} options={categories.map((category) => ({ value: category.id, label: category.name }))} /></Field><Field label="Author"><TextInput value={form.authorName || ''} onChange={(e) => set('authorName', e.target.value)} /></Field><Field label="Published at"><TextInput type="datetime-local" value={form.publishedAt || ''} onChange={(e) => set('publishedAt', e.target.value)} /></Field><Field label="Thumbnail URL" wide><TextInput value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)} required /></Field><Field label="Excerpt" wide><TextArea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} required /></Field><Field label="Content" wide><TextArea rows={14} value={form.content} onChange={(e) => set('content', e.target.value)} required /></Field><Field label="Publishing"><Toggle checked={form.isPublished} onChange={(v) => set('isPublished', v)} label="Published" /></Field><Field label="Homepage"><Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Featured" /></Field><div className="admin-form-actions"><Button tone="ghost" onClick={onDone}>Cancel</Button><button className="admin-button admin-button--primary">Save article</button></div></form> }

function ArticlesPage() {
  const [tab, setTab] = useState('articles'); const [articles, setArticles] = useState([]); const [categories, setCategories] = useState([]); const [editing, setEditing] = useState(undefined); const [error, setError] = useState('')
  async function load() { try { const [a, c] = await Promise.all([cmsRequest('/articles'), cmsRequest('/articles/categories')]); setArticles(a); setCategories(c) } catch (err) { setError(err.message) } } useEffect(() => { load() }, [])
  async function remove(item) { if (!confirm(`${tab === 'articles' ? 'Delete' : 'Disable'} ${item.title || item.name}?`)) return; await cmsRequest(tab === 'articles' ? `/articles/${item.id}` : `/articles/categories/${item.id}`, { method: 'DELETE' }); load() }
  return <div className="admin-page"><PageHeader eyebrow="EDITORIAL" title="Articles" description="Draft, schedule, publish, feature, and organize editorial content." action={<Button onClick={() => setEditing(null)}>+ New {tab === 'articles' ? 'article' : 'category'}</Button>} /><ErrorBox error={error} /><div className="admin-tabs"><button className={tab === 'articles' ? 'is-active' : ''} onClick={() => { setTab('articles'); setEditing(undefined) }} type="button">articles</button><button className={tab === 'categories' ? 'is-active' : ''} onClick={() => { setTab('categories'); setEditing(undefined) }} type="button">categories</button></div>{tab === 'articles' ? <Panel title="Editorial library" subtitle={`${articles.length} articles`}><div className="admin-table-wrap"><table><thead><tr><th>Article</th><th>Category</th><th>Publishing</th><th>Updated</th><th /></tr></thead><tbody>{articles.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.slug}</small></td><td>{item.categoryName}</td><td><Pill value={item.isPublished ? item.isFeatured ? 'Featured' : 'Published' : 'Draft'} /></td><td>{date(item.updatedAt)}</td><td><div className="admin-row-actions"><Button tone="ghost" onClick={async () => setEditing(await cmsRequest(`/articles/${item.id}`))}>Edit</Button><Button tone="danger" onClick={() => remove(item)}>Delete</Button></div></td></tr>)}</tbody></table></div></Panel> : <Panel title="Article categories" subtitle="Public article taxonomy"><div className="admin-card-list">{categories.map((item) => <article className="admin-row-card" key={item.id}><div className="admin-promo-icon">#</div><div className="admin-row-card-copy"><div><strong>{item.name}</strong><Pill value={item.isActive ? 'Active' : 'Inactive'} /></div><p>{item.articleCount} articles</p><small>{item.slug}</small></div><div className="admin-row-actions"><Button tone="ghost" onClick={() => setEditing(item)}>Edit</Button><Button tone="danger" onClick={() => remove(item)}>Disable</Button></div></article>)}</div></Panel>}{editing !== undefined && <Modal title={`${editing ? 'Edit' : 'Create'} ${tab === 'articles' ? 'article' : 'category'}`} onClose={() => setEditing(undefined)} wide={tab === 'articles'}>{tab === 'articles' ? <ArticleForm item={editing} categories={categories} onDone={() => { setEditing(undefined); load() }} /> : <ArticleCategoryForm item={editing} onDone={() => { setEditing(undefined); load() }} />}</Modal>}</div>
}

function OrdersPage() {
  const [orders, setOrders] = useState([]); const [detail, setDetail] = useState(null); const [filters, setFilters] = useState({ status: '', paymentStatus: '', q: '' }); const [error, setError] = useState(''); const [total, setTotal] = useState(0)
  async function load() { const params = new URLSearchParams({ page: '1', pageSize: '50' }); if (filters.status) params.set('status', filters.status); if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus); if (filters.q) params.set('q', filters.q); try { const result = await cmsRequest(`/orders?${params}`); setOrders(result.items || []); setTotal(result.totalItems || 0) } catch (err) { setError(err.message) } }
  useEffect(() => { load() }, [filters.status, filters.paymentStatus])
  async function open(item) { try { setDetail(await cmsRequest(`/orders/${item.id}`)) } catch (err) { setError(err.message) } }
  async function updateOrder(type, value) { try { await cmsRequest(`/orders/${detail.id}/${type}`, { method: 'PUT', body: JSON.stringify({ status: value }) }); setDetail(await cmsRequest(`/orders/${detail.id}`)); load() } catch (err) { setError(err.message) } }
  async function updateShipment(status, trackingNumber) { try { await cmsRequest(`/orders/${detail.id}/shipment`, { method: 'PUT', body: JSON.stringify({ status, trackingNumber: trackingNumber || null }) }); setDetail(await cmsRequest(`/orders/${detail.id}`)); load() } catch (err) { setError(err.message) } }
  return <div className="admin-page"><PageHeader eyebrow="OPERATIONS" title="Orders" description="Inspect customer orders, reconcile operational statuses, payment state, and merchandise shipment fulfillment." /><ErrorBox error={error} /><Panel title="Order queue" subtitle={`${total} total orders`} action={<div className="admin-order-filters"><Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} options={[{ value: '', label: 'All order status' }, ...ORDER_STATUSES]} /><Select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} options={[{ value: '', label: 'All payment status' }, ...PAYMENT_STATUSES]} /><input placeholder="Search order/customer" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} /><Button tone="ghost" onClick={load}>Search</Button></div>}><div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Order status</th><th>Payment</th><th>Created</th><th /></tr></thead><tbody>{orders.map((item) => <tr key={item.id}><td><strong>{item.orderNumber}</strong><small>{item.itemCount} items</small></td><td>{item.customerName || 'Guest'}</td><td>{money(item.grandTotal)}</td><td><Pill value={item.status} /></td><td><Pill value={item.paymentStatus} /></td><td>{date(item.createdAt)}</td><td><Button tone="ghost" onClick={() => open(item)}>View</Button></td></tr>)}</tbody></table></div></Panel>{detail && <Modal title={detail.orderNumber} onClose={() => setDetail(null)} wide><OrderDetail detail={detail} onStatus={(value) => updateOrder('status', value)} onPayment={(value) => updateOrder('payment-status', value)} onShipment={updateShipment} /></Modal>}</div>
}

function OrderDetail({ detail, onStatus, onPayment, onShipment }) {
  const [tracking, setTracking] = useState(detail.shipment?.trackingNumber || '')
  return <div className="admin-order-detail"><div className="admin-order-summary"><div><small>Customer</small><strong>{detail.customerName || '—'}</strong><span>{detail.customerEmail || detail.customerPhone || 'No contact'}</span></div><div><small>Grand total</small><strong>{money(detail.grandTotal)}</strong><span>{detail.currency}</span></div><div><small>Created</small><strong>{date(detail.createdAt)}</strong><span>{detail.paymentProvider || 'No provider'}</span></div></div><div className="admin-order-controls"><Field label="Order status"><Select value={detail.status} onChange={(e) => onStatus(e.target.value)} options={ORDER_STATUSES} /></Field><Field label="Payment status"><Select value={detail.paymentStatus} onChange={(e) => onPayment(e.target.value)} options={PAYMENT_STATUSES} /></Field></div><Panel title="Items" subtitle={`${detail.items.length} line items`}><div className="admin-mini-list">{detail.items.map((item) => <div key={item.id}><div><strong>{item.productName}</strong><small>{item.variantName || item.sku}</small></div><span>× {item.quantity}</span><span>{money(item.unitPrice)}</span><span>{money(item.lineTotal)}</span></div>)}</div></Panel>{detail.shipment && <Panel title="Shipment" subtitle={`${detail.shipment.provider} · ${detail.shipment.serviceName}`}><div className="admin-shipment-grid"><div><small>Status</small><Pill value={detail.shipment.status} /></div><div><small>Destination</small><strong>{detail.shipment.city}, {detail.shipment.province}</strong><span>{detail.shipment.postalCode}</span></div><div><small>Shipping cost</small><strong>{money(detail.shipment.cost)}</strong><span>{detail.shipment.totalWeightGrams}g</span></div></div><div className="admin-shipment-controls"><input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" /><Select value={detail.shipment.status} onChange={(e) => onShipment(e.target.value, tracking)} options={SHIPMENT_STATUSES} /></div></Panel>}{detail.transactions?.length > 0 && <Panel title="Payment transactions"><div className="admin-mini-list">{detail.transactions.map((tx) => <div key={tx.id}><div><strong>{tx.provider}</strong><small>{tx.providerReference || 'No reference'}</small></div><Pill value={tx.status} /><span>{money(tx.amount)}</span><span>{date(tx.createdAt)}</span></div>)}</div></Panel>}</div>
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
  return <div className="admin-page"><PageHeader eyebrow="BRAND SYSTEM" title="Site settings" description="Global brand, footer, social, and payment-method content served by the backend." /><ErrorBox error={error} /><Notice message={notice} />{data.settings && <SiteSettingsForm item={data.settings} onSave={updateSettings} />}<div className="admin-settings-grid"><CollectionEditor title="Footer links" items={data.footer} fields={footerFields} onCreate={(body) => mutate('/site/footer-links', 'POST', body)} onUpdate={(id, body) => mutate(`/site/footer-links/${id}`, 'PUT', body)} onDelete={(item) => confirm(`Delete ${item.label}?`) && mutate(`/site/footer-links/${item.id}`, 'DELETE')} /><CollectionEditor title="Social links" items={data.socials} fields={socialFields} onCreate={(body) => mutate('/site/social-links', 'POST', body)} onUpdate={(id, body) => mutate(`/site/social-links/${id}`, 'PUT', body)} onDelete={(item) => confirm(`Delete ${item.platform}?`) && mutate(`/site/social-links/${item.id}`, 'DELETE')} /><CollectionEditor title="Payment methods" items={data.payments} fields={paymentFields} onCreate={(body) => mutate('/site/payment-methods', 'POST', body)} onUpdate={(id, body) => mutate(`/site/payment-methods/${id}`, 'PUT', body)} onDelete={(item) => confirm(`Delete ${item.name}?`) && mutate(`/site/payment-methods/${item.id}`, 'DELETE')} /></div></div>
}
function SiteSettingsForm({ item, onSave }) { const [form, setForm] = useState({ logoUrl: item.logoUrl || '', brandDescription: item.brandDescription || '', copyrightText: item.copyrightText || '', contactTeamLabel: item.contactTeamLabel || '', contactTeamUrl: item.contactTeamUrl || '' }); return <Panel title="Brand & contact" subtitle="Global settings used by site/footer responses"><form className="admin-form-grid" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, logoUrl: form.logoUrl || null, contactTeamUrl: form.contactTeamUrl || null }) }}><Field label="Logo URL" wide><TextInput value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></Field><Field label="Brand description" wide><TextArea value={form.brandDescription} onChange={(e) => setForm({ ...form, brandDescription: e.target.value })} required /></Field><Field label="Copyright"><TextInput value={form.copyrightText} onChange={(e) => setForm({ ...form, copyrightText: e.target.value })} required /></Field><Field label="Contact CTA label"><TextInput value={form.contactTeamLabel} onChange={(e) => setForm({ ...form, contactTeamLabel: e.target.value })} required /></Field><Field label="Contact CTA URL" wide><TextInput value={form.contactTeamUrl} onChange={(e) => setForm({ ...form, contactTeamUrl: e.target.value })} /></Field><div className="admin-form-actions"><button className="admin-button admin-button--primary">Save site settings</button></div></form></Panel> }

export default function AdminApp() {
  const [session, setSession] = useState(getAdminSession)
  if (!session) return <Login onLogin={setSession} />
  return <Shell session={session} onLogout={() => { logoutAdmin(); setSession(null) }} />
}
