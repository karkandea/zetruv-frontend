import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import { readCart } from '../services/cartService'
import '../styles/payment-flow.css'

const rupiah=(value=0)=>`Rp${new Intl.NumberFormat('id-ID').format(value)}`
const fallback={cartKey:'checkout-genshin',variantName:'980+110 Genesis Crystals',productName:'Genshin Impact',unitPrice:255000,quantity:1,fulfillmentMethod:'MANUAL_LOGIN',thumbnailUrl:'/assets/search/genshin-impact.webp'}

function LoginGate({item,onLoggedIn}){
  const [showPassword,setShowPassword]=useState(false)
  const [showRegister,setShowRegister]=useState(false)
  const subtotal=Number(item.unitPrice||255000)*Number(item.quantity||1)
  const total=subtotal+2000
  function login(e){e.preventDefault();window.sessionStorage.setItem('zetruv-auth-preview','1');onLoggedIn()}
  return <><header className="flow-title"><h1>Masuk untuk melanjutkan checkout</h1><p>Akun Zetruv diperlukan sebelum data login game dapat dimasukkan.</p></header><div className="via-login-gate-layout">
    <section className="via-gate-order-card"><h2>Pesanan yang akan dilanjutkan</h2><div className="via-order-product"><div className="via-product-thumb"><img src={item.thumbnailUrl||'/assets/search/genshin-impact.webp'} alt=""/></div><div><strong>{item.productName} · {item.variantName}</strong><span>Credential belum diminta</span></div><b>{rupiah(subtotal)}</b></div><div className="flow-info-banner"><span>i</span><p>Credential game tetap kosong sampai user berhasil login ke akun Zetruv.</p></div><div className="via-gate-totals"><div><span>Subtotal</span><b>{rupiah(subtotal)}</b></div><div><span>Biaya layanan</span><b>Rp2.000</b></div><hr/><div className="grand"><span>Total</span><strong>{rupiah(total)}</strong></div></div></section>
    <section className="via-gate-login-card"><h2>Masuk ke akun Zetruv</h2><p>Setelah login, kamu akan kembali ke checkout dan mengisi credential game.</p><form onSubmit={login}><label>Email / username<input required placeholder="nama@email.com"/></label><label>Password<div className="via-password"><input required type={showPassword?'text':'password'} placeholder="••••••••"/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'◉':'◎'}</button></div></label><button className="primary-flow-button" type="submit">Masuk</button><button className="secondary-flow-button" type="button" onClick={()=>setShowRegister(true)}>Buat akun baru</button></form><small>Belum punya akun? Registrasi tetap menggunakan flow akun Zetruv existing.</small></section>
  </div>{showRegister&&<AuthModal mode="register" onModeChange={(m)=>{if(m==='login')setShowRegister(false)}} onClose={()=>setShowRegister(false)} onAuthenticated={()=>{window.sessionStorage.setItem('zetruv-auth-preview','1');setShowRegister(false);onLoggedIn()}}/>}</>
}

export default function CheckoutPage(){
  const [authenticated,setAuthenticated]=useState(()=>window.sessionStorage.getItem('zetruv-auth-preview')==='1')
  const item=useMemo(()=>{const rows=readCart().filter((x)=>x.fulfillmentMethod==='MANUAL_LOGIN');return rows[0]||fallback},[])
  const [phone,setPhone]=useState('+62 812 3456 7890')
  const [gameEmail,setGameEmail]=useState('')
  const [gamePassword,setGamePassword]=useState('')
  const [showGamePassword,setShowGamePassword]=useState(false)
  const [paymentMethod,setPaymentMethod]=useState('QRIS')
  const [voucher,setVoucher]=useState('')
  const subtotal=Number(item.unitPrice||255000)*Number(item.quantity||1)
  const total=subtotal+2000
  function pay(){const invoice='LOGIN5678123456789INV';window.sessionStorage.setItem('zetruv-order-preview-v1',JSON.stringify({invoice,items:[{...item,accountLabel:`${gameEmail||'nama@email.com'} · PlayerLogin · Server Asia`}],subtotal,serviceFee:2000,total,paymentMethod,phone,fulfillmentMethod:'MANUAL_LOGIN',createdAt:Date.now()}));window.location.href='/payment'}
  return <div className="flow-shell"><Navbar variant={authenticated?'loginCatalog':'default'} onAuthenticated={()=>{window.sessionStorage.setItem('zetruv-auth-preview','1');setAuthenticated(true)}}/><main className="flow-page flow-container via-login-checkout-page">{!authenticated?<LoginGate item={item} onLoggedIn={()=>setAuthenticated(true)}/>:<><header className="flow-title"><h1>Checkout Via Login</h1><p>Isi data akun game, pilih pembayaran, lalu review total sebelum membayar.</p></header><div className="via-login-checkout-layout">
    <section className="via-checkout-main"><div className="contact-block"><h3>Informasi Kontak</h3><label>Nomor WhatsApp*<input value={phone} onChange={(e)=>setPhone(e.target.value)}/></label><small>Digunakan jika ada kendala atau update terkait pesanan.</small></div><h2>Data Login Game</h2><p>Data ini digunakan untuk memproses Top Up Via Login dan tidak ditampilkan kembali setelah pesanan dibuat.</p><label>Email akun game<input value={gameEmail} onChange={(e)=>setGameEmail(e.target.value)} placeholder="nama@email.com"/></label><label>Password<div className="via-password"><input value={gamePassword} onChange={(e)=>setGamePassword(e.target.value)} type={showGamePassword?'text':'password'} placeholder="••••••••"/><button type="button" onClick={()=>setShowGamePassword(v=>!v)}>{showGamePassword?'◉':'◎'}</button></div></label><div className="flow-info-banner"><span>i</span><p>Credential hanya dipakai untuk memproses order dan hanya dapat diakses pihak berwenang sesuai flow existing.</p></div><h3 className="payment-heading">Metode Pembayaran</h3><div className="via-payment-methods">{[['QRIS','Scan QR untuk bayar'],['Virtual Account','Transfer via bank'],['E-Wallet','Buka aplikasi wallet']].map(([name,desc])=><button key={name} type="button" className={paymentMethod===name?'active':''} onClick={()=>setPaymentMethod(name)}><span className="method-icon">{name==='QRIS'?'▦':name==='Virtual Account'?'▥':'▰'}</span><span><strong>{name}</strong><small>{desc}</small></span><i/></button>)}</div></section>
    <aside className="via-checkout-summary"><h2>Ringkasan Pesanan</h2><div className="via-order-product"><div className="via-product-thumb"><img src={item.thumbnailUrl||'/assets/search/genshin-impact.webp'} alt=""/></div><div><strong>{item.productName} · {item.variantName}</strong><span>1 item</span></div><b>{rupiah(subtotal)}</b></div><label>Kode Voucher<div className="voucher-inline"><input value={voucher} onChange={(e)=>setVoucher(e.target.value)} placeholder="Masukkan kode promo"/><button type="button">Pakai</button></div></label><div className="via-summary-row"><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div><div className="via-summary-row"><span>Biaya layanan</span><strong>Rp2.000</strong></div><hr/><div className="via-summary-total"><span>Total</span><strong>{rupiah(total)}</strong></div><button className="primary-flow-button" onClick={pay}>Bayar Sekarang</button></aside>
  </div></>}</main></div>
}
