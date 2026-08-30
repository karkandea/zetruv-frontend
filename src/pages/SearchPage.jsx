import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { searchAssets } from '../data/searchAssets'
import '../styles/search.css'
import '../styles/search-login.css'

const categoryDefinitions = [
  {
    key: 'player-id',
    label: 'Player ID Top-Up',
    loginLabel: 'Top Up Via ID',
    icon: searchAssets.categoryPlayerId,
    route: '/search',
  },
  {
    key: 'login',
    label: 'Top-Up with Login',
    loginLabel: 'Top Up Via Login',
    icon: searchAssets.categoryLogin,
    route: '/search/login',
  },
  {
    key: 'items',
    label: 'In-Game Items',
    loginLabel: 'Item Game',
    icon: searchAssets.categoryItems,
  },
  {
    key: 'accounts',
    label: 'Game Accounts',
    loginLabel: 'Akun Game',
    icon: searchAssets.categoryAccounts,
  },
  {
    key: 'merchandise',
    label: 'Merchandise',
    loginLabel: 'Merchandise',
    icon: searchAssets.categoryMerchandise,
  },
]

const popularGames = [
  { id: 'mlbb', name: 'Mobile Legends', publisher: 'Moonton', image: searchAssets.mobileLegends },
  { id: 'pubg', name: 'PUBG Mobile', publisher: 'Tencent', image: searchAssets.pubgMobile },
  { id: 'valorant', name: 'Valorant', publisher: 'Riot Games', image: searchAssets.valorant },
  { id: 'genshin', name: 'Genshin Impact', publisher: 'HoYoverse', image: searchAssets.genshinImpact },
  { id: 'codm', name: 'Call of Duty Mobile', publisher: 'Activision', image: searchAssets.callOfDutyMobile },
  { id: 'star-rail', name: 'Honkai: Star Rail', publisher: 'HoYoverse', image: searchAssets.starRail },
]

const moreGames = popularGames.slice(3)
const alphabet = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V', 'W']

function GameCard({ game, href }) {
  function handleClick() {
    if (href) window.location.href = href
  }

  return (
    <button className="search-game-card" type="button" aria-label={`Open ${game.name}`} onClick={handleClick}>
      <img src={game.image} alt="" />
      <span className="search-game-card__copy">
        <strong>{game.name}</strong>
        <small>{game.publisher}</small>
      </span>
    </button>
  )
}

function filterGames(items, query, letter) {
  const normalizedQuery = query.trim().toLowerCase()
  return items.filter((game) => {
    const matchesQuery = !normalizedQuery || `${game.name} ${game.publisher}`.toLowerCase().includes(normalizedQuery)
    const matchesLetter = !letter || letter === '#' || game.name.toUpperCase().startsWith(letter)
    return matchesQuery && matchesLetter
  })
}

export default function SearchPage({ mode = 'player-id' }) {
  const isLoginMode = mode === 'login'
  const initialQuery = new URLSearchParams(window.location.search).get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState(isLoginMode ? 'login' : 'player-id')
  const [activeLetter, setActiveLetter] = useState('M')
  const [letterFiltering, setLetterFiltering] = useState(false)

  const effectiveLetter = letterFiltering ? activeLetter : ''
  const filteredPopular = useMemo(
    () => filterGames(popularGames, submittedQuery, effectiveLetter),
    [submittedQuery, effectiveLetter],
  )

  const filteredMore = useMemo(
    () => filterGames(moreGames, submittedQuery, effectiveLetter),
    [submittedQuery, effectiveLetter],
  )

  function handleSearch(event) {
    event.preventDefault()
    const next = query.trim()
    setSubmittedQuery(next)
    const url = new URL(window.location.href)
    if (next) url.searchParams.set('q', next)
    else url.searchParams.delete('q')
    window.history.replaceState({}, '', `${url.pathname}${url.search}`)
  }

  function handleLetter(letter) {
    if (letterFiltering && activeLetter === letter) {
      setLetterFiltering(false)
      return
    }
    setActiveLetter(letter)
    setLetterFiltering(true)
  }

  function handleCategory(category) {
    setActiveCategory(category.key)
    if (category.route && category.route !== window.location.pathname) {
      window.location.href = category.route
    }
  }

  function gameHref(game) {
    if (!isLoginMode && game.id === 'mlbb') return '/product/mobile-legends'
    if (isLoginMode && game.id === 'genshin') return '/product/genshin-impact/login'
    return undefined
  }

  return (
    <div className={`search-site-shell${isLoginMode ? ' search-site-shell--login' : ''}`}>
      <Navbar variant={isLoginMode ? 'loginCatalog' : 'catalog'} />

      <main className={`search-page${isLoginMode ? ' search-page--login' : ''}`}>
        <div className="search-page__container">
          {!isLoginMode && (
            <>
              <p className="search-breadcrumb"><a href="/">Home</a> / Categories</p>
              <h1>Browse Categories</h1>
              <p className="search-page__intro">Find the game, top-up method, or product you’re looking for.</p>
            </>
          )}

          <section className="search-catalog" aria-label={isLoginMode ? 'Explore kategori via login' : 'Browse Zetruv categories'}>
            <aside className="search-sidebar">
              <h2>{isLoginMode ? 'Kategori' : 'Categories'}</h2>
              <div className="search-category-list">
                {categoryDefinitions.map((category) => (
                  <button
                    type="button"
                    key={category.key}
                    className={`search-category${activeCategory === category.key ? ' active' : ''}`}
                    onClick={() => handleCategory(category)}
                  >
                    <span className="search-category__icon"><img src={category.icon} alt="" /></span>
                    <span>{isLoginMode ? category.loginLabel : category.label}</span>
                    {activeCategory === category.key && <i aria-hidden="true" />}
                  </button>
                ))}
              </div>

              <button className="search-help-card" type="button">
                <strong>{isLoginMode ? 'Admin Support' : 'Need Help?'}</strong>
                <span>{isLoginMode ? 'Chat admin jika terjadi kendala' : 'Chat with our support team.'}</span>
              </button>
            </aside>

            <div className="search-catalog__content">
              <form className="catalog-search" onSubmit={handleSearch}>
                <img src={searchAssets.searchIcon} alt="" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={isLoginMode ? 'Cari game atau kategori' : 'Search games or categories'}
                  aria-label={isLoginMode ? 'Cari game atau kategori' : 'Search games or categories'}
                />
                <button type="submit">{isLoginMode ? 'Cari' : 'Search'}</button>
              </form>

              <div className="alphabet-filter" aria-label="Filter games alphabetically">
                <strong>A–Z</strong>
                {alphabet.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    className={activeLetter === letter ? 'active' : ''}
                    onClick={() => handleLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>

              <div className="search-section-heading">
                <h2>{isLoginMode ? 'Kategori Populer' : 'Popular Games'}</h2>
                <span>{isLoginMode ? 'Paling sering dicari' : 'Most searched'}</span>
              </div>

              {filteredPopular.length > 0 ? (
                <div className="search-game-grid">
                  {filteredPopular.map((game) => <GameCard key={game.id} game={game} href={gameHref(game)} />)}
                </div>
              ) : (
                <div className="search-empty">
                  {isLoginMode ? 'Game tidak ditemukan. Coba kata kunci atau huruf lain.' : 'No games found. Try another keyword or letter.'}
                </div>
              )}

              <div className="search-section-heading search-section-heading--more">
                <div>
                  <h2>{isLoginMode ? 'Kategori Lainnya' : 'More Games'}</h2>
                  <p>{isLoginMode ? 'Game top-up yang tersedia di katalog Zetruv' : 'Browse more games available for top-up on Zetruv.'}</p>
                </div>
              </div>

              {filteredMore.length > 0 && (
                <div className="search-game-grid">
                  {filteredMore.map((game) => <GameCard key={`more-${game.id}`} game={game} href={gameHref(game)} />)}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
