import { useEffect, useMemo, useState } from 'react'
import { Edit3, Info, Minus, Plus, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { onCartChange, readCart, removeCartItem, updateCartQuantity } from '../services/cartService'
import '../styles/payment-flow.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const previewItems = [
  { cartKey: 'preview-ml', productName: 'Mobile Legends: Bang Bang', variantName: '172 Diamonds', unitPrice: 38000, quantity: 1, maxQuantity: 99, fulfillmentMethod: 'AUTO_ID', accountLabel: 'ZetruvPlayer · 12345678 / 1234', thumbnailUrl: '/assets/home/category-ring.png' },
  { cartKey: 'preview-genshin', productName: 'Genshin Impact', variantName: '980+110 Genesis Crystals', unitPrice: 55000, quantity: 1, maxQuantity: 99, fulfillmentMethod: 'MANUAL_LOGIN', accountLabel: '', thumbnailUrl: '/assets/search/genshin-impact.webp' },
]

export default function CartPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1')
  const [isPreview, setIsPreview] = useState(() => readCart().length === 0)
  const [items, setItems] = useState(() => { const cart = readCart(); return cart.length ? cart : previewItems })
  const [selected, setSelected] = useState(() => new Set(items.map((item) => item.cartKey)))

  useEffect(() => {
    if (isPreview) return undefined
    return onCartChange((next) => { setItems(next); setSelected(new Set(next.map((item) => item.cartKey))) })
  }, [isPreview])

  const selectedItems = useMemo(() => items.filter((item) => selected.has(item.cartKey)), [items, selected])
  const subtotal = selectedItems.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 1), 0)
  const serviceFee = selectedItems.length ? 2000 : 0
  const allSelected = items.length > 0 && selected.size === items.length

  function toggleAll() { setSelected(allSelected ? new Set() : new Set(items.map((item) => item.cartKey))) }
  function toggleOne(key) { setSelected((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next }) }
  function changeQty(item, nextQty) {
    if (isPreview) setItems((current) => current.map((row) => row.cartKey === item.cartKey ? { ...row, quantity: Math.max(1, nextQty) } : row))
    else setItems(updateCartQuantity(item.cartKey, nextQty))
  }
  function remove(item) {
    if (isPreview) setItems((current) => current.filter((row) => row.cartKey !== item.cartKey))
    else setItems(removeCartItem(item.cartKey))
    setSelected((current) => { const next = new Set(current); next.delete(item.cartKey); return next })
  }

  return (
    <div className="flow-shell">
      <Navbar variant={isAuthenticated ? 'loginCatalog' : 'default'} onAuthenticated={() => { window.sessionStorage.setItem('zetruv-auth-preview','1'); setIsAuthenticated(true) }} />
      <main className="flow-page flow-container">
        <header className="flow-title"><h1>Keranjang Digital</h1><p>Review produk digital, tujuan akun, dan jumlah sebelum lanjut checkout.</p></header>

        <div className="digital-cart-layout">
          <section className="digital-cart-card">
            <div className="cart-select-head"><label><input type="checkbox" checked={allSelected} onChange={toggleAll}/><span>{selectedItems.length} produk dipilih</span></label><button type="button" onClick={() => selectedItems.forEach(remove)}>Hapus pilihan</button></div>
            <div className="cart-list">{items.map((item) => {
              const isLogin = item.fulfillmentMethod === 'MANUAL_LOGIN'
              return <article className="digital-cart-item" key={item.cartKey}>
                <input className="item-check" type="checkbox" checked={selected.has(item.cartKey)} onChange={() => toggleOne(item.cartKey)} />
                <div className="cart-art"><img src={item.thumbnailUrl || (isLogin ? '/assets/search/genshin-impact.webp' : '/assets/home/category-ring.png')} alt="" onError={(e)=>{e.currentTarget.src=isLogin?'/assets/search/genshin-impact.webp':'/assets/home/category-ring.png'}} /></div>
                <div className="cart-item-copy"><span className="cart-kind">{isLogin ? 'Via Login' : 'Via ID'}</span><h2>{isLogin ? `${item.productName} · ${item.variantName}` : item.variantName}</h2>{isLogin ? <p>Credential belum diminta</p> : <p>{item.accountLabel || 'ZetruvPlayer · 12345678 / 1234'}</p>}{!isLogin && <button type="button" className="link-button"><Edit3 size={13}/>Ubah data</button>}</div>
                <div className="cart-item-side"><strong>{rupiah(item.unitPrice * item.quantity)}</strong><div className="cart-qty"><button type="button" onClick={()=>changeQty(item,item.quantity-1)}><Minus size={13}/></button><b>{item.quantity}</b><button type="button" onClick={()=>changeQty(item,item.quantity+1)}><Plus size={13}/></button></div></div>
                <button className="cart-trash" type="button" aria-label="Hapus produk" onClick={()=>remove(item)}><Trash2 size={17}/></button>
              </article>
            })}</div>
            <div className="cart-info"><Info size={16}/><span>Jika User ID / ID Zona diubah, akun harus diverifikasi ulang sebelum checkout.</span></div>
          </section>

          <aside className="digital-summary-card"><h2>Ringkasan</h2><div className="summary-lines">{selectedItems.map((item)=><div key={item.cartKey}><span>{item.variantName} × {item.quantity}</span><strong>{rupiah(item.unitPrice*item.quantity)}</strong></div>)}<div className="summary-divider"/><div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div><div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div></div><div className="summary-divider"/><div className="summary-total"><span>Total</span><strong>{rupiah(subtotal+serviceFee)}</strong></div><button className="primary-flow-button" disabled={!selectedItems.length} onClick={()=>{ window.location.href='/checkout' }}>Lanjut ke Checkout <span>→</span></button><p className="summary-note">Produk merchandise akan diproses melalui checkout terpisah.</p></aside>
        </div>
      </main>
    </div>
  )
}
