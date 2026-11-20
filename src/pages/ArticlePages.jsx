import { Bone, LoadingRegion, SkeletonItems, SkeletonLines } from '../components/Skeleton'
import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useState } from 'react'
import { ArrowRight, Clock, Copy, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { apiRequest } from '../api/httpClient'
import { assets } from '../data/assets'
import '../styles/articles.css'

const articleImage = (article) => article.thumbnailUrl || assets.articleOne
const articleCategory = (article, copy) => article.category?.name || copy.article
function ArticleReadingTime({ minutes, label }) {
  return <span className="article-reading-time">
    <Clock size={13} strokeWidth={1.75} aria-hidden="true" />
    {minutes || 1} {label}
  </span>
}

function ArticleMeta({ article, copy }) {
  return <small className="article-card-meta">
    <span>{article.authorName || 'Zetruv'}</span>
    <ArticleReadingTime minutes={article.readTimeMinutes} label={copy.minRead} />
  </small>
}

function ArticleCard({ article }) {
  const copy = useStorefrontCopy()
  return <a className="article-list-card" href={`/articles/${encodeURIComponent(article.slug)}`}>
    <img src={articleImage(article)} alt="" loading="lazy" decoding="async" />
    <div className="article-list-card__body">
      <span className="article-category-pill">{articleCategory(article, copy)}</span>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <ArticleMeta article={article} copy={copy} />
    </div>
  </a>
}

export function ArticlesPage() {
  const copy = useStorefrontCopy()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ items: [], totalPages: 0 })
  const [state, setState] = useState('loading')

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(query.trim()); setPage(1) }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let active = true
    apiRequest('/articles/categories').then((rows) => {
      if (active) setCategories(Array.isArray(rows) ? rows : [])
    }).catch(() => { /* Listing can still load without category filters. */ })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), pageSize: '12' })
    if (category) params.set('category', category)
    if (search) params.set('q', search)
    setState('loading')
    apiRequest(`/articles?${params}`, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return
      setResult({ items: data.items || [], totalPages: data.totalPages || 0 })
      setState('ready')
    }).catch(() => {
      if (!controller.signal.aborted) setState('error')
    })
    return () => controller.abort()
  }, [search, category, page])

  const articles = result.items
  const showFeatured = page === 1 && !category && !search
  const featured = showFeatured ? articles[0] : null

  return <div className="article-shell">
    <Navbar variant="article" homepageMobileMenu />
    <main>
      <section className="article-index-header" aria-labelledby="article-index-title">
        <div className="article-index-header__inner">
          <h1 id="article-index-title">{copy.articlesGuides}</h1>
          <p>{copy.articlesPublishedByTheZetruvTeam}</p>
          <div className="article-index-tools">
            <label><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchArticles} aria-label={copy.searchArticles} /></label>
            <div>
              <button type="button" aria-pressed={!category} onClick={() => { setCategory(''); setPage(1) }}>{copy.all}</button>
              {categories.map((item) => <button type="button" aria-pressed={category === item.slug} onClick={() => { setCategory(item.slug); setPage(1) }} key={item.id}>{item.name}</button>)}
            </div>
          </div>
        </div>
      </section>

      {state === 'loading' && showFeatured && <section className="article-featured-section">
        <div className="article-section-inner">
          <LoadingRegion label={copy.loadingArticles}>
            <div className="article-featured-card">
              <div className="article-featured-card__media"><Bone variant="media" /></div>
              <div className="article-featured-card__body"><SkeletonLines /></div>
            </div>
          </LoadingRegion>
        </div>
      </section>}
      {featured && state === 'ready' && <section className="article-featured-section">
        <div className="article-section-inner">
          <a className="article-featured-card" href={`/articles/${encodeURIComponent(featured.slug)}`}>
            <div className="article-featured-card__media">
              <img src={articleImage(featured)} alt="" fetchPriority="high" decoding="async" />
            </div>
            <div className="article-featured-card__body">
              <span className="article-category-pill">{articleCategory(featured, copy)}</span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <ArticleMeta article={featured} copy={copy} />
              <span className="article-read-button">{copy.readArticle} <ArrowRight size={16} aria-hidden="true" /></span>
            </div>
          </a>
        </div>
      </section>}

      <section className="article-latest-section" aria-labelledby="article-list-title">
        <div className="article-section-inner">
          <h2 id="article-list-title" className="article-list-title">{copy.allStories}</h2>
          {state === 'loading' && <LoadingRegion label={copy.loadingArticles}>
            <div className="article-grid">
              <SkeletonItems className="article-list-card">
                <Bone className="article-list-card__image" variant="media" /><div className="article-list-card__body"><SkeletonLines /></div>
              </SkeletonItems>
            </div>
          </LoadingRegion>}
          {state === 'error' && <p role="alert">{copy.weCouldnTLoadTheArticlesPlease}</p>}
          {state === 'ready' && articles.length === 0 && <p role="status">{copy.noPublishedArticlesMatchYourSearch}</p>}
          {state === 'ready' && <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div>}
          {state === 'ready' && result.totalPages > 1 && <nav aria-label={copy.articlePages} style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{copy.previous}</button>
            <span>{copy.page} {formatCopy(copy.of, { current: page, total: result.totalPages })}</span>
            <button type="button" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>{copy.next}</button>
          </nav>}
        </div>
      </section>
    </main>
    <Footer />
  </div>
}

function SafeArticleContent({ content }) {
  const copy = useStorefrontCopy()
  // Render CMS text without injecting HTML/script into the storefront.
  const blocks = String(content || '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
  if (!blocks.length) return <p>{copy.theArticleContentIsUnavailable}</p>
  return blocks.map((block, index) => {
    if (/^#{1,3}\s/.test(block)) return <h2 key={index}>{block.replace(/^#{1,3}\s*/, '')}</h2>
    if (block.split('\n').every((line) => /^[-*]\s/.test(line))) return <ul key={index}>{block.split('\n').map((line, i) => <li key={i}>{line.replace(/^[-*]\s/, '')}</li>)}</ul>
    return <p key={index} style={{ whiteSpace: 'pre-line' }}>{block}</p>
  })
}

export function ArticleDetailPage({ slug }) {
  const copy = useStorefrontCopy()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [state, setState] = useState('loading')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    Promise.all([
      apiRequest(`/articles/${encodeURIComponent(slug)}`, { signal: controller.signal }),
      apiRequest('/articles?page=1&pageSize=4', { signal: controller.signal }).catch(() => ({ items: [] })),
    ]).then(([current, list]) => {
      if (controller.signal.aborted) return
      setArticle(current)
      setRelated((list.items || []).filter((item) => item.slug !== slug).slice(0, 3))
      setState('ready')
    }).catch((error) => {
      if (!controller.signal.aborted) setState(error.status === 404 ? 'not-found' : 'error')
    })
    return () => controller.abort()
  }, [slug])

  const date = article?.publishedAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(new Date(article.publishedAt)) : ''

  return <div className="article-shell">
    <Navbar variant="article" homepageMobileMenu />
    <main>
      {state === 'loading' && <LoadingRegion label={copy.loadingArticles}>
        <section className="article-detail-header"><div className="article-detail-header__inner">
          <Bone width="96px" height="24px" /><Bone width="75%" height="36px" /><SkeletonLines />
        </div></section>
        <section className="article-detail-hero"><Bone variant="media" /></section>
        <section className="article-detail-body"><div className="article-reading-layout">
          <aside className="article-share-rail"><Bone variant="circle" /></aside>
          <article className="article-reading-column"><SkeletonItems count={4}><SkeletonLines /></SkeletonItems></article>
        </div></section>
      </LoadingRegion>}
      {state !== 'ready' && state !== 'loading' && <section className="article-latest-section"><div className="article-section-inner" role="status">
        {state === 'not-found' ? copy.theArticleWasNotFoundOrHas : copy.weCouldnTLoadTheArticlePlease}
        <p><a href="/articles">{copy.backToArticles}</a></p>
      </div></section>}
      {state === 'ready' && <>
        <section className="article-detail-header"><div className="article-detail-header__inner">
          <span className="article-category-pill">{articleCategory(article, copy)}</span>
          <h1>{article.title}</h1><p>{article.excerpt}</p>
          <div className="article-detail-meta"><span>{date}</span><i /><span>{article.authorName || 'ZETRUV'}</span><i /><ArticleReadingTime minutes={article.readTimeMinutes} label={copy.minRead} /></div>
        </div></section>
        {article.thumbnailUrl && <section className="article-detail-hero"><img src={article.thumbnailUrl} alt="" fetchPriority="high" decoding="async" /></section>}
        <section className="article-detail-body"><div className="article-reading-layout">
          <aside className="article-share-rail"><span>{copy.share}</span><button type="button" aria-label={copy.copyArticleLink} onClick={async () => {
            try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { setCopied(false) }
          }}><Copy size={16} /></button>{copied && <small role="status">{copy.copied}</small>}</aside>
          <article className="article-reading-column"><SafeArticleContent content={article.content} /></article>
        </div></section>
        {related.length > 0 && <section className="article-read-next"><div className="article-read-next__inner">
          <div className="article-read-next__header"><h2>{copy.relatedArticles}</h2></div>
          <div className="article-related-grid">{related.map((item) => <a href={`/articles/${encodeURIComponent(item.slug)}`} key={item.id}>
            <img src={articleImage(item)} alt="" loading="lazy" decoding="async" />
            <span className="article-category-pill">{articleCategory(item, copy)}</span><h3>{item.title}</h3><ArticleMeta article={item} copy={copy} />
          </a>)}</div><a className="article-view-all" href="/articles">{copy.viewAllArticles2} <ArrowRight size={14} /></a>
        </div></section>}
      </>}
    </main>
    <Footer />
  </div>
}
