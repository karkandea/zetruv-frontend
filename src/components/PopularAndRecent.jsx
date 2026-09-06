import { assets } from '../data/assets'

const fallbackPopular = [
  { id: 'popular-ml', name: 'Mobile Legend', image: assets.popularMl },
  { id: 'popular-ff', name: 'Garena Free Fire', image: assets.popularFreeFire },
  { id: 'popular-val', name: 'Valorant', image: assets.popularValorant },
  { id: 'popular-pubg-1', name: 'PUBG Mobile', image: assets.popularPubg },
  ...Array.from({ length: 6 }, (_, index) => ({ id: `popular-pubg-${index + 2}`, name: 'PUBG Mobile', image: assets.popularPubgAlt })),
]

const fallbackRecent = [
  { id: 'recent-ml', name: '86 Diamonds MLBB', image: assets.recentMl },
  { id: 'recent-pubg', name: '300+ UC PUBLG Mobile', image: assets.recentPubg },
  { id: 'recent-val', name: '100+ VP Valorant', image: assets.recentValorant },
]

function MiniItem({ item }) {
  return (
    <article className="mini-game">
      <span className="mini-game__image"><img src={item.image} alt={item.name} /></span>
      <span>{item.name}</span>
    </article>
  )
}

export default function PopularAndRecent({ popular = [], recent = [] }) {
  const popularItems = popular.length ? popular : fallbackPopular
  const recentItems = recent.length ? recent : fallbackRecent

  return (
    <section className="popular-recent" aria-label="Popular games and recent purchases">
      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.popularHeader} alt="" /><h2>Game Populer</h2></div>
        </header>
        <div className="mini-panel mini-panel--popular">
          {popularItems.slice(0, 10).map((item) => <MiniItem item={item} key={item.id} />)}
        </div>
      </div>

      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.recentHeader} alt="" /><h2>Terakhir Dibeli</h2></div>
        </header>
        <div className="mini-panel mini-panel--recent">
          {recentItems.slice(0, 3).map((item) => <MiniItem item={item} key={item.id} />)}
        </div>
      </div>
    </section>
  )
}
