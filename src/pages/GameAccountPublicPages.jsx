import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import { getCatalogGames, getCatalogProduct, getCatalogProducts } from '../services/catalogService'
import { accountPrice, accountProductHref, getAccountAttributes, summarizeAccountAttributes } from '../services/gameAccountPresentation'
import '../styles/game-accounts.css'
import '../styles/game-account-live.css'

const DUMMY_GAMES = [
  { id: 'dummy-dota-2', slug: 'dota-2', name: 'Dota 2', publisher: 'Valve', imageUrl: '/assets/game-accounts/dota-2.png' },
  { id: 'dummy-mobile-legends', slug: 'mobile-legends', name: 'Mobile Legends', publisher: 'Moonton', imageUrl: '/assets/search/mobile-legends.webp' },
]

const DUMMY_ACCOUNTS = {
  'dota-2': [
    {
      id: 'dummy-dota-divine-5',
      slug: 'divine-5-126-heroes',
      kind: 'GameAccount',
      name: 'Dota 2 · Divine 5 · 126 Heroes',
      gameName: 'Dota 2',
      gameSlug: 'dota-2',
      thumbnailUrl: '/assets/game-accounts/dota-2.png',
      minPrice: 1850000,
      isAvailable: true,
      soldQuantity: 12,
      rating: 4.9,
      reviewCount: 38,
      description: 'Akun Dota 2 Divine 5 dengan 126 hero aktif dan riwayat akun yang sudah diverifikasi untuk demo storefront.',
      accountDetails: {
        attributes: [
          { key: 'rank', label: 'Rank', type: 'Text', value: 'Divine 5', showOnCard: true, sortOrder: 1 },
          { key: 'heroes', label: 'Heroes', type: 'Number', value: 126, showOnCard: true, sortOrder: 2 },
          { key: 'region', label: 'Region', type: 'Text', value: 'SEA', showOnCard: true, sortOrder: 3 },
          { key: 'mmr', label: 'MMR', type: 'Number', value: 5420, showOnCard: false, sortOrder: 4 },
          { key: 'email', label: 'Email dapat diubah', type: 'Boolean', value: true, showOnCard: false, sortOrder: 5 },
        ],
      },
      variants: [{ id: 'account-dota-divine-5', name: '1 Account', price: 1850000, effectivePrice: 1850000, isAvailable: true }],
      game: { slug: 'dota-2', name: 'Dota 2', publisher: 'Valve', imageUrl: '/assets/game-accounts/dota-2.png' },
      images: [{ id: 'dota-preview', url: '/assets/game-accounts/dota-2.png', altText: 'Dota 2 account preview' }],
    },
    {
      id: 'dummy-dota-ancient',
      slug: 'ancient-4-120-heroes',
      kind: 'GameAccount',
      name: 'Dota 2 · Ancient 4 · 120 Heroes',
      gameName: 'Dota 2',
      gameSlug: 'dota-2',
      thumbnailUrl: '/assets/game-accounts/dota-2.png',
      minPrice: 1290000,
      isAvailable: true,
      accountDetails: {
        attributes: [
          { key: 'rank', label: 'Rank', type: 'Text', value: 'Ancient 4', showOnCard: true, sortOrder: 1 },
          { key: 'heroes', label: 'Heroes', type: 'Number', value: 120, showOnCard: true, sortOrder: 2 },
          { key: 'region', label: 'Region', type: 'Text', value: 'SEA', showOnCard: true, sortOrder: 3 },
        ],
      },
      variants: [{ id: 'account-dota-ancient-4', name: '1 Account', price: 1290000, effectivePrice: 1290000, isAvailable: true }],
      game: { slug: 'dota-2', name: 'Dota 2', publisher: 'Valve', imageUrl: '/assets/game-accounts/dota-2.png' },
      images: [{ id: 'dota-preview-2', url: '/assets/game-accounts/dota-2.png', altText: 'Dota 2 account preview' }],
    },
  ],
  'mobile-legends': [
    {
      id: 'dummy-ml-mythic',
      slug: 'mythic-48-126-skins',
      kind: 'GameAccount',
      name: 'Akun ML · Mythic 48★ · 126 Skin',
      gameName: 'Mobile Legends',
      gameSlug: 'mobile-legends',
      thumbnailUrl: '/assets/search/mobile-legends.webp',
      minPrice: 1850000,
      isAvailable: true,
      accountDetails: {
        attributes: [
          { key: 'rank', label: 'Rank', type: 'Text', value: 'Mythic 48★', showOnCard: true, sortOrder: 1 },
          { key: 'skins', label: 'Skin', type: 'Number', value: 126, showOnCard: true, sortOrder: 2 },
          { key: 'region', label: 'Region', type: 'Text', value: 'Indonesia', showOnCard: true, sortOrder: 3 },
        ],
      },
      variants: [{ id: 'account-ml-mythic', name: '1 Account', price: 1850000, effectivePrice: 1850000, isAvailable: true }],
      game: { slug: 'mobile-legends', name: 'Mobile Legends', publisher: 'Moonton', imageUrl: '/assets/search/mobile-legends.webp' },
      images: [{ id: 'ml-preview', url: '/assets/search/mobile-legends.webp', altText: 'Mobile Legends account preview' }],
    },
  ],
}

function dummyAccountFor(gameSlug, accountSlug) {
  return (DUMMY_ACCOUNTS[gameSlug] || []).find((item) => item.slug === accountSlug) || null
}

function StateMessage({ children }) {
  return <div className="ga-live-state" role="status">{children}</div>
}

function GameArtwork({ image, name, className = '' }) {
  return image
    ? <img className={className} src={image} alt={name} loading="lazy" decoding="async" />
    : <div className={`ga-live-placeholder ${className}`} aria-label={name}>Akun Game</div>
}

export function GameAccountsPage() {
  const [games, setGames] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    getCatalogGames().then((rows) => { if (active) setGames(rows?.length ? rows : DUMMY_GAMES) })
      .catch(() => { if (active) { setGames(DUMMY_GAMES); setError('') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const visibleGames = useMemo(
    () => games.filter((game) => `${game.name} ${game.publisher || ''}`.toLowerCase().includes(query.trim().toLowerCase())),
    [games, query],
  )
  return <div className="ga-shell"><Navbar /><main className="ga-picker ga-container">
    <p className="ga-breadcrumb"><a href="/">Beranda</a><span>/</span><span>Akun Game</span></p>
    <h1>Akun Game</h1><p className="ga-lead">Pilih game untuk melihat listing akun yang ada.</p>
    <form className="ga-search-row" onSubmit={(event) => event.preventDefault()}>
      <label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari game..." aria-label="Cari game" /></label>
      <button type="submit">Cari</button>
    </form>
    <h2>Daftar Game</h2>
    {loading ? <StateMessage>Memuat game…</StateMessage> : error ? <StateMessage>{error}</StateMessage>
      : visibleGames.length === 0 ? <StateMessage>Game tidak ditemukan.</StateMessage>
      : <div className="ga-game-grid">{visibleGames.map((game) =>
        <a className="ga-game-card ga-live-game-link" key={game.id} href={`/game-accounts/${encodeURIComponent(game.slug)}`}>
          <GameArtwork image={game.imageUrl} name={game.name} />
          <span><strong>{game.name}</strong><small>{game.publisher || 'Game Account'}</small></span>
          <ChevronRight size={20} />
        </a>)}</div>}
  </main></div>
}

export function GameAccountListingPage({ gameSlug }) {
  const [game, setGame] = useState(null)
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getCatalogGames().then((rows) => {
      if (!active) return
      const source = rows?.length ? rows : DUMMY_GAMES
      setGame(source.find((item) => item.slug === gameSlug) || DUMMY_GAMES.find((item) => item.slug === gameSlug) || null)
    }).catch(() => {
      if (active) {
        setGame(DUMMY_GAMES.find((item) => item.slug === gameSlug) || DUMMY_GAMES[0])
        setError('')
      }
    })
    return () => { active = false }
  }, [gameSlug])
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getCatalogProducts({ kind: 'GameAccount', game: gameSlug, search: submittedQuery, page, pageSize: 24 })
      .then((result) => {
        if (!active) return
        const fallback = DUMMY_ACCOUNTS[gameSlug] || []
        const rows = result.items?.length ? result.items : fallback
        setProducts(rows)
        setTotalPages(result.items?.length ? (result.totalPages || 1) : 1)
        setTotalItems(result.items?.length ? (result.totalItems || rows.length) : rows.length)
      }).catch(() => {
        if (active) {
          const rows = DUMMY_ACCOUNTS[gameSlug] || []
          setProducts(rows)
          setTotalPages(1)
          setTotalItems(rows.length)
          setError('')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [gameSlug, submittedQuery, page])
  const visible = useMemo(() => {
    const filtered = products.filter((item) => tab === 'all' ||
      (tab === 'available' ? item.isAvailable : !item.isAvailable))
    if (sort === 'default') return filtered
    return [...filtered].sort((a, b) => {
      if (a.minPrice == null) return 1
      if (b.minPrice == null) return -1
      return sort === 'high' ? b.minPrice - a.minPrice : a.minPrice - b.minPrice
    })
  }, [products, tab, sort])
  function search(event) {
    event.preventDefault(); setPage(1); setSubmittedQuery(query.trim())
  }
  return <div className="ga-shell"><Navbar /><main className="ga-list-page ga-container">
    <p className="ga-breadcrumb"><a href="/">Beranda</a><span>/</span><a href="/game-accounts">Akun Game</a><span>/</span><span>{game?.name || gameSlug}</span></p>
    <header className="ga-list-head">
      <GameArtwork image={game?.imageUrl} name={game?.name || gameSlug} />
      <div><h1>Akun {game?.name || gameSlug}</h1><p>Informasi akun berasal dari listing yang disimpan admin.</p></div>
      <div className="ga-stock-tabs">
        {[[ 'all', 'Semua' ], [ 'available', 'Tersedia' ], [ 'unavailable', 'Tidak tersedia' ]].map(([value, label]) =>
          <button key={value} type="button" className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
      </div>
    </header>
    <form className="ga-list-tools" onSubmit={search}>
      <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama akun..." aria-label="Cari akun" /></label>
      <button type="submit">Cari</button>
      <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Urutkan halaman ini">
        <option value="default">Urutan katalog</option>
        <option value="low">Harga terendah (halaman ini)</option>
        <option value="high">Harga tertinggi (halaman ini)</option>
      </select>
    </form>
    {loading ? <StateMessage>Memuat listing…</StateMessage> : error ? <StateMessage>{error}</StateMessage>
      : visible.length === 0 ? <StateMessage>Belum ada akun untuk filter ini.</StateMessage>
      : <div className="ga-account-grid ga-live-grid">{visible.map((item) => {
        const attributes = getAccountAttributes(item.accountDetails, { cardOnly: true, limit: 3 })
        return <article className={`ga-account-card ga-live-card${item.isAvailable ? '' : ' sold'}`} key={item.id}>
          <div className="ga-account-art">
            <GameArtwork image={item.thumbnailUrl} name={item.name} />
            <span className={item.isAvailable ? 'available' : 'sold-out'}>{item.isAvailable ? 'TERSEDIA' : 'TIDAK TERSEDIA'}</span>
          </div>
          <div className="ga-account-copy">
            <h2>{item.name}</h2><p>{item.gameName || game?.name || 'Akun game'}</p>
            <div className="ga-tags ga-live-tags">{attributes.map((field) =>
              <span key={field.key} title={`${field.label}: ${field.value}`}>{field.label}: {field.value}</span>)}</div>
            <div className="ga-account-price-row">
              <strong>{accountPrice(item.minPrice) || 'Harga belum tersedia'}</strong>
              <a href={accountProductHref(item)}>Lihat Detail</a>
            </div>
          </div>
        </article>
      })}</div>}
    <div className="ga-live-pagination">
      <span>Menampilkan halaman {page} dari {totalPages} · {totalItems} listing</span>
      <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
      <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
    </div>
  </main></div>
}

export function GameAccountDetailPage({ gameSlug, accountSlug }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    getCatalogProduct(accountSlug).then((data) => {
      if (!active) return
      if (data.kind !== 'GameAccount' || (data.game?.slug && gameSlug !== 'account' && data.game.slug !== gameSlug))
        throw new Error('Listing akun tidak ditemukan.')
      setProduct(data)
    }).catch((err) => {
      if (!active) return
      const fallback = dummyAccountFor(gameSlug, accountSlug)
      if (fallback) {
        setProduct(fallback)
        setError('')
      } else {
        setError(err.message || 'Detail akun tidak dapat dimuat.')
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [gameSlug, accountSlug])
  const attributes = getAccountAttributes(product?.accountDetails)
  const variant = product?.variants?.find((item) => item.isAvailable) || product?.variants?.[0]
  const price = variant?.effectivePrice ?? variant?.price
  const available = Boolean(product?.isAvailable && variant?.isAvailable)
  return <div className="ga-shell"><Navbar />
    {loading || error || !product ? <main className="ga-detail-page ga-container"><StateMessage>{loading ? 'Memuat detail akun…' : error || 'Listing tidak ditemukan.'}</StateMessage></main>
      : <main className="ga-detail-page">
        <section className="ga-detail-hero ga-live-hero">
          {product.images?.[0]?.url && <img className="ga-detail-hero-bg" src={product.images[0].url} alt="" />}
          <div className="ga-detail-scrim" />
          <div className="ga-detail-hero-content">
            <div className="ga-hero-thumb"><GameArtwork image={product.thumbnailUrl || product.game?.imageUrl} name={product.name} /></div>
            <div className="ga-detail-hero-copy"><h1>{product.name}</h1>
              <div className="ga-hero-rating"><span>{product.game?.name || 'Game Account'}</span>
                {product.rating != null && product.reviewCount > 0 &&
                  <small>{product.rating.toLocaleString('id-ID')} / 5 · {product.reviewCount} ulasan</small>}
              </div>
              <div className="ga-hero-badges"><span>{available ? 'Akun tersedia' : 'Akun tidak tersedia'}</span>
                {product.soldQuantity > 0 && <span>{product.soldQuantity} terjual</span>}</div>
            </div>
          </div>
        </section>
        <div className="ga-detail-layout">
          <section className="ga-detail-card ga-live-detail">
            <h2>Detail Akun</h2>
            {product.description && <p className="ga-live-description">{product.description}</p>}
            {attributes.length > 0 ? <dl className="ga-detail-specs ga-live-specs">
              {attributes.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
            </dl> : <StateMessage>Detail akun belum diisi oleh admin.</StateMessage>}
            {product.images?.length > 0 && <div className="ga-live-gallery" aria-label="Foto listing">
              {product.images.map((image) => <img key={image.id} src={image.url} alt={image.altText || product.name} loading="lazy" />)}
            </div>}
            <div className="ga-live-reviews"><h2>Ulasan Produk</h2>
              {product.rating != null && product.reviewCount > 0
                ? <p>{product.rating.toLocaleString('id-ID')} / 5 · {product.reviewCount} ulasan terverifikasi</p>
                : <p>Belum ada ulasan terverifikasi.</p>}</div>
          </section>
          <aside className="ga-purchase-card ga-live-purchase"><h2>Produk</h2>
            <div className="ga-selected-account"><strong>{product.name}</strong>
              <span>{accountPrice(price) || 'Harga belum tersedia'}</span>
              <small>{available ? 'Tersedia · 1 akun unik' : 'Tidak tersedia'}</small></div>
            <p className="ga-live-note">Detail dan harga ditampilkan dari katalog. Total akhir serta ketersediaan dikonfirmasi saat checkout.</p>
            <button type="button" className="ga-primary-cta" disabled>Pembelian akun sedang disiapkan</button>
            <a className="ga-live-back" href={product.game?.slug
              ? `/game-accounts/${encodeURIComponent(product.game.slug)}` : '/game-accounts'}>Kembali ke daftar akun</a>
          </aside>
        </div>
      </main>}
  </div>
}
