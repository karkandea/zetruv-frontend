import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { assets } from '../data/assets'

export default function LatestArticles({ items = [] }) {
  const copy = useStorefrontCopy()
  const articles = items.filter((item) => item?.slug && item?.title).slice(0, 3)

  return (
    <section className="homepage-articles" id="article" aria-labelledby="latest-articles-title">
      <div className="homepage-articles__header">
        <div>
          <span>{copy.zetruvStories}</span>
          <h2 id="latest-articles-title">{copy.latestArticles}</h2>
          <p>{copy.guidesUpdatesAndPracticalTipsToHelp}</p>
        </div>
        <a href="/articles">{copy.viewAllArticles}</a>
      </div>

      <div className="homepage-articles__grid">
        {articles.map((article, index) => (
          <a className={`homepage-article-card homepage-article-card--${index + 1}`} href={`/articles/${encodeURIComponent(article.slug)}`} key={article.id}>
            <img src={article.thumbnailUrl || assets.articleOne} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.articleOne }} />
            <div className="homepage-article-card__body">
              <span>{article.category?.name || copy.article}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <small>{article.authorName || 'Zetruv'} · {article.readTimeMinutes} {copy.minRead}</small>
            </div>
          </a>
        ))}
        {articles.length === 0 && <p role="status">{copy.noArticlesHaveBeenPublishedYet}</p>}
      </div>
    </section>
  )
}
