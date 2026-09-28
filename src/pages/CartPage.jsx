import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { readCart, removeCartItem, updateCartQuantity } from '../services/cartService'
import '../styles/digital-commerce.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const methodLabel = {
  AUTO_ID: 'Top Up Via ID',
  MANUAL_LOGIN: 'Top Up Via Login',
  VOUCHER_CODE: 'Voucher Game',
  JOKI_MANUAL: 'Joki Game',
}

function itemContext(item) {
  if (item.fulfillmentMethod === 'AUTO_ID') return item.accountLabel || 'Data akun tujuan sudah tersimpan'
  if (item.fulfillmentMethod === 'MANUAL_LOGIN') return 'Credential diisi aman saat checkout'
  if (item.fulfillmentMethod === 'VOUCHER_CODE') return 'Kode voucher dikirim setelah pembayaran'
  if (item.fulfillmentMethod === 'JOKI_MANUAL') return 'Data akun joki diisi saat checkout'
  return 'Digital product'
}

export default function CartPage() {
  const [items, setItems] = useState(() => readCart())
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 1), 0), [items])
  const serviceFee = items.length ? 2000 : 0
  const total = subtotal + serviceFee

  function changeQty(item, nextQty) {
    const next = Math.max(1, Math.min(item.maxQuantity || 99, nextQty))
    setItems(updateCartQuantity(item.cartKey, next))
  }

  function remove(item) {
    setItems(removeCartItem(item.cartKey))
  }

  return (
    <div className="digital-shell">
      <Navbar />
      <main className="digital-cart-page digital-container">
        <header className="digital-page-heading">
          <div><h1>Keranjang Digital</h1><p>Review semua produk digital sebelum melanjutkan ke checkout.</p></div>
          <a href="/search">Lanjut Belanja</a>
        </header>

        <div className="digital-info-strip">
          <b>i</b>
          <span>Produk digital dapat digabung dalam satu pembayaran. Data akun yang sensitif baru diminta di checkout.</span>
        </div>

        <div className="digital-cart-layout">
          <section className="digital-cart-list-card">
            <div className="digital-cart-list-head">
              <strong>{items.length} produk dipilih</strong>
              {items.length > 0 && <span>{items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)} item</span>}
            </div>

            {items.length === 0 ? (
              <div className="digital-empty-cart">
                <strong>Keranjang digital masih kosong</strong>
                <p>Pilih Top Up, Voucher, atau Joki Game untuk mulai transaksi.</p>
                <a href="/search">Browse Products</a>
              </div>
            ) : (
              <div className="digital-cart-items">
                {items.map((item) => {
                  const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 1)
                  return (
                    <article className="digital-cart-item" key={item.cartKey}>
                      <img src={item.thumbnailUrl || '/assets/search/mobile-legends.webp'} alt="" />
                      <div className="digital-cart-item__copy">
                        <span>{methodLabel[item.fulfillmentMethod] || item.productKind || 'Digital Product'}</span>
                        <h2>{item.productName} · {item.variantName}</h2>
                        <p>{itemContext(item)}</p>
                        <button type="button" onClick={() => remove(item)}>Hapus</button>
                      </div>
                      <div className="digital-cart-item__side">
                        <strong>{rupiah(lineTotal)}</strong>
                        <div className="digital-qty">
                          <button type="button" onClick={() => changeQty(item, Number(item.quantity || 1) - 1)}>−</button>
                          <span>{item.quantity || 1}</span>
                          <button type="button" onClick={() => changeQty(item, Number(item.quantity || 1) + 1)}>+</button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {items.some((item) => item.fulfillmentMethod === 'MANUAL_LOGIN') && (
              <div className="digital-login-cart-rule">
                <strong>Top Up Via Login multi-product</strong>
                <p>Setiap baris produk diproses sebagai target akun tersendiri. Jika beberapa item memakai akun yang sama, kamu bisa memakai ulang credential di checkout tanpa menyimpannya di cart.</p>
              </div>
            )}
          </section>

          <aside className="digital-cart-summary">
            <h2>Ringkasan</h2>
            <div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
            <div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div>
            <hr />
            <div className="digital-cart-summary__total"><span>Total</span><strong>{rupiah(total)}</strong></div>
            <button type="button" disabled={!items.length} onClick={() => { window.location.href = '/checkout' }}>Lanjut ke Checkout</button>
            <p>Login akan diminta sebagai popup jika akun Zetruv belum aktif.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}
