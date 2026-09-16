import { Check, Circle, Info } from 'lucide-react'
import Navbar from '../components/Navbar'
import '../styles/payment-flow.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function readOrder() {
  try { return JSON.parse(window.sessionStorage.getItem('zetruv-order-preview-v1') || 'null') } catch { return null }
}

export default function OrderStatusPage() {
  const order = readOrder() || { invoice:'HARY5678123456789INV', total:95000 }
  return <div className="flow-shell"><Navbar variant="loginCatalog"/><main className="flow-page flow-container order-detail-page">
    <header className="order-detail-title"><div className="flow-title"><h1>Detail Pesanan</h1><p>{order.invoice} · Pesanan sedang diproses.</p></div><span className="status-pill processing">DIPROSES</span></header>
    <div className="order-detail-layout">
      <section className="order-info-card"><h2>Informasi Pesanan</h2><div className="order-meta"><div><span>ORDER ID</span><b>{order.invoice}</b></div><div><span>PEMBAYARAN</span><b className="paid-text">Dibayar</b></div><div><span>STATUS PESANAN</span><b className="processing-text">Sedang diproses</b></div></div><div className="order-line"/><h3>Produk</h3><article className="order-product"><div className="order-product-art"><img src="/assets/home/category-ring.png" alt=""/></div><div><strong>172 Diamonds</strong><span>ZetruvPlayer · 12345678 / 1234</span></div><b>Rp38.000</b></article><article className="order-product"><div className="order-product-art genshin"><img src="/assets/search/genshin-impact.webp" alt=""/></div><div><strong>Game Item</strong><span>PlayerB · 87654321 / 5678</span></div><b>Rp55.000</b></article><div className="order-line"/><div className="order-paid-total"><span>Total</span><strong>{rupiah(order.total || 95000)}</strong></div></section>
      <aside className="order-status-card"><h2>Status Pesanan</h2><div className="order-stepper"><div className="order-step complete"><span className="step-icon"><Check size={15}/></span><div><strong>Pembayaran dikonfirmasi</strong><small>Dibayar</small></div></div><div className="step-connector complete"/><div className="order-step current"><span className="step-icon"><Circle size={12} fill="currentColor"/></span><div><strong>Sedang diproses</strong><small>Pesanan sedang diproses</small></div></div><div className="step-connector"/><div className="order-step"><span className="step-icon"><Circle size={9}/></span><div><strong>Selesai</strong><small>Belum selesai</small></div></div></div><div className="order-status-note"><Info size={16}/><span>Status akan diperbarui otomatis. Kamu juga bisa mengeceknya kembali dari riwayat pesanan.</span></div></aside>
    </div>
    <div className="order-actions"><button className="secondary-flow-button" onClick={()=>window.location.href='/track-order'}>Riwayat Pesanan</button><button className="primary-flow-button" onClick={()=>window.location.href='/'}>Kembali ke Beranda</button></div>
  </main></div>
}
