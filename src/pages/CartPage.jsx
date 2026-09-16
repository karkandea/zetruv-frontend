import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { readCart, removeCartItem } from '../services/cartService'
import '../styles/payment-flow.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const fallback = { cartKey:'preview-genshin-login', productName:'Genshin Impact', variantName:'980+110 Genesis Crystals', unitPrice:255000, quantity:1, fulfillmentMethod:'MANUAL_LOGIN', thumbnailUrl:'/assets/search/genshin-impact.webp' }

export default function CartPage() {
  const [isAuthenticated,setIsAuthenticated]=useState(()=>window.sessionStorage.getItem('zetruv-auth-preview')==='1')
  const [items,setItems]=useState(()=>{const rows=readCart().filter((x)=>x.fulfillmentMethod==='MANUAL_LOGIN');return rows.length?rows:[fallback]})
  const item=items[0]||fallback
  const subtotal=Number(item.unitPrice||255000)*Number(item.quantity||1)
  const total=subtotal+2000
  const title=`${item.productName||'Genshin Impact'} · ${item.variantName||'980+110 Genesis Crystals'}`

  function clear(){ if(item.cartKey!=='preview-genshin-login') removeCartItem(item.cartKey); setItems([]) }

  return <div className="flow-shell"><Navbar variant={isAuthenticated?'loginCatalog':'default'} onAuthenticated={()=>{window.sessionStorage.setItem('zetruv-auth-preview','1');setIsAuthenticated(true)}}/><main className="flow-page flow-container via-login-cart-page">
    <header className="flow-title"><h1>Keranjang Digital</h1><p>Review produk Via Login sebelum lanjut. Credential belum diminta pada tahap ini.</p></header>
    <div className="via-login-cart-layout">
      <section className="via-login-cart-card"><div className="via-login-cart-head"><strong>{items.length?1:0} produk dipilih</strong><button type="button" onClick={clear}>Hapus pilihan</button></div>{items.length>0&&<><article className="via-login-cart-item"><span className="via-login-check">✓</span><div className="via-login-cart-art"><img src={item.thumbnailUrl||'/assets/search/genshin-impact.webp'} onError={(e)=>{e.currentTarget.src='/assets/search/genshin-impact.webp'}} alt=""/></div><div className="via-login-cart-copy"><h2>{title}</h2><span>Via Login</span><p>Credential belum diminta</p></div><div className="via-login-cart-price"><strong>{rupiah(subtotal)}</strong><button type="button" onClick={clear}>×</button></div></article><div className="flow-info-banner"><span>i</span><p>Data login game akan diminta setelah kamu berhasil login ke akun Zetruv dan masuk Checkout.</p></div></>}</section>
      <aside className="via-login-summary-card"><h2>Ringkasan</h2><div className="via-summary-row"><span>{title}</span><strong>{rupiah(subtotal)}</strong></div><div className="via-summary-row"><span>Biaya layanan</span><strong>Rp2.000</strong></div><hr/><div className="via-summary-total"><span>Total</span><strong>{rupiah(total)}</strong></div><button className="primary-flow-button" onClick={()=>window.location.href='/checkout'} disabled={!items.length}>Lanjut ke Checkout →</button><p>Credential tidak pernah disimpan di keranjang.</p></aside>
    </div>
  </main></div>
}
