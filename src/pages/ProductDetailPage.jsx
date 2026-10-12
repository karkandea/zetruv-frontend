import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Flame, Gem, ShoppingCart, Star, UserRound } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductBenefits from '../components/ProductBenefits'
import { productDetailAssets as media } from '../data/productDetailAssets'
import { getDemoTopUp } from '../data/topUpDemoCatalog'
import { getTopUpCurrencyArt } from '../data/topUpCurrencyAssets'
import { addCartItem } from '../services/cartService'
import { getCatalogProduct } from '../services/catalogService'
import '../styles/product-detail.css'
import '../styles/product-detail-improvements.css'
import '../styles/product-detail-sidebar.css'

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
  const [account, setAccount] = useState({ userId: '', zone: '' })
  const [tab, setTab] = useState('Diamonds')
  const [notice, setNotice] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => window.sessionStorage.getItem('zetruv-auth-preview') === '1')

  useEffect(() => {
    let active = true
    const demo = getDemoTopUp(slug)
    setProduct(demo)
    setSelectedId(demo?.variants?.[0]?.id || '')
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
  const accountFields = useMemo(() => (product?.inputFields || [])
    .filter((field) => field.scope === 'AccountValidation')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [product])
  const firstField = accountFields[0]
  const secondField = accountFields[1]
  const firstLabel = firstField?.label || product?.accountLabels?.first || 'User ID'
  const secondLabel = secondField?.label || product?.accountLabels?.second || 'Zona / Server'
  const showSecond = Boolean(secondField || product?.accountLabels?.needsSecond)
  const secondRequired = secondField ? secondField.isRequired : Boolean(product?.accountLabels?.needsSecond)
  const isValidField = (value, field, required = true) => {
    const trimmed = String(value || '').trim()
    if (!trimmed) return !required
    const limit = Number(field?.maxLength || 200)
    if (trimmed.length > limit) return false
    return field?.type !== 'Number' || /^\d+$/.test(trimmed)
  }
  const validUserId = isValidField(account.userId, firstField)
  const validZone = !showSecond || isValidField(account.zone, secondField, secondRequired)
  const verified = validUserId && validZone
  const regularPrice = Number(selected?.price ?? selected?.effectivePrice ?? 0)
  const unitPrice = Number(selected?.effectivePrice ?? selected?.price ?? 0)
  const discount = Math.max(0, regularPrice - unitPrice)
  const subtotal = regularPrice
  // Keep parity with the existing digital cart's current fixed service fee.
  const serviceFee = 2000
  const total = Math.max(0, subtotal - discount) + serviceFee
  const maxQuantity = selected?.stockQuantity === null || selected?.stockQuantity === undefined
    ? 99 : Math.max(1, Math.min(99, Number(selected.stockQuantity)))
  const canPurchase = Boolean(selected?.isAvailable !== false && (selected?.stockQuantity == null || Number(selected.stockQuantity) > 0) && verified && Number.isFinite(unitPrice) && unitPrice > 0)
  const gameArt = product?.thumbnailUrl || product?.game?.imageUrl || media.gameCover
  const productName = product?.name || ''
  const incompleteFields = [
    ...(!validUserId ? [firstLabel] : []),
    ...(showSecond && !validZone ? [secondLabel] : []),
  ]
  const ctaHint = selected?.isAvailable === false
    ? 'Paket ini sedang tidak tersedia. Pilih paket lain.'
    : !verified
      ? `Lengkapi ${incompleteFields.join(' dan ')} untuk menambahkan ke keranjang.`
      : ''

  function add() {
    if (!selected || !canPurchase) return
    addCartItem({
      accountKey: `${account.userId.trim()}:${account.zone.trim()}`,
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
      regularPrice,
      quantity: 1,
      maxQuantity,
      accountFields: { userId: account.userId.trim(), zone: account.zone.trim() },
      accountLabel: `${firstLabel}: ${account.userId.trim()}${showSecond && account.zone.trim() ? ` / ${account.zone.trim()}` : ''}`,
    })
    setNotice('added')
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
              <ProductBenefits />
            </div>
          </div>
        </section>

        <div className="product-detail-container product-detail-layout">
          <section className="product-selection-panel">
            <div className="product-selection-heading"><h2>Pilih Item</h2><div className="product-category-tabs"><button className="active" type="button">{product.category?.name || 'Top Up'}</button></div></div>
            <div className="sku-grid">{product.variants.map((item, index) => <button type="button" key={item.id} className={`sku-card${selectedId === item.id ? ' active' : ''}`} disabled={item.isAvailable === false} aria-pressed={selectedId === item.id} onClick={() => { setSelectedId(item.id); setNotice('') }}><span className="sku-art"><TopUpCurrencyIcon slug={slug} variant={item} index={index} /></span><span className="sku-card__copy"><strong>{item.name}</strong><small>{rupiah(item.effectivePrice ?? item.price)}</small></span>{item.isOnSale && <span className="sku-flash"><Flame size={12} fill="#f0592c" />Flashsale</span>}</button>)}</div>

            <section className="product-reviews"><h2>Ulasan Produk</h2><div className="rating-summary"><div className="rating-summary__score"><div><Star size={30} fill="#ffa300" strokeWidth={0} /><strong>4.8</strong><span>/5</span></div><small>394 Ulasan</small></div><div className="rating-distribution">{[[5,86],[4,10],[3,3],[2,1],[1,0]].map(([n,w]) => <div className="rating-row" key={n}><span>{n}</span><Star size={12} fill="#ffa300" strokeWidth={0}/><i><b style={{width:`${w}%`}} /></i></div>)}</div></div><div className="review-divider"/><h3>Ulasan Terakhir</h3><div className="review-grid">{[['D***h','Cepat banget, langsung masuk.'],['A***n','Proses aman dan mudah.'],['R***a','Mantap, bakal order lagi.']].map(([name,text]) => <article className="review-card" key={name}><div className="review-card__top"><UserRound size={18}/><strong>{name}</strong><span>2 hari lalu</span></div><Stars small/><p>{text}</p></article>)}</div></section>
          </section>

          <aside className="product-order-panel pdp-order-sidebar" aria-label="Data akun dan ringkasan pesanan">
            <div className="pdp-account-block">
              <label htmlFor="pdp-user-id">
                {firstLabel}
                <div className="pdp-input">
                  <UserRound size={16} aria-hidden="true" />
                  <input id="pdp-user-id" name="userId" type="text"
                    value={account.userId}
                    placeholder={firstField?.placeholder || firstLabel}
                    maxLength={firstField?.maxLength || 200}
                    inputMode={firstField?.type === 'Number' ? 'numeric' : 'text'}
                    autoComplete="off"
                    required
                    aria-invalid={Boolean(account.userId.trim()) && !validUserId}
                    onChange={(event) => { setAccount((prev) => ({ ...prev, userId: event.target.value })); setNotice('') }}
                  />
                </div>
              </label>
              {showSecond && (
                <label htmlFor="pdp-zone">
                  {secondLabel}{!secondRequired && <span className="pdp-field-optional"> (opsional)</span>}
                  <input id="pdp-zone" name="zone" type="text"
                    value={account.zone}
                    placeholder={secondField?.placeholder || secondLabel}
                    maxLength={secondField?.maxLength || 200}
                    inputMode={secondField?.type === 'Number' ? 'numeric' : 'text'}
                    autoComplete="off"
                    required={secondRequired}
                    aria-invalid={Boolean(account.zone.trim()) && !validZone}
                    onChange={(event) => { setAccount((prev) => ({ ...prev, zone: event.target.value })); setNotice('') }}
                  />
                </label>
              )}
              <p className="pdp-account-help">
                {firstField?.helpText || 'Masukkan data akun tujuan sesuai profil game.'}
                {showSecond && secondField?.helpText ? ` ${secondField.helpText}` : ''}
                {' '}Pastikan data benar sebelum melanjutkan.
              </p>
            </div>

            <section className="pdp-sidebar-summary" aria-labelledby="pdp-order-summary-title">
              <h2 id="pdp-order-summary-title">Ringkasan Pesanan</h2>
              <div className="pdp-sidebar-item">
                <span className="pdp-sidebar-item__art" aria-hidden="true">
                  <TopUpCurrencyIcon slug={slug} variant={selected} index={product.variants.findIndex((item) => item.id === selected.id)} />
                </span>
                <div className="pdp-sidebar-item__name">
                  <strong>{selected.name}</strong>
                  <small>{product.game?.name || product.name}</small>
                </div>
                <strong className="pdp-sidebar-item__price">{rupiah(unitPrice)}</strong>
              </div>

              <div className="pdp-sidebar-pricing">
                <div><span>Subtotal</span><strong>{rupiah(subtotal)}</strong></div>
                <div><span>Biaya layanan</span><strong>{rupiah(serviceFee)}</strong></div>
                <div><span>Diskon</span><strong className={discount > 0 ? 'pdp-sidebar-discount' : ''}>{discount > 0 ? `−${rupiah(discount)}` : rupiah(0)}</strong></div>
              </div>
              <div className="pdp-sidebar-total">
                <span>Total Pembayaran</span>
                <strong>{rupiah(total)}</strong>
              </div>
            </section>

            {product.isDemo && <p className="pdp-sidebar-preview">Paket dan harga contoh untuk QA, bukan harga transaksi final.</p>}
            <div className="pdp-sidebar-action">
              <button className="pdp-sidebar-add" type="button" disabled={!canPurchase} onClick={add}>
                <ShoppingCart size={18} strokeWidth={1.9} aria-hidden="true" />
                <span>Tambah ke Keranjang</span>
              </button>
              {ctaHint && <p className="pdp-sidebar-cta-hint" role="status">{ctaHint}</p>}
            </div>

            {notice === 'added' && (
              <div className="pdp-sidebar-feedback" role="status" aria-live="polite">
                <div className="pdp-sidebar-feedback__heading">
                  <CheckCircle2 size={19} aria-hidden="true" />
                  <strong>Berhasil ditambahkan!</strong>
                </div>
                <p>{selected.name} sudah masuk keranjang.</p>
                <div className="pdp-sidebar-feedback__actions">
                  <a href="/search">Lanjut Belanja</a>
                  <a href="/cart">Lihat Keranjang <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
              </div>
            )}

          </aside>
        </div>
      </main>
    </div>
  )
}
