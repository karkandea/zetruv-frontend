import { assets } from '../data/assets'

const fallbackGames = [
  { id: 'ml', name: 'Mobile Legend', publisher: 'Moonton', image: assets.mobileLegends },
  { id: 'pubg', name: 'PUBG Mobile', publisher: 'Tencent', image: assets.pubg },
  { id: 'valorant', name: 'Valorant', publisher: 'RIOT', image: assets.valorant },
  { id: 'codm', name: 'Call of Duty Mobile', publisher: 'Treyarch', image: assets.codm },
  { id: 'codm-2', name: 'Call of Duty Mobile', publisher: 'Treyarch', image: assets.codm },
  { id: 'ff', name: 'Free Fire', publisher: 'Moonton', image: assets.freeFire },
  { id: 'genshin', name: 'Genshin Impact', publisher: 'Tencent', image: assets.genshin },
  { id: 'fc', name: 'FC Mobile', publisher: 'RIOT', image: assets.fcMobile },
  { id: 'hsr', name: 'Star Rail', publisher: 'Treyarch', image: assets.starRail },
  { id: 'undawn', name: 'Undawn', publisher: 'Treyarch', image: assets.undawn },
]

export default function JockeyGames({ items = [] }) {
  const displayItems = items.length ? items : fallbackGames

  return (
    <section className="jockey-section" id="jockey" aria-labelledby="jockey-title">
      <h2 id="jockey-title">Joki Game</h2>
      <div className="jockey-grid">
        {displayItems.slice(0, 10).map((game) => (
          <article className="jockey-card" key={game.id}>
            <div className="jockey-card__image"><img src={game.image} alt={game.name} /></div>
            <div className="jockey-card__caption">
              <strong>{game.name}</strong>
              <span>{game.publisher}</span>
            </div>
          </article>
        ))}
      </div>
      <button className="yellow-button jockey-section__button" type="button">Lihat Semua</button>
    </section>
  )
}
