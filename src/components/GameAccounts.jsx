import { accountPrice, accountProductHref, getAccountAttributes } from '../services/gameAccountPresentation'

export default function GameAccounts({ items = [] }) {
  const cards = items.filter((item) => item?.id && item?.slug).slice(0, 3)

  return (
    <section className="homepage-accounts" id="game-accounts" aria-labelledby="homepage-accounts-title">
      <div className="homepage-accounts__header">
        <div>
          <h2 id="homepage-accounts-title">Akun Game Pilihan</h2>
          <p>Detail akun sesuai game, langsung dari listing yang tersedia.</p>
        </div>
        <a href="/search?kind=GameAccount">Lihat Semua Akun Game</a>
      </div>
      {cards.length === 0
        ? <div className="homepage-accounts__empty">Belum ada akun game yang ditampilkan saat ini.</div>
        : <div className="homepage-accounts__row">
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
    </section>
  )
}
