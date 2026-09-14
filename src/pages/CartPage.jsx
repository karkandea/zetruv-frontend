import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { readCart, removeCartItem, updateCartQuantity, onCartChange } from '../services/cartService'
import '../styles/commerce.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
const serviceLabel = {
  AUTO_ID: 'Top Up Via ID',
  MANUAL_LOGIN: 'Top Up Via Login',
  MANUAL: 'Layanan Manual',
}

export default function CartPage() {
  const [items, setItems] = useState(() => readCart())
  useEffect(() => onCartChange(setItems), [])

  const groups = useMemo(() => Object.entries(items.reduce((all, item) => {
    const key = item.fulfillmentMethod || 'MANUAL'
    all[key] = [...(all[key] || []), item]
    return all
  }, {})), [items])

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <div className="commerce-shell">
      <Navbar variant="loginCatalog" />
      <main className="commerce-page commerce-container">
        <header className="commerce-heading">
          <div><small>KERANJANG</small><h1>Keranjang kamu</h1><p>Satu keranjang untuk semua layanan. Checkout dipisah per jenis layanan agar data fulfillment tetap jelas.</p></div>
          <strong>{items.length} produk</strong>
        </header>

        {items.length === 0 ? (
          <section className="commerce-empty"><h2>Keranjang masih kosong</h2><p>Pilih produk dulu dari katalog Zetruv.</p><a href="/search">Cari produk</a></section>
        ) : (
          <div className="cart-layout">
            <div className="cart-groups">
              {groups.map(([method, group]) => {
                const groupTotal = group.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
                return (
                  <section className="cart-group" key={method}>
                    <div className="cart-group__head"><div><small>LAYANAN</small><h2>{serviceLabel[method] || method}</h2></div><a href={`/checkout?method=${encodeURIComponent(method)}`}>Checkout layanan ini</a></div>
                    {group.map((item) => (
                      <article className="cart-item" key={item.cartKey}>
                        <img src={item.thumbnailUrl || '/assets/home/category-topup.png'} alt="" />
                        <div className="cart-item__copy"><strong>{item.productName}</strong><span>{item.variantName}</span>{item.accountLabel && <small>Akun: {item.accountLabel}</small>}</div>
                        <div className="cart-item__qty">
                          <button type="button" onClick={() => setItems(updateCartQuantity(item.cartKey, item.quantity - 1))}>−</button>
                          <b>{item.quantity}</b>
                          <button type="button" disabled={item.quantity >= (item.maxQuantity || 99)} onClick={() => setItems(updateCartQuantity(item.cartKey, item.quantity + 1))}>+</button>
                        </div>
                        <div className="cart-item__price"><strong>{rupiah(item.unitPrice * item.quantity)}</strong>{item.isOnSale && <small>Harga promo</small>}</div>
                        <button className="cart-remove" type="button" onClick={() => setItems(removeCartItem(item.cartKey))}>Hapus</button>
                      </article>
                    ))}
                    <div className="cart-group__total"><span>Subtotal {serviceLabel[method] || method}</span><strong>{rupiah(groupTotal)}</strong></div>
                  </section>
                )
              })}
            </div>
            <aside className="cart-summary"><small>TOTAL KERANJANG</small><strong>{rupiah(total)}</strong><p>Total ini bisa terbagi menjadi beberapa order karena checkout dilakukan per layanan.</p></aside>
          </div>
        )}
      </main>
    </div>
  )
}
