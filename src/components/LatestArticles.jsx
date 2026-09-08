import { assets } from '../data/assets'

const fallbackArticles = [
  {
    id: 'buyer-guide',
    category: 'BUYER GUIDE',
    title: '5 Things to Check Before Buying a Game Account',
    description: 'A quick checklist for access, recovery, ownership, and seller credibility before you pay.',
    meta: 'Buyer Guide  ·  5 min read',
    image: assets.articleOne,
  },
  {
    id: 'security',
    category: 'SECURITY',
    title: 'How to Secure Your Account After Purchase',
    description: 'Simple steps to lock down access as soon as the transfer is complete.',
    meta: 'Account Safety  ·  4 min read',
    image: assets.articleTwo,
  },
  {
    id: 'dota-2',
    category: 'DOTA 2',
    title: 'Dota 2 Rank Guide: What Each Tier Means',
    description: 'Understand the ladder so you can compare listings with the right context.',
    meta: 'Dota 2  ·  6 min read',
    image: assets.articleThree,
  },
]

function normalizeArticle(item, index) {
  const fallback = fallbackArticles[index]
  if (!item) return fallback
  return {
    ...fallback,
    id: item.id ?? fallback.id,
    category: item.categoryName || item.category || fallback.category,
    title: item.title || fallback.title,
    description: item.excerpt || item.description || fallback.description,
    meta: item.meta || fallback.meta,
    image: item.thumbnailUrl || item.imageUrl || item.image || fallback.image,
  }
}

export default function LatestArticles({ items = [] }) {
  const articles = fallbackArticles.map((_, index) => normalizeArticle(items[index], index))

  return (
    <section className="homepage-articles" id="article" aria-labelledby="latest-articles-title">
      <div className="homepage-articles__header">
        <div>
          <span>ZETRUV STORIES</span>
          <h2 id="latest-articles-title">Latest Articles</h2>
          <p>Guides, updates, and practical tips to help you shop and play with confidence.</p>
        </div>
        <a href="#article">View all articles</a>
      </div>

      <div className="homepage-articles__grid">
        {articles.map((article, index) => (
          <article className={`homepage-article-card homepage-article-card--${index + 1}`} key={article.id}>
            <img src={article.image} alt="" />
            <div className="homepage-article-card__body">
              <span>{article.category}</span>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <small>{article.meta}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
