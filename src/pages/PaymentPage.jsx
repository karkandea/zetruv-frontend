import Navbar from '../components/Navbar'
import '../styles/digital-commerce.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function readOrder() {
  try { return JSON.parse(window.sessionStorage.getItem('zetruv-order-preview-v1') || 'null') } catch { return null }
}

const fallbackOrder = {
  invoice: 'DIGI5678123456789INV',
  subtotal: 255000,
  serviceFee: 2000,
  discount: 0,
  total: 257000,
  paymentMethod: 'QRIS',
  items: [{ productName: 'Genshin Impact', variantName: '980+110 Genesis Crystals', quantity: 1, unitPrice: 255000 }],
}

export default function PaymentPage() {
  const order = readOrder() || fallbackOrder
  const items = order.items?.length ? order.items : fallbackOrder.items

  return (
    <div className="digital-shell">
      <Navbar variant="loginCatalog" />
      <main className="digital-payment-page">
        <header className="digital-payment-heading">
          <div><h1>Selesaikan Pembayaran</h1><p>Selesaikan sebelum timer habis agar pesanan dapat diproses.</p></div>
          <span>MENUNGGU PEMBAYARAN</span>
        </header>

        <div className="digital-payment-layout">
          <section className="digital-invoice-card">
            <span>Invoice</span>
            <h2>{order.invoice}</h2>
            <h3>Detail Pemesanan</h3>
            <dl>
              <div><dt>Produk</dt><dd>{items.length} Produk Digital</dd></div>
              {items.slice(0, 3).map((item, index) => (
                <div key={item.cartKey || `${item.productName}-${index}`}><dt>Item {index + 1}</dt><dd>{item.productName} · {item.variantName}{Number(item.quantity || 1) > 1 ? ` × ${item.quantity}` : ''}</dd></div>
              ))}
              <div><dt>Metode Pembayaran</dt><dd>{order.paymentMethod || 'QRIS'}</dd></div>
              <div><dt>Status</dt><dd className="is-pending">Menunggu Pembayaran</dd></div>
            </dl>
            <button type="button" onClick={() => window.print()}>Unduh Invoice</button>
          </section>

          <section className="digital-qris-card">
            <h2>{order.paymentMethod || 'QRIS'}</h2>
            <span>Total pembayaran</span>
            <strong>{rupiah(order.total || 0)}</strong>
            <p>{order.paymentMethod === 'QRIS' ? 'Scan QR menggunakan aplikasi pembayaran pilihan kamu.' : 'Ikuti instruksi pada provider pembayaran untuk menyelesaikan transaksi.'}</p>
            <div className="digital-expiry">◷ <span>Berlaku 23:42:18</span></div>
            <div className="digital-qr" aria-label="QR payment code">
              {Array.from({ length: 64 }).map((_, index) => <i key={index} className={(index * 7 + index % 5) % 3 === 0 ? 'is-dark' : ''} />)}
            </div>
            <div className="digital-payment-actions">
              <button type="button" onClick={() => window.print()}>Unduh QR</button>
              <button type="button" onClick={() => { window.location.href = '/order-status?view=detail' }}>Cek Status</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
