import Navbar from '../components/Navbar'
import '../styles/payment-flow.css'

const rupiah=(value=0)=>`Rp${new Intl.NumberFormat('id-ID').format(value)}`
function readOrder(){try{return JSON.parse(window.sessionStorage.getItem('zetruv-order-preview-v1')||'null')}catch{return null}}

export default function PaymentPage(){
  const order=readOrder()||{invoice:'LOGIN5678123456789INV',subtotal:255000,serviceFee:2000,total:257000,paymentMethod:'QRIS',items:[{productName:'Genshin Impact',variantName:'980+110 Genesis Crystals',thumbnailUrl:'/assets/search/genshin-impact.webp'}],fulfillmentMethod:'MANUAL_LOGIN'}
  const item=order.items?.[0]||{}
  return <div className="flow-shell"><Navbar variant="loginCatalog"/><main className="flow-page flow-container via-payment-page"><header className="payment-title-row"><div className="flow-title"><h1>Selesaikan Pembayaran</h1><p>Pesanan dibuat. Selesaikan pembayaran sebelum waktu habis.</p></div><span className="status-pill pending">MENUNGGU PEMBAYARAN</span></header><div className="via-payment-layout">
    <section className="via-payment-detail"><h2>Detail Pembayaran</h2><div className="payment-meta-row"><span>Invoice</span><strong>{order.invoice}</strong></div><div className="payment-meta-row"><span>Metode</span><strong>{order.paymentMethod||'QRIS'}</strong></div><div className="via-order-product payment-product"><div className="via-product-thumb"><img src={item.thumbnailUrl||'/assets/search/genshin-impact.webp'} alt=""/></div><div><strong>{item.productName||'Genshin Impact'} · {item.variantName||'980+110 Genesis Crystals'}</strong><span>Credential sudah tersimpan aman untuk proses order</span></div><b>{rupiah(order.subtotal||255000)}</b></div><div className="via-summary-row"><span>Biaya layanan</span><strong>{rupiah(order.serviceFee||2000)}</strong></div><hr/><div className="via-summary-total"><span>Total</span><strong>{rupiah(order.total||257000)}</strong></div><div className="flow-info-banner"><span>i</span><p>Setelah pembayaran terkonfirmasi, pesanan otomatis masuk antrean admin.</p></div></section>
    <aside className="via-qris-card"><h2>QRIS</h2><div className="stable-qr" aria-label="QRIS code"><span></span></div><strong>{rupiah(order.total||257000)}</strong><p className="payment-waiting">Menunggu pembayaran · 14:59</p><small>Status pembayaran akan diperbarui otomatis.</small><button className="secondary-flow-button" onClick={()=>window.location.href=`/order-status?order=${order.invoice}`}>Simulasikan Pembayaran Selesai</button></aside>
  </div></main></div>
}
