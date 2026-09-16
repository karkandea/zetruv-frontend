import Navbar from '../components/Navbar'
import '../styles/payment-flow.css'

const rupiah=(value=0)=>`Rp${new Intl.NumberFormat('id-ID').format(value)}`
function readOrder(){try{return JSON.parse(window.sessionStorage.getItem('zetruv-order-preview-v1')||'null')}catch{return null}}

export default function OrderStatusPage(){
  const order=readOrder()||{invoice:'LOGIN5678123456789INV',total:257000,subtotal:255000,items:[{productName:'Genshin Impact',variantName:'980+110 Genesis Crystals',thumbnailUrl:'/assets/search/genshin-impact.webp',accountLabel:'nama@email.com · PlayerLogin · Server Asia'}]}
  const item=order.items?.[0]||{}
  const shortId=order.invoice?.length>10?`${order.invoice.slice(0,5)}...${order.invoice.slice(-5)}`:order.invoice
  return <div className="flow-shell"><Navbar variant="loginCatalog"/><main className="flow-page flow-container via-order-page"><header className="order-detail-title"><div className="flow-title"><h1>Detail Pesanan</h1><p>{order.invoice} · Pesanan sedang diproses.</p></div><span className="status-pill processing">DIPROSES</span></header><div className="via-order-layout">
    <section className="via-order-info"><h2>Informasi Pesanan</h2><div className="via-order-meta"><div><span>ORDER ID</span><strong>{shortId}</strong></div><div><span>PEMBAYARAN</span><strong className="paid">Dibayar</strong></div><div><span>STATUS PESANAN</span><strong className="processing">Sedang diproses</strong></div></div><hr/><h3>Produk</h3><div className="via-order-product order-detail-product"><div className="via-product-thumb"><img src={item.thumbnailUrl||'/assets/search/genshin-impact.webp'} alt=""/></div><div><strong>{item.productName||'Genshin Impact'} · {item.variantName||'980+110 Genesis Crystals'}</strong><span>{item.accountLabel||'nama@email.com · PlayerLogin · Server Asia'}</span></div><b>{rupiah(order.subtotal||255000)}</b></div><div className="flow-info-banner"><span>i</span><p>Password tidak ditampilkan kembali pada detail pesanan.</p></div><div className="via-order-total"><span>Total</span><strong>{rupiah(order.total||257000)}</strong></div></section>
    <aside className="via-order-status"><h2>Status Pesanan</h2><div className="via-stepper"><div className="step complete"><i>✓</i><div><strong>Pembayaran dikonfirmasi</strong><span>Dibayar</span></div></div><div className="connector complete"/><div className="step current"><i>◎</i><div><strong>Sedang diproses</strong><span>Pesanan sedang diproses tim Zetruv</span></div></div><div className="connector current"/><div className="step upcoming"><i></i><div><strong>Selesai</strong><span>Belum selesai</span></div></div></div></aside>
  </div><div className="via-order-actions"><button className="secondary-flow-button" onClick={()=>window.location.href='/track-order'}>Riwayat Pesanan</button><button className="primary-flow-button" onClick={()=>window.location.href='/'}>Kembali ke Beranda</button></div></main></div>
}
