import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Flame, Gem, Globe2, Headphones, Minus, Plus, ShoppingCart, Star, UserRound, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'
import { productDetailAssets as media } from '../data/productDetailAssets'
import { getDemoTopUp } from '../data/topUpDemoCatalog'
import { getTopUpCurrencyArt } from '../data/topUpCurrencyAssets'
import { addCartItem } from '../services/cartService'
import { getCatalogProduct } from '../services/catalogService'
import '../styles/product-detail.css'
import '../styles/product-detail-improvements.css'

const rupiah = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

function TopUpCurrencyIcon({ slug, variant, index }) {
  const currency = getTopUpCurrencyArt(slug, variant, index)
  if (!currency) {
    // Never show a game cover as a denomination's currency logo.
    return <span className="sku-art__placeholder" aria-hidden="true"><Gem size={21} strokeWidth={1.8} /></span>
  }
  return <img src={currency.image} alt="" loading="lazy" decoding="async" />
}

function Stars({ small = false }) {
  return <span className={`pdp-stars${small ? ' is-small' : ''}`}>{[0,1,2,3,4].map((n) => <Star key={n} fill="#fed218" strokeWidth={0} />)}</span>
}

export default function ProductDetailPage({ slug = 'mobile-legends' }) {
  const [product, setProduct] = useState(() => getDemoTopUp(slug))
  const [selectedId, setSelectedId] = useState(() => getDemoTopUp(slug)?.variants?.[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [account, setAccount] = useState({ userId: '', zone: '' })
  const [tab, setTab] = useState('Diamonds')
  const [notice, setNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1')

  useEffect(() => {
    let active = true
    const demo = getDemoTopUp(slug)
    setProduct(demo)
    setSelectedId(demo?.variants?.[0]?.id || '')
    setQuantity(1)
    setAccount({ userId: '', zone: '' })
    setNotice('')
    setTab(demo?.category?.name || '')

    getCatalogProduct(slug).then((data) => {
      if (!active) return
      // A different kind or slug must never populate this PDP.
      if (data.kind === 'TopUpLogin' && !demo) {
        window.location.replace(`/product/${encodeURIComponent(data.slug)}/login`)
        return
      }
      if (data.kind !== 'TopUpGame' || data.slug !== slug) return
      const merged = {
        ...demo,
        ...data,
        accountLabels: data.accountLabels || demo?.accountLabels || { first: 'Player ID', second: '', needsSecond: false },
        variants: data.variants?.length ? data.variants : (demo?.variants || []),
        isDemo: false,
      }
      setProduct(merged)
      const first = merged.variants.find((item) => item.isAvailable) || merged.variants[0]
      setSelectedId(first?.id || '')
    }).catch(() => {
      // The demo entry is valid for its own slug only.
      if (active) setProduct(demo)
    })
    return () => { active = false }
  }, [slug])

  const selected = useMemo(() => product?.variants?.find((item) => item.id === selectedId) || product?.variants?.[0], [product, selectedId])
  const unitPrice = selected?.effectivePrice ?? selected?.price ?? 0
  const serviceFee = 2000
  const subtotal = unitPrice * quantity
  const maxQuantity = Math.max(1, Math.min(99, Number.isFinite(Number(selected?.stockQuantity))
    && selected?.stockQuantity !== null ? Number(selected.stockQuantity) : 99))
  const accountLabels = product?.accountLabels || { first: 'Player ID', second: '', needsSecond: false }
  const verified = Boolean(account.userId.trim() && (!accountLabels.needsSecond || account.zone.trim()))
  const canPurchase = Boolean(selected?.isAvailable !== false && verified && maxQuantity > 0)
  const gameArt = product?.thumbnailUrl || product?.game?.imageUrl || media.gameCover
  const productName = product?.name || ''

  function add(goToCart) {
    if (!selected || !canPurchase) return
    addCartItem({
      accountKey: `${account.userId}:${account.zone}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productKind: product.kind,
      fulfillmentMethod: product.fulfillmentMethod || 'AUTO_ID',
      thumbnailUrl: gameArt,
      gameName: product.game?.name || product.name,
      variantId: selected.id,
      variantName: selected.name,
      unitPrice,
      regularPrice: selected.price ?? unitPrice,
      quantity,
      maxQuantity,
      accountFields: { userId: account.userId, zone: account.zone },
      accountLabel: `${accountLabels.first}: ${account.userId}${accountLabels.needsSecond ? ` / ${account.zone}` : ''}`,
    })
    if (goToCart) window.location.href = '/cart'
    else setNotice('Produk ditambahkan ke keranjang.')
  }

  if (!product || !selected) {
    return <div className="product-detail-shell"><Navbar /><main className="product-detail-page" style={{ paddingTop: 170, minHeight: '75vh', textAlign: 'center' }}><h1>Produk tidak ditemukan</h1><p>Produk ini belum tersedia di katalog.</p><a href="/search">Kembali ke katalog</a></main></div>
  }

  return (
    <div className="product-detail-shell">
      <Navbar variant={isAuthenticated ? 'loginCatalog' : 'default'} onAuthenticated={() => { window.sessionStorage.setItem('zetruv-auth-preview', '1'); setIsAuthenticated(true) }} />
      <main className="product-detail-page">
        <section className="product-hero pdp-figma-hero">
          <img className="pdp-hero-image" src={slug === 'mobile-legends' ? media.heroBackground : gameArt} alt="" />
          <div className="product-hero__shade" />
          <div className="product-detail-container product-hero__content">
            <div className="product-game-cover"><img src={gameArt} alt={productName} /></div>
            <div className="product-hero__copy">
              <h1>{productName}</h1>
              <div className="product-rating-line"><strong>{product.game?.publisher || 'Game'}</strong><span className="product-rating-number">4,6</span><Stars /><span>(2rb)</span></div>
              <div className="product-benefits" aria-label="Keunggulan layanan">
                <span><Zap className="pdp-benefit-icon pdp-benefit-icon--fast" size={16} strokeWidth={2} aria-hidden="true" />Proses Cepat</span>
                <span><Headphones className="pdp-benefit-icon pdp-benefit-icon--support" size={16} strokeWidth={2} aria-hidden="true" />Dukungan Chat 24/7</span>
                <span><Globe2 className="pdp-benefit-icon pdp-benefit-icon--globe" size={16} strokeWidth={2} aria-hidden="true" />Global Region</span>
              </div>
            </div>
          </div>
        </section>

        <div className="product-detail-container product-detail-layout">
          <section className="product-selection-panel">
            <div className="product-selection-heading"><h2>Pilih Item</h2><div className="product-category-tabs"><button className="active" type="button">{product.category?.name || 'Top Up'}</button></div></div>
            <div className="sku-grid">{product.variants.map((item, index) => <button type="button" key={item.id} className={`sku-card${selectedId === item.id ? ' active' : ''}`} disabled={item.isAvailable === false} aria-pressed={selectedId === item.id} onClick={() => { setSelectedId(item.id); setQuantity(1); setNotice('') }}><span className="sku-art"><TopUpCurrencyIcon slug={slug} variant={item} index={index} /></span><span className="sku-card__copy"><strong>{item.name}</strong><small>{rupiah(item.effectivePrice ?? item.price)}</small></span>{item.isOnSale && <span className="sku-flash"><Flame size={12} fill="#f0592c" />Flashsale</span>}</button>)}</div>

            <section className="product-reviews"><h2>Ulasan Produk</h2><div className="rating-summary"><div className="rating-summary__score"><div><Star size={30} fill="#ffa300" strokeWidth={0} /><strong>4.8</strong><span>/5</span></div><small>394 Ulasan</small></div><div className="rating-distribution">{[[5,86],[4,10],[3,3],[2,1],[1,0]].map(([n,w]) => <div className="rating-row" key={n}><span>{n}</span><Star size={12} fill="#ffa300" strokeWidth={0}/><i><b style={{width:`${w}%`}} /></i></div>)}</div></div><div className="review-divider"/><h3>Ulasan Terakhir</h3><div className="review-grid">{[['D***h','Cepat banget, langsung masuk.'],['A***n','Proses aman dan mudah.'],['R***a','Mantap, bakal order lagi.']].map(([name,text]) => <article className="review-card" key={name}><div className="review-card__top"><UserRound size={18}/><strong>{name}</strong><span>2 hari lalu</span></div><Stars small/><p>{text}</p></article>)}</div></section>
          </section>

          <aside className="product-order-panel">
            <div className="pdp-account-block"><label>{accountLabels.first}<div className="pdp-input"><UserRound size={16}/><input value={account.userId} onChange={(e)=>setAccount({...account,userId:e.target.value})} placeholder={accountLabels.first} /></div></label>{accountLabels.needsSecond && <label>{accountLabels.second}<input value={account.zone} onChange={(e)=>setAccount({...account,zone:e.target.value})} placeholder={accountLabels.second} /></label>}<small>Periksa identitas akun tujuan sebelum melanjutkan.</small></div>
            <div className="selected-item-box">
              <div className="selected-item-box__heading"><span>Item dipilih</span><a href="#pdp-packages" onClick={(event) => { event.preventDefault(); document.querySelector('.product-selection-heading')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>Ubah item</a></div>
              <div className="selected-item-row">
                <div className="selected-item-row__details">
                  <span className="selected-item-row__art"><TopUpCurrencyIcon slug={slug} variant={selected} index={product.variants.findIndex(v => v.id === selected.id)} /></span>
                  <span className="selected-item-row__copy"><strong>{selected.name}</strong><span>{rupiah(unitPrice)} / item</span></span>
                </div>
                <div className="quantity-stepper" role="group" aria-label="Jumlah paket">
                  <button type="button" aria-label="Kurangi jumlah" disabled={quantity <= 1} onClick={() => { setQuantity(v => Math.max(1, v - 1)); setNotice('') }}><Minus size={16} strokeWidth={2} aria-hidden="true" /></button>
                  <output aria-label="Jumlah">{quantity}</output>
                  <button type="button" aria-label="Tambah jumlah" disabled={quantity >= maxQuantity || selected.isAvailable === false} onClick={() => { setQuantity(v => Math.min(maxQuantity, v + 1)); setNotice('') }}><Plus size={16} strokeWidth={2} aria-hidden="true" /></button>
                </div>
              </div>
              <div className="selected-item-box__meta">
                <span>{quantity} × {rupiah(unitPrice)} = <strong>{rupiah(subtotal)}</strong></span>
                {selected.stockQuantity !== null && selected.stockQuantity !== undefined && <small>Stok: {selected.stockQuantity}</small>}
              </div>
              <small className="selected-item-box__account">{verified ? `${accountLabels.first}: ${account.userId}${accountLabels.needsSecond ? ` / ${account.zone}` : ''}` : 'Masukkan data akun tujuan untuk melanjutkan.'}</small>
            </div>
            <div className="order-summary"><h2>Ringkasan</h2><div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div><div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div><div><span>Diskon</span><strong>Rp0</strong></div></div><div className="order-separator"/><div className="order-total"><strong>Total</strong><b>{rupiah(subtotal + serviceFee)}</b></div>
            {product.isDemo && <p className="pdp-action-message">Harga dan paket contoh untuk QA; belum merupakan harga transaksi final.</p>}
            {notice && <p className="pdp-action-message is-success">{notice}</p>}
            <div className="product-cta-stack">
              <button className="pdp-cta pdp-cta--secondary" type="button" disabled={!canPurchase} onClick={() => add(false)}><ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />Tambah ke Keranjang</button>
              <button className="pdp-cta pdp-cta--primary" type="button" disabled={!canPurchase} onClick={() => add(true)}><ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />Tambah &amp; Lihat Keranjang<ArrowRight size={17} strokeWidth={2} aria-hidden="true" /></button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
