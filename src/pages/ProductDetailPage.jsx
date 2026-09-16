import { useEffect, useMemo, useState } from 'react'
import { Flame, Globe2, Headphones, Minus, Plus, Star, UserRound, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'
import { productDetailAssets as media } from '../data/productDetailAssets'
import { addCartItem } from '../services/cartService'
import { getCatalogProduct } from '../services/catalogService'
import '../styles/product-detail.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

const fallbackProduct = {
  id: 'mlbb-preview', slug: 'mobile-legends', name: 'Mobile Legends: Bang Bang', kind: 'TopUpGame',
  fulfillmentMethod: 'AUTO_ID', category: { name: 'Diamonds' }, game: { name: 'Mobile Legends', publisher: 'Moonton' },
  variants: [
    { id: '5', name: '5 Diamond', price: 1234, effectivePrice: 1234, isAvailable: true, isOnSale: true },
    { id: '50', name: '50 Diamond', price: 12000, effectivePrice: 12000, isAvailable: true },
    { id: '100', name: '100 Diamond', price: 24000, effectivePrice: 24000, isAvailable: true },
    { id: '250', name: '250 Diamond', price: 59000, effectivePrice: 59000, isAvailable: true },
    { id: '500', name: '500 Diamond', price: 115000, effectivePrice: 115000, isAvailable: true },
  ],
}

function skuArt(name = '') {
  if (/\b5\b/.test(name)) return media.diamond5
  if (/\b50\b/.test(name)) return media.diamond50
  if (/\b100\b/.test(name)) return media.diamond100
  if (/\b250\b/.test(name)) return media.diamond250
  return media.diamond500
}

function Stars({ small = false }) {
  return <span className={`pdp-stars${small ? ' is-small' : ''}`}>{[0,1,2,3,4].map((n) => <Star key={n} fill="#fed218" strokeWidth={0} />)}</span>
}

export default function ProductDetailPage({ slug = 'mobile-legends' }) {
  const [product, setProduct] = useState(fallbackProduct)
  const [selectedId, setSelectedId] = useState('5')
  const [quantity, setQuantity] = useState(1)
  const [account, setAccount] = useState({ userId: '', zone: '' })
  const [tab, setTab] = useState('Diamonds')
  const [notice, setNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1')

  useEffect(() => {
    let active = true
    getCatalogProduct(slug).then((data) => {
      if (!active) return
      if (data.kind === 'TopUpLogin') { window.location.replace(`/product/${data.slug}/login`); return }
      setProduct({ ...fallbackProduct, ...data, variants: data.variants?.length ? data.variants : fallbackProduct.variants })
      const first = data.variants?.find((item) => item.isAvailable) || data.variants?.[0]
      if (first) setSelectedId(first.id)
    }).catch(() => {})
    return () => { active = false }
  }, [slug])

  const selected = useMemo(() => product.variants.find((item) => item.id === selectedId) || product.variants[0], [product, selectedId])
  const unitPrice = selected?.effectivePrice ?? selected?.price ?? 0
  const serviceFee = 2000
  const subtotal = unitPrice * quantity
  const verified = Boolean(account.userId.trim() && account.zone.trim())

  function add(goToCart) {
    if (!selected || !verified) return
    addCartItem({
      accountKey: `${account.userId}:${account.zone}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productKind: product.kind,
      fulfillmentMethod: product.fulfillmentMethod || 'AUTO_ID',
      thumbnailUrl: media.diamond5,
      gameName: product.game?.name || 'Mobile Legends',
      variantId: selected.id,
      variantName: selected.name,
      unitPrice,
      regularPrice: selected.price ?? unitPrice,
      quantity,
      maxQuantity: 99,
      accountFields: { userId: account.userId, zone: account.zone },
      accountLabel: `ZetruvPlayer · ${account.userId} / ${account.zone}`,
    })
    if (goToCart) window.location.href = '/cart'
    else setNotice('Produk ditambahkan ke keranjang.')
  }

  return (
    <div className="product-detail-shell">
      <Navbar variant={isAuthenticated ? 'loginCatalog' : 'default'} onAuthenticated={() => { window.sessionStorage.setItem('zetruv-auth-preview', '1'); setIsAuthenticated(true) }} />
      <main className="product-detail-page">
        <section className="product-hero pdp-figma-hero">
          <img className="pdp-hero-image" src={media.heroBackground} alt="" />
          <div className="product-hero__shade" />
          <div className="product-detail-container product-hero__content">
            <div className="product-game-cover"><img src={media.gameCover} alt="Mobile Legends" /></div>
            <div className="product-hero__copy">
              <h1>Mobile Legends: Bang Bang</h1>
              <div className="product-rating-line"><strong>Moonton</strong><span className="product-rating-number">4,6</span><Stars /><span>(2rb)</span></div>
              <div className="product-benefits">
                <span><Zap size={16} />Proses Cepat</span><span><Headphones size={16} />Dukungan Chat 24/7</span><span><Globe2 size={16} />Global Region</span>
              </div>
            </div>
          </div>
        </section>

        <div className="product-detail-container product-detail-layout">
          <section className="product-selection-panel">
            <div className="product-selection-heading"><h2>Pilih Item</h2><div className="product-category-tabs"><button className={tab === 'Diamonds' ? 'active' : ''} onClick={() => setTab('Diamonds')}>Diamonds</button><button className={tab === 'Starlight' ? 'active' : ''} onClick={() => setTab('Starlight')}>Starlight</button></div></div>
            <div className="sku-grid">{product.variants.slice(0, 5).map((item) => <button type="button" key={item.id} className={`sku-card${selectedId === item.id ? ' active' : ''}`} onClick={() => { setSelectedId(item.id); setQuantity(1) }}><span className="sku-art"><img src={skuArt(item.name)} alt="" /></span><span className="sku-card__copy"><strong>{item.name}</strong><small>{rupiah(item.effectivePrice ?? item.price)}</small></span>{item.isOnSale && <span className="sku-flash"><Flame size={12} fill="#f0592c" />Flashsale</span>}</button>)}</div>

            <section className="product-reviews"><h2>Ulasan Produk</h2><div className="rating-summary"><div className="rating-summary__score"><div><Star size={30} fill="#ffa300" strokeWidth={0} /><strong>4.8</strong><span>/5</span></div><small>394 Ulasan</small></div><div className="rating-distribution">{[[5,86],[4,10],[3,3],[2,1],[1,0]].map(([n,w]) => <div className="rating-row" key={n}><span>{n}</span><Star size={12} fill="#ffa300" strokeWidth={0}/><i><b style={{width:`${w}%`}} /></i></div>)}</div></div><div className="review-divider"/><h3>Ulasan Terakhir</h3><div className="review-grid">{[['D***h','Cepat banget, langsung masuk.'],['A***n','Proses aman dan mudah.'],['R***a','Mantap, bakal order lagi.']].map(([name,text]) => <article className="review-card" key={name}><div className="review-card__top"><UserRound size={18}/><strong>{name}</strong><span>2 hari lalu</span></div><Stars small/><p>{text}</p></article>)}</div></section>
          </section>

          <aside className="product-order-panel">
            <div className="pdp-account-block"><label>User ID<div className="pdp-input"><UserRound size={16}/><input value={account.userId} onChange={(e)=>setAccount({...account,userId:e.target.value})} placeholder="Masukkan User ID" /></div></label><label>Zona<input value={account.zone} onChange={(e)=>setAccount({...account,zone:e.target.value})} placeholder="Masukkan Zona" /></label><small>Pastikan User ID dan Zona sudah sesuai dengan akun tujuan.</small></div>
            <div className="selected-item-box"><div className="selected-item-row"><div><strong>{selected?.name}</strong><span>{rupiah(unitPrice)} / item</span></div><div className="quantity-stepper"><button onClick={()=>setQuantity(v=>Math.max(1,v-1))}><Minus size={14}/></button><strong>{quantity}</strong><button onClick={()=>setQuantity(v=>v+1)}><Plus size={14}/></button></div></div><small>{verified ? `ZetruvPlayer · ${account.userId} / ${account.zone}` : 'Isi data akun untuk melanjutkan transaksi.'}</small></div>
            <div className="order-summary"><h2>Ringkasan</h2><div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div><div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div><div><span>Diskon</span><strong>Rp0</strong></div></div><div className="order-separator"/><div className="order-total"><strong>Total</strong><b>{rupiah(subtotal + serviceFee)}</b></div>
            {notice && <p className="pdp-action-message is-success">{notice}</p>}
            <div className="product-cta-stack"><button disabled={!verified} onClick={()=>add(false)}>Tambah ke Keranjang</button><button disabled={!verified} onClick={()=>add(true)}>Tambah &amp; Lihat Keranjang</button></div>
          </aside>
        </div>
      </main>
    </div>
  )
}
