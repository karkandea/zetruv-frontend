import { assets } from '../data/assets'

function MiniItem({ item }) {
  return (
    <article className="mini-game">
      <span className="mini-game__image"><img src={item.image} alt={item.name} /></span>
      <span>{item.name}</span>
    </article>
  )
}

export default function PopularAndRecent({ popular = [], recent = [] }) {
  return (
    <section className="popular-recent" aria-label="Popular games and recent purchases">
      <div className="popular-recent__column">
        <header className="compact-heading compact-heading--button">
          <div><img src={assets.popularHeader} alt="" /><h2>Game Populer</h2></div>
          <button className="yellow-button" type="button">Lihat Semua</button>
        </header>
        <div className="mini-panel mini-panel--popular">
          {popular.slice(0, 10).map((item) => <MiniItem item={item} key={item.id} />)}
        </div>
      </div>

      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.recentHeader} alt="" /><h2>Terakhir Dibeli</h2></div>
        </header>
        <div className="mini-panel mini-panel--recent">
          {recent.slice(0, 3).map((item) => <MiniItem item={item} key={item.id} />)}
        </div>
      </div>
    </section>
  )
}
