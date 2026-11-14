import { useRef, useState } from 'react'
import { accountPrice, accountProductHref, getAccountAttributes } from '../services/gameAccountPresentation'

export default function GameAccounts({ items = [] }) {
  const cards = items.filter((item) => item?.id && item?.slug).slice(0, 3)
  const rowRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function updateActiveCard(event) {
    const row = event.currentTarget
    const [first, second] = row.children
    if (!second) return

    const step = second.offsetLeft - first.offsetLeft
    if (step > 0) {
      const index = Math.round(row.scrollLeft / step)
      setActiveIndex(Math.max(0, Math.min(index, cards.length - 1)))
    }
  }

  function showCard(index) {
    const row = rowRef.current
    row.scrollTo({ left: row.children[index].offsetLeft - row.firstElementChild.offsetLeft })
  }

  return (
    <section className="homepage-accounts" id="game-accounts" aria-labelledby="homepage-accounts-title">
      <div className="homepage-accounts__header">
        <div>
          <h2 id="homepage-accounts-title">Akun Game Pilihan</h2>
          <p>Detail akun sesuai game, langsung dari listing yang tersedia.</p>
        </div>
        <a href="/search?kind=GameAccount">
          <span className="homepage-accounts__desktop-label">Lihat Semua Akun Game</span>
          <span className="homepage-accounts__mobile-label">Lihat Semua</span>
        </a>
      </div>
      {cards.length === 0
        ? <div className="homepage-accounts__empty">Belum ada akun game yang ditampilkan saat ini.</div>
        : <div className="homepage-accounts__row" id="homepage-accounts-slides" ref={rowRef} onScroll={updateActiveCard}>
          {cards.map((account) => {
            const attributes = getAccountAttributes(account.accountDetails, { cardOnly: true, limit: 3 })
            const href = accountProductHref(account)
            return (
              <article className="homepage-account-card" key={account.id}>
                {account.thumbnailUrl || account.imageUrl
                  ? <img className="homepage-account-card__preview" src={account.thumbnailUrl || account.imageUrl} alt={account.name} />
                  : <div className="homepage-account-card__preview homepage-account-card__preview--empty" aria-hidden="true">Akun Game</div>}
                <span className={`homepage-account-card__status${account.isAvailable ? '' : ' is-unavailable'}`}>
                  {account.isAvailable ? 'TERSEDIA' : 'TIDAK TERSEDIA'}
                </span>
                <div className="homepage-account-card__info">
                  <strong>{account.name}</strong>
                  <span>{account.gameName || 'Game Account'}</span>
                  {attributes.length > 0
                    ? <div className="homepage-account-card__attributes" aria-label="Detail akun">
                      {attributes.map((field) => <span key={field.key} title={`${field.label}: ${field.value}`}>
                        {field.label}: {field.value}
                      </span>)}
                    </div>
                    : <small>Detail akun belum tersedia.</small>}
                </div>
                <div className="homepage-account-card__bottom">
                  <strong>{accountPrice(account.minPrice) || 'Harga belum tersedia'}</strong>
                  <a href={href}>Lihat Detail</a>
                </div>
              </article>
            )
          })}
        </div>}
      {cards.length > 1 && (
        <div className="homepage-accounts__dots" role="group" aria-label="Pilih kartu akun game">
          {cards.map((account, index) => (
            <button
              key={account.id}
              type="button"
              aria-label={`Tampilkan akun ${index + 1} dari ${cards.length}: ${account.name}`}
              aria-controls="homepage-accounts-slides"
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => showCard(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
