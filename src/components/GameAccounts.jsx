import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { accountPrice, accountProductHref, getAccountAttributes } from '../services/gameAccountPresentation'
import { useCarouselPages } from '../hooks/useCarouselPages'

export default function GameAccounts({ items = [] }) {
  const copy = useStorefrontCopy()
  const cards = items.filter((item) => item?.id && item?.slug).slice(0, 3)
  const { rowRef, activePage, updateActivePage, showPage } = useCarouselPages(cards.length)

  return (
    <section className="homepage-accounts" id="game-accounts" aria-labelledby="homepage-accounts-title">
      <div className="homepage-accounts__header">
        <div>
          <h2 id="homepage-accounts-title">{copy.featuredGameAccounts}</h2>
          <p>{copy.exploreAccountDetailsFromTheAvailableGame}</p>
        </div>
        <a href="/search?kind=GameAccount">
          <span className="homepage-accounts__desktop-label">{copy.viewAllGameAccounts}</span>
          <span className="homepage-accounts__mobile-label">{copy.viewAll}</span>
        </a>
      </div>
      {cards.length === 0
        ? <div className="homepage-accounts__empty">{copy.thereAreNoGameAccountsToShow}</div>
        : <div className="homepage-accounts__row" id="homepage-accounts-slides" ref={rowRef} onScroll={updateActivePage}>
          {cards.map((account) => {
            const attributes = getAccountAttributes(account.accountDetails, { cardOnly: true, limit: 3 })
            const href = accountProductHref(account)
            return (
              <article className="homepage-account-card" key={account.id}>
                {account.thumbnailUrl || account.imageUrl
                  ? <img className="homepage-account-card__preview" src={account.thumbnailUrl || account.imageUrl} alt={account.name} />
                  : <div className="homepage-account-card__preview homepage-account-card__preview--empty" aria-hidden="true">{copy.gameAccounts}</div>}
                <span className={`homepage-account-card__status${account.isAvailable ? '' : ' is-unavailable'}`}>
                  {account.isAvailable ? copy.available : copy.unavailable}
                </span>
                <div className="homepage-account-card__info">
                  <strong>{account.name}</strong>
                  <span>{account.gameName || copy.gameAccount}</span>
                  {attributes.length > 0
                    ? <div className="homepage-account-card__attributes" aria-label={copy.accountDetails}>
                      {attributes.map((field) => <span key={field.key} title={`${field.label}: ${field.value}`}>
                        {field.label}: {field.value}
                      </span>)}
                    </div>
                    : <small>{copy.accountDetailsAreUnavailable}</small>}
                </div>
                <div className="homepage-account-card__bottom">
                  <strong>{accountPrice(account.minPrice) || copy.priceUnavailable}</strong>
                  <a href={href}>{copy.viewDetails}</a>
                </div>
              </article>
            )
          })}
        </div>}
      {cards.length > 1 && (
        <div className="homepage-slider-dots homepage-accounts__dots" role="group" aria-label={copy.selectAGameAccountCard}>
          {cards.map((account, index) => (
            <button
              key={account.id}
              type="button"
              aria-label={`${formatCopy(copy.showAccount, { number: formatCopy(copy.of, { current: index + 1, total: cards.length }) })}: ${account.name}`}
              aria-controls="homepage-accounts-slides"
              aria-current={index === activePage ? 'true' : undefined}
              onClick={() => showPage(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
