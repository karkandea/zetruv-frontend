import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Info,
  Landmark,
  MapPin,
  MessageCircle,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import AuthModal from '../components/AuthModal'
import {
  gameAccountGames,
  getAccount,
  getAccounts,
  getGame,
  readGameAccountCart,
  rupiahAccount,
  saveGameAccountCart,
} from '../data/gameAccountCatalog'
import { gameAccountFlowAssets } from '../data/gameAccountFlowAssets'
import '../styles/game-accounts.css'

const SERVICE_FEE = 2000
const ORDER_KEY = 'zetruv-order-preview-v1'
const AUTH_PREVIEW_KEY = 'zetruv-auth-preview'

function accountImage(slug) {
  return gameAccountFlowAssets.games[slug] || gameAccountFlowAssets.games['dota-2']
}

function GameImage({ game, className = '', eager = true }) {
  return (
    <img
      className={className}
      src={accountImage(game.slug)}
      alt={game.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

function RatingStars({ size = 17 }) {
  return (
    <span className="ga-stars" aria-label="4.8 dari 5">
      {[0, 1, 2, 3, 4].map((item) => <Star key={item} size={size} fill="currentColor" />)}
    </span>
  )
}

function readAccountOrder() {
  try {
    return JSON.parse(window.sessionStorage.getItem(ORDER_KEY) || 'null')
  } catch {
    return null
  }
}

export function GameAccountsPage() {
  const [query, setQuery] = useState('')
  const visibleGames = useMemo(
    () => gameAccountGames.filter((game) => (game.name + ' ' + game.publisher).toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <div className="ga-shell">
      <Navbar variant="loginCatalog" />
      <main className="ga-picker ga-container">
        <p className="ga-breadcrumb"><a href="/">Beranda</a><span>/</span><span>Akun Game</span></p>
        <h1>Akun Game</h1>
        <p className="ga-lead">Pilih game dulu untuk melihat akun yang tersedia.</p>

        <form className="ga-search-row" onSubmit={(event) => event.preventDefault()}>
          <label>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari game..." />
          </label>
          <button type="submit">Cari</button>
        </form>

        <h2>Game populer</h2>
        <div className="ga-game-grid">
          {visibleGames.map((game) => (
            <button
              type="button"
              className="ga-game-card"
              key={game.slug}
              onClick={() => { window.location.href = '/game-accounts/' + game.slug }}
            >
              <GameImage game={game} />
              <span>
                <strong>{game.name}</strong>
                <small>{game.publisher}</small>
              </span>
              <ChevronRight size={20} />
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export function GameAccountListingPage({ gameSlug }) {
  const game = getGame(gameSlug)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('available')
  const accounts = useMemo(
    () => getAccounts(game.slug).filter((item) => (item.title + ' ' + item.region + ' ' + item.tags.join(' ')).toLowerCase().includes(query.toLowerCase())),
    [game.slug, query],
  )

  return (
    <div className="ga-shell">
      <Navbar variant="loginCatalog" />
      <main className="ga-list-page ga-container">
        <p className="ga-breadcrumb">
          <a href="/">Beranda</a><span>/</span><a href="/game-accounts">Akun Game</a><span>/</span><span>{game.name}</span>
        </p>

        <header className="ga-list-head">
          <GameImage game={game} />
          <div>
            <h1>Akun {game.name}</h1>
            <p>Bandingkan akun berdasarkan rank, hero, item, dan region.</p>
          </div>
          <div className="ga-stock-tabs">
            <button type="button" className={tab === 'available' ? 'active' : ''} onClick={() => setTab('available')}>Tersedia (18)</button>
            <button type="button" className={tab === 'sold' ? 'active' : ''} onClick={() => setTab('sold')}>Sudah Terjual (42)</button>
          </div>
        </header>

        <div className="ga-list-tools">
          <label>
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari rank, hero, item, atau ID listing..." />
          </label>
          <button type="button">Harga</button>
          <button type="button">Region</button>
          <button type="button">Rank</button>
          <button type="button">Server</button>
          <button type="button">Heroes</button>
          <select defaultValue="recommended" aria-label="Urutkan akun">
            <option value="recommended">Urutkan: Rekomendasi</option>
            <option value="low">Harga Terendah</option>
          </select>
        </div>

        <div className="ga-account-grid">
          {accounts.map((item) => (
            <article className={'ga-account-card' + (item.available ? '' : ' sold')} key={item.slug}>
              <div className="ga-account-art">
                <img src={gameAccountFlowAssets.dotaListing} alt="" loading="eager" decoding="async" />
                <span className={item.available ? 'available' : 'sold-out'}>{item.available ? 'AVAILABLE' : 'SOLD OUT'}</span>
              </div>
              <div className="ga-account-copy">
                <h2>{item.title}</h2>
                <p>{item.region} · Level {item.level} · Full access</p>
                <div className="ga-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="ga-account-price-row">
                  <strong>{rupiahAccount(item.price)}</strong>
                  <button
                    type="button"
                    disabled={!item.available}
                    onClick={() => { window.location.href = '/game-accounts/' + game.slug + '/' + item.slug }}
                  >
                    {item.available ? 'Lihat Detail' : 'Terjual'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="ga-history">
          <div><strong>Sudah terjual</strong><span>42 akun tersimpan sebagai referensi harga dan spesifikasi.</span></div>
          <button type="button" onClick={() => setTab('sold')}>Lihat riwayat</button>
        </div>
      </main>
    </div>
  )
}

const reviewData = [
  { name: 'D***h', image: gameAccountFlowAssets.reviewOne, tags: ['Proses cepat', 'Produk sesuai'] },
  { name: 'A***n', image: gameAccountFlowAssets.reviewTwo, tags: ['Akun langsung masuk', 'Respon cepat'] },
  { name: 'R***a', image: gameAccountFlowAssets.reviewThree, tags: ['Transaksi mudah', 'Direkomendasikan'] },
]

export function GameAccountDetailPage({ gameSlug, accountSlug }) {
  const account = getAccount(gameSlug, accountSlug)
  const game = account.game
  const total = account.price + SERVICE_FEE

  function addToCart() {
    saveGameAccountCart(account)
    window.location.href = '/cart?flow=account'
  }

  return (
    <div className="ga-shell">
      <Navbar variant="loginCatalog" />
      <main className="ga-detail-page">
        <section className="ga-detail-hero">
          <img className="ga-detail-hero-bg" src={gameAccountFlowAssets.dotaDetailHero} alt="" fetchPriority="high" decoding="async" />
          <div className="ga-detail-scrim" />
          <div className="ga-detail-hero-content">
            <div className="ga-hero-thumb">
              <img src={gameAccountFlowAssets.dotaDetailThumb} alt={game.name} decoding="async" />
            </div>
            <div className="ga-detail-hero-copy">
              <h1>Akun {game.name} — {account.rank}</h1>
              <div className="ga-hero-rating">
                <span>Zetruv Digital</span>
                <b>4,8</b>
                <RatingStars size={22} />
                <small>(394)</small>
              </div>
              <div className="ga-hero-badges">
                <span><Zap size={14} fill="currentColor" />Proses Cepat</span>
                <span><MessageCircle size={14} />Dukungan Chat 24/7</span>
                <span><MapPin size={14} />Region {account.region}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="ga-detail-layout">
          <section className="ga-detail-card">
            <h2>Detail Akun</h2>
            <div className="ga-detail-specs">
              <div><small>Rank</small><strong>{account.rank}</strong></div>
              <div><small>Region</small><strong>{account.region}</strong></div>
              <div><small>Account Level</small><strong>{account.level}</strong></div>
              <div><small>Heroes</small><strong>{account.heroes}</strong></div>
              <div><small>Email</small><strong>{account.email}</strong></div>
            </div>

            <div className="ga-review-head">
              <div className="ga-review-score">
                <h2>Ulasan Toko</h2>
                <div><strong>4,8</strong><span>/5</span></div>
                <RatingStars size={18} />
                <small>394 ulasan pembeli</small>
              </div>
              <div className="ga-review-bars">
                {[92, 74, 42, 18, 8].map((bar, index) => (
                  <div key={bar}>
                    <span>{5 - index}</span>
                    <i><b style={{ width: bar + '%' }} /></i>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="ga-latest-review-title">Ulasan Pembeli Terbaru</h3>
            <div className="ga-reviews">
              {reviewData.map((review) => (
                <article key={review.name}>
                  <div className="ga-review-user">
                    <img src={review.image} alt="" loading="lazy" decoding="async" />
                    <span><strong>{review.name}</strong><small>Hari ini</small></span>
                  </div>
                  <RatingStars size={13} />
                  <div className="ga-review-tags">{review.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </article>
              ))}
            </div>
          </section>

          <aside className="ga-purchase-card">
            <h2>Produk</h2>
            <div className="ga-seller"><span>Dijual oleh</span><strong>Zetruv</strong></div>

            <div className="ga-warranty">
              <ShieldCheck size={18} />
              <div><strong>Garansi</strong><b>{account.warranty}</b><span>Garansi transaksi Zetruv aktif sampai akses akun diterima</span></div>
            </div>

            <div className="ga-selected-account">
              <strong>Akun {game.name} · {account.rank}</strong>
              <span>{rupiahAccount(account.price)} / akun</span>
              <small>1 akun unik</small>
            </div>

            <div className="ga-purchase-summary">
              <h3>Ringkasan</h3>
              <div className="ga-summary-row"><span>Subtotal</span><b>{rupiahAccount(account.price)}</b></div>
              <div className="ga-summary-row"><span>Biaya layanan</span><b>{rupiahAccount(SERVICE_FEE)}</b></div>
              <div className="ga-summary-row"><span>Diskon</span><b className="ga-discount">Rp0</b></div>
              <hr />
              <div className="ga-summary-total"><span>Total</span><strong>{rupiahAccount(total)}</strong></div>
            </div>

            <button className="ga-primary-cta" type="button" onClick={addToCart}>Tambah ke Keranjang</button>
          </aside>
        </div>
      </main>
    </div>
  )
}

export function GameAccountCartPage() {
  const copy = useStorefrontCopy()
  const account = readGameAccountCart()
  const game = account.game || getGame('dota-2')
  const [selected, setSelected] = useState(true)
  const total = account.price + SERVICE_FEE

  return (
    <div className="ga-shell">
      <Navbar variant="loginCatalog" />
      <main className="ga-cart ga-flow-1120">
        <header>
          <h1>{copy.digitalCart}</h1>
          <p>{copy.reviewYourSelectedAccountBeforeCheckout}</p>
        </header>

        <div className="ga-cart-layout">
          <section className="ga-cart-items">
            <div className="ga-cart-top">
              <div>
                <button type="button" className={'ga-check' + (selected ? ' active' : '')} onClick={() => setSelected(!selected)}><Check size={14} /></button>
                <strong>{copy.label1AccountSelected}</strong>
              </div>
              <button type="button" onClick={() => setSelected(false)}>{copy.clearSelection}</button>
            </div>

            <div className="ga-cart-item">
              <button type="button" className={'ga-check' + (selected ? ' active' : '')} onClick={() => setSelected(!selected)}><Check size={14} /></button>
              <div className="ga-cart-thumb"><GameImage game={game} /></div>
              <div>
                <h2>{copy.account} {game.name} · {account.rank} · {account.heroes} {copy.heroes}</h2>
                <span className="ga-destination"><MapPin size={12} />{copy.region} {account.region} {copy.level} {account.level} {copy.emailCanBeChanged}</span>
              </div>
              <strong>{rupiahAccount(account.price)}</strong>
              <button className="ga-remove" type="button" onClick={() => setSelected(false)} aria-label={copy.removeAccount}><X size={17} /></button>
            </div>

            <div className="ga-info"><Info size={18} /><span>{copy.thisUniqueAccountIsReservedWhenYou}</span></div>
          </section>

          <aside className="ga-cart-summary">
            <h2>{copy.summary}</h2>
            <div className="ga-summary-item"><span>{copy.account} {game.name} · {account.rank}</span><b>{rupiahAccount(account.price)}</b></div>
            <hr />
            <div className="ga-summary-row"><span>{copy.subtotal}</span><b>{rupiahAccount(account.price)}</b></div>
            <div className="ga-summary-row"><span>{copy.serviceFee}</span><b>{rupiahAccount(SERVICE_FEE)}</b></div>
            <hr />
            <div className="ga-summary-total"><span>{copy.total}</span><strong>{rupiahAccount(total)}</strong></div>
            <button
              className="ga-primary-cta"
              type="button"
              disabled={!selected}
              onClick={() => { window.location.href = '/checkout?flow=account' }}
            >
              {copy.continueToCheckout} <ChevronRight size={15} />
            </button>
            <small>{copy.merchandiseUsesASeparateCheckout}</small>
          </aside>
        </div>
      </main>
    </div>
  )
}

function AccountLoginGate({ account, onLoggedIn }) {
  const copy = useStorefrontCopy()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const total = account.price + SERVICE_FEE

  function submit(event) {
    event.preventDefault()
    window.sessionStorage.setItem(AUTH_PREVIEW_KEY, '1')
    onLoggedIn()
  }

  return (
    <>
      <div className="ga-gate-title">
        <h1>{copy.logInToContinue}</h1>
        <p>{copy.useYourZetruvAccountToContinueAnd}</p>
      </div>

      <div className="ga-gate-layout">
        <section className="ga-gate-card">
          <h2>{copy.yourOrder}</h2>
          <div className="ga-gate-order">
            <div><ShoppingCart size={26} /></div>
            <span><strong>{copy.label1GameAccount} {account.rank} · {account.heroes} {copy.heroes}</strong><small>{copy.yourCartStaysSaved}</small></span>
            <b>{rupiahAccount(account.price)}</b>
          </div>
          <div className="ga-info"><Info size={18} /><span>{copy.yourCartAndDestinationDetailsRemainSaved}</span></div>
          <div className="ga-summary-row"><span>{copy.subtotal}</span><b>{rupiahAccount(account.price)}</b></div>
          <div className="ga-summary-row"><span>{copy.serviceFee}</span><b>{rupiahAccount(SERVICE_FEE)}</b></div>
          <hr />
          <div className="ga-summary-total"><span>{copy.total}</span><strong>{rupiahAccount(total)}</strong></div>
        </section>

        <section className="ga-login-card">
          <h2>{copy.logInToYourZetruvAccount2}</h2>
          <p>{copy.afterLoggingInReturnToDigitalCheckout}</p>
          <form onSubmit={submit}>
            <label>{copy.emailOrUsername}<input type="text" placeholder="nama@email.com" required /></label>
            <label>{copy.password}
              <span className="ga-password">
                <input type={passwordVisible ? 'text' : 'password'} placeholder="••••••••" required />
                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={copy.showPassword3}>
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <button className="ga-primary-cta" type="submit">{copy.login}</button>
            <button className="ga-outline-cta" type="button" onClick={() => setShowRegister(true)}>{copy.createAccount}</button>
          </form>
          <small>{copy.newToZetruvCreateAnAccountTo}</small>
        </section>
      </div>

      {showRegister && (
        <AuthModal
          mode="register"
          onClose={() => setShowRegister(false)}
          onModeChange={(mode) => { if (mode === 'login') setShowRegister(false) }}
          onAuthenticated={() => {
            window.sessionStorage.setItem(AUTH_PREVIEW_KEY, '1')
            setShowRegister(false)
            onLoggedIn()
          }}
        />
      )}
    </>
  )
}

function PaymentMethod({ name, description, active, icon: Icon, onClick }) {
  return (
    <button type="button" className={active ? 'active' : ''} onClick={onClick}>
      <Icon size={28} />
      <span><strong>{name}</strong><small>{description}</small></span>
      <i />
    </button>
  )
}

export function GameAccountCheckoutPage() {
  const copy = useStorefrontCopy()
  const account = readGameAccountCart()
  const game = account.game || getGame('dota-2')
  const [authenticated, setAuthenticated] = useState(() => window.sessionStorage.getItem(AUTH_PREVIEW_KEY) === '1')
  const [phone, setPhone] = useState('+62 812 3456 7890')
  const [voucher, setVoucher] = useState('')
  const [method, setMethod] = useState('QRIS')
  const total = account.price + SERVICE_FEE

  function pay() {
    const order = {
      invoice: 'HARY5678123456789INV',
      items: [account],
      subtotal: account.price,
      serviceFee: SERVICE_FEE,
      total,
      paymentMethod: method,
      phone,
      createdAt: Date.now(),
    }
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify(order))
    window.location.href = '/payment?flow=account'
  }

  if (!authenticated) {
    return (
      <div className="ga-shell">
        <Navbar variant="loginCatalog" />
        <main className="ga-gate-page ga-flow-1152">
          <AccountLoginGate account={account} onLoggedIn={() => setAuthenticated(true)} />
        </main>
      </div>
    )
  }

  return (
    <div className="ga-shell ga-shell--minimal">
      <main className="ga-checkout-page ga-flow-1120">
        <header>
          <h1>{copy.digitalCheckout}</h1>
          <p>{copy.reviewYourOrderPromotionPaymentMethodAnd}</p>
        </header>

        <div className="ga-checkout-layout">
          <section className="ga-checkout-order">
            <h2>{copy.orderSummary}</h2>
            <div className="ga-checkout-row">
              <span><strong>{copy.account} {game.name} · {account.rank} · {account.heroes} {copy.heroes}</strong><small>{game.name} {copy.region2} {account.region}</small></span>
              <b>{rupiahAccount(account.price)}</b>
            </div>
            <div className="ga-checkout-row">
              <span><strong>{copy.accountDetails2}</strong><small>{copy.level2} {account.level} · {account.heroes} {copy.heroesEmailCanBeChanged}</small></span>
              <b>{copy.guarantee} {account.warranty}</b>
            </div>

            <label className="ga-voucher-label">{copy.voucherCode}</label>
            <div className="ga-voucher">
              <input value={voucher} onChange={(event) => setVoucher(event.target.value)} placeholder={copy.enterVoucherCode} />
              <button type="button">{copy.apply}</button>
            </div>
            <p className="ga-helper">{copy.voucherDiscountsAreSubjectToTheirTerms}</p>
            <div className="ga-unique-note"><Info size={16} /><span>{copy.weLlCheckTheAvailabilityOfThis}</span></div>

            <div className="ga-contact">
              <h3>{copy.contactInformation}</h3>
              <label>{copy.whatsappNumber2}<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <small>{copy.weLlUseThisNumberForOrder2}</small>
            </div>
          </section>

          <aside className="ga-payment">
            <h2>{copy.paymentMethod}</h2>
            <div className="ga-payment-options">
              <PaymentMethod name="QRIS" description={copy.scanTheQrCodeToPay} icon={QrCode} active={method === 'QRIS'} onClick={() => setMethod('QRIS')} />
              <PaymentMethod name={copy.virtualAccount} description={copy.bankTransfer2} icon={Landmark} active={method === 'Virtual Account'} onClick={() => setMethod('Virtual Account')} />
              <PaymentMethod name="E-Wallet" description={copy.openYourDigitalWallet} icon={WalletCards} active={method === 'E-Wallet'} onClick={() => setMethod('E-Wallet')} />
            </div>
            <div className="ga-payment-summary">
              <div className="ga-summary-row"><span>{copy.subtotal}</span><b>{rupiahAccount(account.price)}</b></div>
              <div className="ga-summary-row"><span>{copy.serviceFee}</span><b>{rupiahAccount(SERVICE_FEE)}</b></div>
              <hr />
              <div className="ga-summary-total"><span>{copy.total}</span><strong>{rupiahAccount(total)}</strong></div>
            </div>
            <button className="ga-primary-cta" type="button" onClick={pay}>{copy.payNow}</button>
          </aside>
        </div>
      </main>
    </div>
  )
}

export function GameAccountPaymentPage() {
  const copy = useStorefrontCopy()
  const account = readGameAccountCart()
  const order = readAccountOrder()
  const total = order?.total || account.price + SERVICE_FEE
  const invoice = order?.invoice || 'HARY5678123456789INV'

  return (
    <div className="ga-shell ga-shell--minimal">
      <div className="ga-minimal-divider" />
      <main className="ga-account-payment-page ga-flow-1120">
        <header className="ga-payment-header">
          <div><h1>{copy.completeYourPayment}</h1><p>{copy.completePaymentBeforeTheDeadlineSoWe}</p></div>
          <span>{copy.awaitingPayment2}</span>
        </header>

        <div className="ga-account-payment-layout">
          <section className="ga-invoice-card">
            <small>{copy.invoice}</small>
            <h2>{invoice}</h2>
            <h3>{copy.orderDetails}</h3>
            <div className="ga-invoice-grid">
              <span>{copy.product}</span><b>{copy.label1GameAccount2}</b>
              <span>{copy.account}</span><b>Akun Dota 2 · Divine 5 · 126 Heroes</b>
              <span>{copy.accountDetails}</span><b>Region SEA · Email dapat diubah</b>
              <span>{copy.paymentMethod}</span><b>QRIS</b>
              <span>{copy.status2}</span><b className="pending">{copy.awaitingPayment3}</b>
            </div>
            <button type="button" className="ga-invoice-download" onClick={() => window.print()}><Download size={16} />{copy.downloadInvoice}</button>
          </section>

          <section className="ga-qris-card">
            <h2>QRIS</h2>
            <small>{copy.paymentTotal}</small>
            <strong>{rupiahAccount(total)}</strong>
            <p>{copy.scanTheQrCodeUsingYourPreferred}</p>
            <div className="ga-qris-crop">
              <img src={gameAccountFlowAssets.qris} alt={copy.qrisPaymentCode} decoding="async" />
            </div>
            <div className="ga-payment-expiry"><Clock3 size={16} /><span>{copy.expiresAt234218}</span></div>
            <div className="ga-qris-actions">
              <a href={gameAccountFlowAssets.qris} download="zetruv-qris.png">{copy.downloadQrCode}</a>
              <button type="button" onClick={() => { window.location.href = '/order-status?flow=account' }}>{copy.checkStatus2}</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

const orderSteps = [
  { title: 'Pembayaran dikonfirmasi', description: 'Dibayar', state: 'done' },
  { title: 'Akun sedang disiapkan', description: 'Tim Zetruv sedang memverifikasi akun', state: 'current' },
  { title: 'Akses akun diberikan', description: 'Belum diberikan', state: 'next' },
  { title: 'Selesai', description: 'Garansi 7 hari dimulai', state: 'next' },
]

export function GameAccountOrderDetailPage() {
  const account = readGameAccountCart()
  const order = readAccountOrder()
  const total = order?.total || account.price + SERVICE_FEE

  return (
    <div className="ga-shell">
      <Navbar variant="loginCatalog" />
      <main className="ga-order-detail-page">
        <div className="ga-flow-1120">
          <header className="ga-order-header">
            <div><h1>Detail Pesanan</h1><p>Akun sedang disiapkan dan diverifikasi.</p></div>
            <span>DIPROSES</span>
          </header>

          <div className="ga-order-layout">
            <section className="ga-order-info-card">
              <h2>Informasi Pesanan</h2>
              <div className="ga-order-meta">
                <div><small>ORDER ID</small><strong>HARY...89INV</strong></div>
                <div><small>PEMBAYARAN</small><strong className="paid">Dibayar</strong></div>
                <div><small>STATUS PESANAN</small><strong>Akun sedang disiapkan</strong></div>
              </div>

              <div className="ga-order-product">
                <img src={gameAccountFlowAssets.orderAccount} alt="" decoding="async" />
                <div>
                  <small>Produk</small>
                  <strong>Akun Dota 2 · Divine 5 · 126 Heroes</strong>
                  <span>Region SEA · Level 92 · 126 Heroes · Email dapat diubah</span>
                </div>
                <b>{rupiahAccount(account.price)}</b>
              </div>

              <div className="ga-order-total"><span>Total</span><strong>{rupiahAccount(total)}</strong></div>
            </section>

            <aside className="ga-order-stepper-card">
              <h2>Status Pesanan</h2>
              <div className="ga-order-steps">
                {orderSteps.map((step, index) => (
                  <div className={'ga-order-step ' + step.state} key={step.title}>
                    <div className="ga-order-step-icon">
                      {step.state === 'done'
                        ? <img src={gameAccountFlowAssets.stepCheck} alt="" />
                        : step.state === 'current'
                          ? <img src={gameAccountFlowAssets.stepCurrent} alt="" />
                          : <span />}
                    </div>
                    {index < orderSteps.length - 1 && <i />}
                    <div><strong>{step.title}</strong><span>{step.description}</span></div>
                  </div>
                ))}
              </div>
              <div className="ga-order-note"><Info size={17} /><span>Akses akun diberikan setelah verifikasi selesai. Garansi 7 hari dimulai saat akses akun diterima.</span></div>
            </aside>
          </div>

          <div className="ga-order-actions">
            <button type="button" className="ga-outline-cta">Riwayat Pesanan</button>
            <button type="button" className="ga-primary-cta" onClick={() => { window.location.href = '/' }}>Kembali ke Beranda</button>
          </div>
        </div>
      </main>
    </div>
  )
}
