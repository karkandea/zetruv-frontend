import { useMemo, useState } from 'react'

const tabs = [
  { key: 'topup', label: 'Top Up Games' },
  { key: 'login', label: 'Top Up Via Login' },
  { key: 'jockey', label: 'Game Jockey' },
]

export default function TrendingGames({ items = [] }) {
  const [active, setActive] = useState('topup')
  const filtered = useMemo(() => {
    const selected = items.filter((item) => item.category === active)
    return selected.length >= 3 ? selected : items
  }, [active, items])

  return (
    <section className="trending container" aria-labelledby="trending-title">
      <div className="section-heading">
        <h2 id="trending-title">Game Trending</h2>
        <div className="category-tabs" role="tablist" aria-label="Game category">
          {tabs.map((tab) => (
            <button key={tab.key} className={active === tab.key ? 'active' : ''} onClick={() => setActive(tab.key)} type="button">
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="game-grid">
        {filtered.slice(0, 10).map((game) => (
          <article className="game-card" key={game.id}>
            <img src={game.image} alt={game.name} />
            <div className="game-card__caption">
              <strong>{game.name}</strong>
              <span>{game.publisher}</span>
            </div>
          </article>
        ))}
      </div>
      <button className="show-all" type="button">Lihat Semua</button>
    </section>
  )
}
