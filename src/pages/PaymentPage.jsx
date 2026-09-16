import { Clock3, Download, QrCode } from 'lucide-react'
import Navbar from '../components/Navbar'
import '../styles/payment-flow.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function readOrder() {
  try { return JSON.parse(window.sessionStorage.getItem('zetruv-order-preview-v1') || 'null') } catch { return null }
}

export default function PaymentPage() {
  const order = readOrder() || { invoice:'HARY5678123456789INV', subtotal:93000, serviceFee:2000, total:95000, paymentMethod:'QRIS' }
  function downloadQr() { window.print() }
  return <div className="flow-shell"><Navbar variant="loginCatalog"/><main className="flow-page flow-container payment-page">
    <header className="payment-title-row"><div className="flow-title"><h1>Selesaikan Pembayaran</h1><p>Selesaikan pembayaran sebelum batas waktu agar pesanan dapat diproses.</p></div><span className="status-pill pending">MENUNGGU PEMBAYARAN</span></header>
    <div className="payment-layout">
      <section className="invoice-card"><h2>Invoice</h2><div className="invoice-number">{order.invoice}</div><h3>Detail Pemesanan</h3><div className="invoice-table"><div><span>Product</span><b>2 Produk Digital</b></div><div><span>Item 1</span><b>172 Diamonds</b></div><div><span>Item 2</span><b>Game Item</b></div><div><span>Metode Pembayaran</span><b>{order.paymentMethod || 'QRIS'}</b></div><div><span>Status</span><b className="pending-text">Menunggu Pembayaran</b></div></div><button className="invoice-download" type="button" onClick={()=>window.print()}><Download size={15}/>Unduh Invoice</button></section>
      <aside className="qris-card"><div className="qris-head"><div><h2>QRIS</h2><span>Total pembayaran</span></div><strong>{rupiah(order.total || 95000)}</strong></div><div className="qr-art" aria-label="QRIS payment code"><QrCode size={148} strokeWidth={1.45}/></div><p>Scan QR menggunakan aplikasi pembayaran pilihan kamu.</p><div className="payment-timer"><Clock3 size={16}/><span>Berlaku <b>23:42:18</b></span></div><button className="primary-flow-button" type="button" onClick={downloadQr}><Download size={15}/>Unduh QR</button><button className="secondary-flow-button" type="button" onClick={()=>{window.location.href=`/order-status?order=${order.invoice}`}}>Cek Status</button></aside>
    </div>
  </main></div>
}
