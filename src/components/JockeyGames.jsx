export default function JockeyGames({ items = [] }) {
  return (
    <section className="jockey-section" id="jockey" aria-labelledby="jockey-title">
      <h2 id="jockey-title">Joki Game</h2>
      <div className="jockey-grid">
        {items.slice(0, 10).map((game) => (
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
