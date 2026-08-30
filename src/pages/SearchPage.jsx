import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { searchAssets } from '../data/searchAssets'
import '../styles/search.css'

const categories = [
  { key: 'player-id', label: 'Player ID Top-Up', icon: searchAssets.categoryPlayerId },
  { key: 'login', label: 'Top-Up with Login', icon: searchAssets.categoryLogin },
  { key: 'items', label: 'In-Game Items', icon: searchAssets.categoryItems },
  { key: 'accounts', label: 'Game Accounts', icon: searchAssets.categoryAccounts },
  { key: 'merchandise', label: 'Merchandise', icon: searchAssets.categoryMerchandise },
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

function GameCard({ game }) {
  return (
    <button className="search-game-card" type="button" aria-label={`Open ${game.name}`}>
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

export default function SearchPage() {
  const initialQuery = new URLSearchParams(window.location.search).get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState('player-id')
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

  return (
    <div className="search-site-shell">
      <Navbar variant="catalog" />

      <main className="search-page">
        <div className="search-page__container">
          <p className="search-breadcrumb"><a href="/">Home</a> / Categories</p>
          <h1>Browse Categories</h1>
          <p className="search-page__intro">Find the game, top-up method, or product you’re looking for.</p>

          <section className="search-catalog" aria-label="Browse Zetruv categories">
            <aside className="search-sidebar">
              <h2>Categories</h2>
              <div className="search-category-list">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.key}
                    className={`search-category${activeCategory === category.key ? ' active' : ''}`}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    <span className="search-category__icon"><img src={category.icon} alt="" /></span>
                    <span>{category.label}</span>
                    {activeCategory === category.key && <i aria-hidden="true" />}
                  </button>
                ))}
              </div>

              <button className="search-help-card" type="button">
                <strong>Need Help?</strong>
                <span>Chat with our support team.</span>
              </button>
            </aside>

            <div className="search-catalog__content">
              <form className="catalog-search" onSubmit={handleSearch}>
                <img src={searchAssets.searchIcon} alt="" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search games or categories"
                  aria-label="Search games or categories"
                />
                <button type="submit">Search</button>
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
                <h2>Popular Games</h2>
                <span>Most searched</span>
              </div>

              {filteredPopular.length > 0 ? (
                <div className="search-game-grid">
                  {filteredPopular.map((game) => <GameCard key={game.id} game={game} />)}
                </div>
              ) : (
                <div className="search-empty">No games found. Try another keyword or letter.</div>
              )}

              <div className="search-section-heading search-section-heading--more">
                <div>
                  <h2>More Games</h2>
                  <p>Browse more games available for top-up on Zetruv.</p>
                </div>
              </div>

              {filteredMore.length > 0 && (
                <div className="search-game-grid">
                  {filteredMore.map((game) => <GameCard key={`more-${game.id}`} game={game} />)}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
