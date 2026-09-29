import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import { readCart } from '../services/cartService'
import { checkoutAssets } from '../data/checkoutAssets'
import '../styles/digital-commerce.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const SERVICE_FEE = 2000

const paymentMethods = [
  ['QRIS', 'Scan QR untuk bayar', checkoutAssets.qris],
  ['Virtual Account', 'Transfer via bank', checkoutAssets.virtualAccount],
  ['E-Wallet', 'Buka aplikasi wallet', checkoutAssets.ewallet],
]

const needsCredential = (item) => ['MANUAL_LOGIN', 'JOKI_MANUAL'].includes(item.fulfillmentMethod)

function productMethodLabel(item) {
  if (item.fulfillmentMethod === 'AUTO_ID') return 'Via ID'
  if (item.fulfillmentMethod === 'MANUAL_LOGIN') return 'Via Login'
  if (item.fulfillmentMethod === 'VOUCHER_CODE') return 'Voucher Game'
  if (item.fulfillmentMethod === 'JOKI_MANUAL') return 'Joki Game'
  if (item.productKind === 'GameAccount') return 'Akun Game'
  return 'Digital Product'
}

function itemSubtitle(item) {
  if (item.fulfillmentMethod === 'AUTO_ID') return item.accountLabel || 'Tujuan akun sudah diverifikasi'
  if (item.fulfillmentMethod === 'MANUAL_LOGIN') return 'Credential akun dilengkapi secara aman di checkout'
  if (item.fulfillmentMethod === 'VOUCHER_CODE') return 'Kode digital dikirim setelah pembayaran'
  if (item.fulfillmentMethod === 'JOKI_MANUAL') return 'Data akun joki dilengkapi di bawah'
  if (item.productKind === 'GameAccount') return 'Akun unik diverifikasi kembali sebelum order dibuat'
  return 'Digital product'
}

export default function CheckoutPage() {
  const items = useMemo(() => readCart(), [])
  const [authenticated, setAuthenticated] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1')
  const [authMode, setAuthMode] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1' ? null : 'login')
  const [phone, setPhone] = useState('+62 812 3456 7890')
  const [paymentMethod, setPaymentMethod] = useState('QRIS')
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [credentials, setCredentials] = useState(() => Object.fromEntries(items.filter(needsCredential).map((item) => [item.cartKey, { username: '', password: '', sameAsPrevious: false }])))
  const [showPassword, setShowPassword] = useState({})
  const [error, setError] = useState('')

  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 1), 0)
  const discount = voucherApplied ? Math.min(25000, subtotal) : 0
  const total = subtotal + (items.length ? SERVICE_FEE : 0) - discount

  const credentialItems = items.filter(needsCredential)

  function updateCredential(key, field, value) {
    setCredentials((current) => ({ ...current, [key]: { ...(current[key] || {}), [field]: value } }))
  }

  function usePreviousCredential(key, checked) {
    const index = credentialItems.findIndex((item) => item.cartKey === key)
    const previous = index > 0 ? credentials[credentialItems[index - 1].cartKey] : null
    setCredentials((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        sameAsPrevious: checked,
        username: checked && previous ? previous.username : current[key]?.username || '',
        password: checked && previous ? previous.password : current[key]?.password || '',
      },
    }))
  }

  function applyVoucher() {
    setVoucherApplied(voucher.trim().toUpperCase() === 'SAVE25')
  }

  function pay() {
    if (!authenticated) {
      setAuthMode('login')
      return
    }
    if (!items.length) {
      setError('Keranjang digital masih kosong.')
      return
    }
    const incomplete = credentialItems.find((item) => !credentials[item.cartKey]?.username.trim() || !credentials[item.cartKey]?.password.trim())
    if (incomplete) {
      setError(`Lengkapi credential untuk ${incomplete.productName} · ${incomplete.variantName}.`)
      return
    }

    const enrichedItems = items.map((item) => ({
      ...item,
      accountLabel: needsCredential(item)
        ? `${credentials[item.cartKey]?.username || 'Credential'} · data aman`
        : item.accountLabel,
    }))

    const invoice = `DIGI${Date.now().toString().slice(-12)}INV`
    window.sessionStorage.setItem('zetruv-order-preview-v1', JSON.stringify({
      invoice,
      items: enrichedItems,
      subtotal,
      serviceFee: SERVICE_FEE,
      discount,
      total,
      paymentMethod,
      phone,
      fulfillmentMethod: 'MIXED_DIGITAL',
      createdAt: Date.now(),
    }))
    window.location.href = '/payment'
  }

  return (
    <div className="digital-shell">
      <Navbar variant={authenticated ? 'loginCatalog' : 'default'} onAuthenticated={() => { setAuthenticated(true); setAuthMode(null) }} />
      <main className="digital-checkout-page digital-container">
        <header className="digital-checkout-heading">
          <h1>Checkout Digital</h1>
          <p>Periksa kembali detail pesanan, promo, metode pembayaran, dan total.</p>
        </header>

        <div className="digital-checkout-layout">
          <section className="digital-checkout-order">
            <h2>Ringkasan Pesanan</h2>

            <div className="digital-checkout-items">
              {items.length ? items.map((item) => (
                <article className="digital-checkout-item" key={item.cartKey}>
                  <img
                    className="digital-checkout-item__thumb"
                    src={item.thumbnailUrl || '/assets/search/mobile-legends.webp'}
                    alt=""
                  />
                  <div className="digital-checkout-item__copy">
                    <span className="digital-product-method">{productMethodLabel(item)}</span>
                    <strong>{item.productName} · {item.variantName}</strong>
                    <span>{itemSubtitle(item)}</span>
                  </div>
                  <b>{rupiah(Number(item.unitPrice || 0) * Number(item.quantity || 1))}</b>
                </article>
              )) : (
                <div className="digital-checkout-empty">Keranjang kosong. <a href="/search">Pilih produk</a></div>
              )}
            </div>

            <div className="digital-contact-block">
              <h3>Informasi Kontak</h3>
              <label>Nomor WhatsApp*<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <small>Digunakan jika ada kendala atau update terkait pesanan.</small>
            </div>

            {credentialItems.length > 0 && (
              <div className="digital-credential-list">
                <h3>Data Akun Game</h3>
                <p>Credential hanya diminta di checkout dan tidak pernah ditampilkan kembali setelah order dibuat.</p>
                {credentialItems.map((item, index) => {
                  const value = credentials[item.cartKey] || { username: '', password: '' }
                  return (
                    <div className="digital-credential-card" key={item.cartKey}>
                      <strong>{item.productName} · {item.variantName}</strong>
                      {index > 0 && (
                        <label className="digital-reuse-login">
                          <input type="checkbox" checked={Boolean(value.sameAsPrevious)} onChange={(event) => usePreviousCredential(item.cartKey, event.target.checked)} />
                          Gunakan akun yang sama dengan item sebelumnya
                        </label>
                      )}
                      <label>Email / username<input value={value.username} onChange={(event) => updateCredential(item.cartKey, 'username', event.target.value)} /></label>
                      <label>Password<div className="digital-password"><input type={showPassword[item.cartKey] ? 'text' : 'password'} value={value.password} onChange={(event) => updateCredential(item.cartKey, 'password', event.target.value)} /><button type="button" onClick={() => setShowPassword((current) => ({ ...current, [item.cartKey]: !current[item.cartKey] }))}>{showPassword[item.cartKey] ? 'Hide' : 'Show'}</button></div></label>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="digital-voucher">
              <label>Kode Voucher</label>
              <div><input value={voucher} onChange={(event) => { setVoucher(event.target.value); setVoucherApplied(false) }} placeholder="Masukkan kode voucher" /><button type="button" onClick={applyVoucher}>Gunakan</button></div>
              <small>{voucherApplied ? 'SAVE25 diterapkan · potongan Rp25.000.' : 'Voucher dapat memberikan potongan sesuai syarat yang berlaku.'}</small>
            </div>
          </section>

          <aside className="digital-payment-panel">
            <h2>Metode Pembayaran</h2>
            <div className="digital-payment-methods">
              {paymentMethods.map(([name, description, icon]) => (
                <button className={paymentMethod === name ? 'is-active' : ''} type="button" onClick={() => setPaymentMethod(name)} key={name}>
                  <i><img src={icon} alt="" /></i>
                  <span><strong>{name}</strong><small>{description}</small></span>
                  <b />
                </button>
              ))}
            </div>

            <div className="digital-checkout-prices">
              <div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
              <div><span>Biaya layanan</span><strong>{rupiah(items.length ? SERVICE_FEE : 0)}</strong></div>
              {discount > 0 && <div className="is-discount"><span>Voucher</span><strong>-{rupiah(discount)}</strong></div>}
            </div>
            <hr />
            <div className="digital-checkout-total"><span>Total</span><strong>{rupiah(total)}</strong></div>
            {error && <p className="digital-checkout-error">{error}</p>}
            <button className="digital-pay-button" type="button" disabled={!items.length} onClick={pay}>{authenticated ? 'Bayar Sekarang' : 'Masuk untuk Bayar'}</button>
          </aside>
        </div>
      </main>

      {authMode && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setAuthMode(null)}
          onAuthenticated={() => {
            window.sessionStorage.setItem('zetruv-auth-preview', '1')
            setAuthenticated(true)
            setAuthMode(null)
          }}
        />
      )}
    </div>
  )
}
