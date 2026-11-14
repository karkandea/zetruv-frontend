import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { assets } from '../data/assets'
import { identifyHomepageGame } from '../services/homeArtwork'

const gameArtwork = {
  mlbb: assets.popularMl,
  genshin: assets.genshin,
  pubg: assets.popularPubg,
  valorant: assets.popularValorant,
  freeFire: assets.popularFreeFire,
  codm: assets.codm,
}

function displayGameName(name) {
  return identifyHomepageGame(name) === 'mlbb' ? 'Mobile Legends' : name
}

function MiniItem({ item }) {
  const artwork = item.image || gameArtwork[identifyHomepageGame(item.name)] || assets.homepageCategoryAccount
  return (
    <article className="mini-game">
      <span className="mini-game__image"><img src={artwork} alt={item.name} loading="lazy" decoding="async" /></span>
      <span>{item.label || displayGameName(item.name)}</span>
    </article>
  )
}

export default function PopularAndRecent({ popular = [], recent = [], featured = [], authenticated = false }) {
  const copy = useStorefrontCopy()
  // Never represent promotional items as a customer's purchase history.
  // Guests see public featured offers; signed-in users see their own orders.
  const showFeatured = !authenticated && featured.length > 0
  const sidebarItems = showFeatured
    ? featured.map((item) => ({
      ...item,
      label: item.item ? item.item + ' · ' + (identifyHomepageGame(item.name) === 'mlbb' ? 'MLBB' : item.name) : item.name,
    }))
    : recent

  return (
    <section className="popular-recent" aria-label={copy.popularGamesAndRecentPurchases}>
      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.popularHeader} alt="" loading="lazy" decoding="async" /><h2>{copy.popularGames}</h2></div>
        </header>
        <div className="mini-panel mini-panel--popular">
          {popular.slice(0, 10).map((item) => <MiniItem item={item} key={item.id} />)}
          {popular.length === 0 && <p role="status">{copy.thereAreNoPopularGamesYet}</p>}
        </div>
      </div>

      <div className={`popular-recent__column${authenticated || showFeatured ? '' : ' popular-recent__column--sign-in-prompt'}`}>
        <header className="compact-heading">
          <div><img src={assets.recentHeader} alt="" loading="lazy" decoding="async" /><h2>{showFeatured ? copy.featuredItems : copy.recentPurchases}</h2></div>
        </header>
        <div className="mini-panel mini-panel--recent">
          {sidebarItems.slice(0, 3).map((item) => <MiniItem item={item} key={item.id} />)}
          {sidebarItems.length === 0 && <p role="status">{authenticated ? copy.thisAccountHasNoPurchaseHistoryYet : copy.logInToSeeYourRecentPurchases}</p>}
        </div>
      </div>
    </section>
  )
}
