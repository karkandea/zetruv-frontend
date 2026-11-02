import { assets } from '../data/assets'

export default function LatestArticles({ items = [] }) {
  const articles = items.filter((item) => item?.slug && item?.title).slice(0, 3)

  return (
    <section className="homepage-articles" id="article" aria-labelledby="latest-articles-title">
      <div className="homepage-articles__header">
        <div>
          <span>ZETRUV STORIES</span>
          <h2 id="latest-articles-title">Latest Articles</h2>
          <p>Guides, updates, and practical tips to help you shop and play with confidence.</p>
        </div>
        <a href="/articles">View all articles</a>
      </div>

      <div className="homepage-articles__grid">
        {articles.map((article, index) => (
          <a className={`homepage-article-card homepage-article-card--${index + 1}`} href={`/articles/${encodeURIComponent(article.slug)}`} key={article.id}>
            <img src={article.thumbnailUrl || assets.articleOne} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = assets.articleOne }} />
            <div className="homepage-article-card__body">
              <span>{article.category?.name || 'Artikel'}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <small>{article.authorName || 'Zetruv'} · {article.readTimeMinutes} min read</small>
            </div>
          </a>
        ))}
        {articles.length === 0 && <p role="status">Belum ada artikel yang dipublikasikan.</p>}
      </div>
    </section>
  )
}
