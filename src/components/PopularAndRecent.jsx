import { assets } from '../data/assets'

function MiniItem({ item }) {
  return (
    <article className="mini-game">
      <span className="mini-game__image">{item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">🎮</span>}</span>
      <span>{item.name}</span>
    </article>
  )
}

export default function PopularAndRecent({ popular = [], recent = [], authenticated = false }) {

  return (
    <section className="popular-recent" aria-label="Popular games and recent purchases">
      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.popularHeader} alt="" loading="lazy" decoding="async" /><h2>Game Populer</h2></div>
        </header>
        <div className="mini-panel mini-panel--popular">
          {popular.slice(0, 10).map((item) => <MiniItem item={item} key={item.id} />)}
          {popular.length === 0 && <p role="status">Belum ada game populer.</p>}
        </div>
      </div>

      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.recentHeader} alt="" loading="lazy" decoding="async" /><h2>Terakhir Dibeli</h2></div>
        </header>
        <div className="mini-panel mini-panel--recent">
          {recent.slice(0, 3).map((item) => <MiniItem item={item} key={item.id} />)}
          {recent.length === 0 && <p role="status">{authenticated ? 'Belum ada riwayat pembelian untuk akun ini.' : 'Masuk untuk melihat pembelian terakhirmu.'}</p>}
        </div>
      </div>
    </section>
  )
}
