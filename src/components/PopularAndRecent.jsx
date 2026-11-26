import { Bone, SkeletonItems } from './Skeleton'
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

function MiniItem({ item, href }) {
  const fallback = gameArtwork[identifyHomepageGame(item.name)] || assets.homepageCategoryAccount
  const artwork = item.image || fallback
  const Tag = href ? 'a' : 'article'
  return (
    <Tag className="mini-game" href={href}>
      <span className="mini-game__image"><img src={artwork} alt="" loading="lazy" decoding="async" onError={(event) => { if (event.currentTarget.src !== new URL(fallback, window.location.origin).href) event.currentTarget.src = fallback }} /></span>
      <span>{href ? displayGameName(item.name) : item.name}</span>
    </Tag>
  )
}

export default function PopularAndRecent({ popular = [], recent = [], loading = false }) {
  const copy = useStorefrontCopy()
  const showRecent = !loading && recent.length > 0

  return (
    <section className={showRecent ? 'popular-recent popular-recent--paired' : 'popular-recent'} aria-label={showRecent ? copy.popularGamesAndRecentPurchases : copy.popularGames}>
      <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.popularHeader} alt="" loading="lazy" decoding="async" /><h2>{copy.popularGames}</h2></div>
        </header>
        <div className="mini-panel mini-panel--popular" style={{ '--popular-columns': loading ? 4 : Math.max(1, Math.min(5, popular.length)) }}>
          {loading ? <SkeletonItems className="mini-game" count={4}><Bone className="mini-game__image" variant="thumb" /><Bone width="68%" /></SkeletonItems> : popular.map((item) => (
            <MiniItem item={item} href={item.slug ? `/game/${encodeURIComponent(item.slug)}` : undefined} key={item.id} />
          ))}
          {!loading && popular.length === 0 && <p role="status">{copy.thereAreNoPopularGamesYet}</p>}
        </div>
      </div>

      {showRecent && <div className="popular-recent__column">
        <header className="compact-heading">
          <div><img src={assets.recentHeader} alt="" loading="lazy" decoding="async" /><h2>{copy.recentPurchases}</h2></div>
        </header>
        <div className="mini-panel mini-panel--recent">
          {recent.slice(0, 3).map((item) => <MiniItem item={item} key={item.id} />)}
        </div>
      </div>}
    </section>
  )
}
