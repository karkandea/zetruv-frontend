import { useMemo, useState } from 'react'
import { Eye, EyeOff, Info, Landmark, QrCode, ShoppingCart, WalletCards } from 'lucide-react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import { readCart } from '../services/cartService'
import '../styles/payment-flow.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const sampleItems = [
  { cartKey:'checkout-ml', variantName:'172 Diamonds', productName:'Mobile Legends: Bang Bang', unitPrice:38000, quantity:1, fulfillmentMethod:'AUTO_ID', accountLabel:'ZetruvPlayer · 12345678 / 1234' },
  { cartKey:'checkout-game', variantName:'Game Item', productName:'Genshin Impact', unitPrice:55000, quantity:1, fulfillmentMethod:'MANUAL_LOGIN', accountLabel:'PlayerB · 87654321 / 5678' },
]

function LoginGate({ onLoggedIn }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  function login(event) { event.preventDefault(); window.sessionStorage.setItem('zetruv-auth-preview','1'); onLoggedIn() }
  return <>
    <header className="flow-title gate-title"><h1>Masuk untuk melanjutkan checkout</h1><p>Akun Zetruv diperlukan untuk melanjutkan pembayaran dan melihat status pesanan.</p></header>
    <div className="login-gate-layout">
      <section className="gate-order-card"><h2>Pesanan yang akan dilanjutkan</h2><div className="gate-order-row"><div className="gate-cart-icon"><ShoppingCart size={23}/></div><div><strong>2 produk digital · 172 Diamonds + Game Item</strong><span>Keranjang tetap tersimpan</span></div><b>Rp93.000</b></div><div className="gate-info"><Info size={16}/><span>Keranjang dan data tujuan akan tetap tersimpan setelah kamu berhasil masuk.</span></div><div className="gate-totals"><div><span>Subtotal</span><b>Rp93.000</b></div><div><span>Biaya layanan</span><b>Rp2.000</b></div><hr/><div className="gate-grand"><span>Total</span><strong>Rp95.000</strong></div></div></section>
      <section className="gate-login-card"><h2>Masuk ke akun Zetruv</h2><p>Masukkan email atau username dan password untuk melanjutkan checkout.</p><form onSubmit={login}><label>Email / username<input required placeholder="Email atau username" autoComplete="username"/></label><label>Password<div className="password-field"><input required type={showPassword?'text':'password'} placeholder="Password" autoComplete="current-password"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label><button className="primary-flow-button" type="submit">Masuk</button><button className="secondary-flow-button" type="button" onClick={()=>setShowRegister(true)}>Buat akun baru</button></form><small>Setelah masuk, kamu akan kembali ke halaman checkout ini.</small></section>
    </div>
    {showRegister && <AuthModal mode="register" onModeChange={(mode)=>{ if(mode==='login') setShowRegister(false) }} onClose={()=>setShowRegister(false)} onAuthenticated={()=>{window.sessionStorage.setItem('zetruv-auth-preview','1');setShowRegister(false);onLoggedIn()}}/>}
  </>
}

export default function CheckoutPage() {
  const [authenticated, setAuthenticated] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1')
  const cart = useMemo(() => { const stored = readCart(); return stored.length ? stored : sampleItems }, [])
  const [phone, setPhone] = useState('+62 812 3456 7890')
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('QRIS')
  const subtotal = cart.reduce((sum,item)=>sum+Number(item.unitPrice||0)*Number(item.quantity||1),0)
  const displaySubtotal = cart === sampleItems ? 93000 : subtotal
  const serviceFee = 2000

  function pay() {
    const invoice='HARY5678123456789INV'
    window.sessionStorage.setItem('zetruv-order-preview-v1', JSON.stringify({ invoice, items:cart, subtotal:displaySubtotal, serviceFee, total:displaySubtotal+serviceFee, paymentMethod, phone, createdAt:Date.now() }))
    window.location.href='/payment'
  }

  return <div className="flow-shell"><Navbar variant={authenticated?'loginCatalog':'default'} onAuthenticated={()=>{window.sessionStorage.setItem('zetruv-auth-preview','1');setAuthenticated(true)}}/><main className="flow-page flow-container checkout-flow-page">{!authenticated ? <LoginGate onLoggedIn={()=>setAuthenticated(true)}/> : <>
    <header className="flow-title"><h1>Checkout Digital</h1><p>Periksa kembali detail pesanan, promo, metode pembayaran, dan total.</p></header>
    <div className="checkout-digital-layout">
      <section className="checkout-order-card"><h2>Ringkasan Pesanan</h2><div className="checkout-products"><article><div><strong>172 Diamonds</strong><span>ZetruvPlayer · 12345678 / 1234</span></div><b>Rp38.000</b></article><article><div><strong>Game Item</strong><span>PlayerB · 87654321 / 5678</span></div><b>Rp55.000</b></article></div><div className="checkout-section"><h3>Informasi Kontak</h3><label>Nomor WhatsApp <em>*</em><input value={phone} onChange={(e)=>setPhone(e.target.value)} /></label><p>Nomor ini digunakan untuk notifikasi status pesanan dan bantuan transaksi.</p></div><div className="checkout-section"><h3>Kode Voucher</h3><div className="voucher-field"><input value={voucher} onChange={(e)=>setVoucher(e.target.value)} placeholder="Masukkan kode voucher"/><button type="button" onClick={()=>setVoucherApplied(Boolean(voucher.trim()))}>Gunakan</button></div><p>{voucherApplied?'Voucher berhasil diterapkan.':'Gunakan voucher yang masih aktif untuk mendapatkan promo.'}</p></div><div className="checkout-data-note"><Info size={15}/><span>Pastikan data tujuan sudah benar sebelum pembayaran dilakukan.</span></div></section>
      <aside className="checkout-payment-card"><h2>Metode Pembayaran</h2><div className="payment-options"><button className={paymentMethod==='QRIS'?'active':''} onClick={()=>setPaymentMethod('QRIS')}><span className="pay-icon"><QrCode size={22}/></span><span><b>QRIS</b><small>Bayar dengan QR dari aplikasi pilihanmu.</small></span><i/></button><button className={paymentMethod==='Virtual Account'?'active':''} onClick={()=>setPaymentMethod('Virtual Account')}><span className="pay-icon"><Landmark size={22}/></span><span><b>Virtual Account</b><small>Transfer melalui virtual account bank.</small></span><i/></button><button className={paymentMethod==='E-Wallet'?'active':''} onClick={()=>setPaymentMethod('E-Wallet')}><span className="pay-icon"><WalletCards size={22}/></span><span><b>E-Wallet</b><small>Bayar dengan dompet digital.</small></span><i/></button></div><div className="checkout-totals"><div><span>Subtotal</span><b>{rupiah(displaySubtotal)}</b></div><div><span>Biaya layanan</span><b>{rupiah(serviceFee)}</b></div><hr/><div className="checkout-grand"><span>Total</span><strong>{rupiah(displaySubtotal+serviceFee)}</strong></div></div><button className="primary-flow-button pay-now" onClick={pay}>Bayar Sekarang</button></aside>
    </div>
  </>}</main></div>
}
