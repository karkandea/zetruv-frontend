import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useCarouselPages } from '../hooks/useCarouselPages'

export default function JockeyGames({ items = [] }) {
  const copy = useStorefrontCopy()
  const displayItems = items.filter((item) => item?.id && item?.slug).slice(0, 10)
  const { rowRef, pageCount, activePage, updateActivePage, showPage } = useCarouselPages(displayItems.length, 2)

  return (
    <section className="jockey-section" id="jockey" aria-labelledby="jockey-title">
      <header className="jockey-section__header">
        <h2 id="jockey-title">{copy.gameBoosting}</h2>
        <a className="yellow-button jockey-section__mobile-link" href="/search?kind=Joki">{copy.viewAll}</a>
      </header>
      <div className="jockey-grid" id="jockey-slides" ref={rowRef} onScroll={updateActivePage}>
        {displayItems.map((game) => (
          <a className="jockey-card" href={`/product/joki/${encodeURIComponent(game.slug)}`} key={game.id}>
            <div className="jockey-card__image">{game.image && <img src={game.image} alt={game.name} loading="lazy" decoding="async" />}</div>
            <div className="jockey-card__caption">
              <strong>{game.name}</strong>
              <span>{game.publisher}</span>
            </div>
          </a>
        ))}
        {displayItems.length === 0 && <p role="status">{copy.gameBoostingIsCurrentlyUnavailable}</p>}
      </div>
      {pageCount > 1 && (
        <div className="homepage-slider-dots jockey-section__dots" role="group" aria-label={copy.selectAGameBoostingPage}>
          {Array.from({ length: pageCount }, (_, page) => (
            <button
              key={page}
              type="button"
              aria-label={formatCopy(copy.showGameBoostingPage, { number: formatCopy(copy.of, { current: page + 1, total: pageCount }) })}
              aria-controls="jockey-slides"
              aria-current={page === activePage ? 'true' : undefined}
              onClick={() => showPage(page)}
            />
          ))}
        </div>
      )}
      <a className="yellow-button jockey-section__button" href="/search?kind=Joki">{copy.viewAll}</a>
    </section>
  )
}
