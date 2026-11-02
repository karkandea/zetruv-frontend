import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Copy, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { apiRequest } from '../api/httpClient'
import { assets } from '../data/assets'
import '../styles/articles.css'

const articleImage = (article) => article.thumbnailUrl || assets.articleOne
const articleCategory = (article) => article.category?.name || 'Artikel'
const articleMeta = (article) => `${article.authorName || 'Zetruv'} · ${article.readTimeMinutes || 1} min read`

function ArticleCard({ article }) {
  return <a className="article-list-card" href={`/articles/${encodeURIComponent(article.slug)}`}>
    <img src={articleImage(article)} alt="" loading="lazy" decoding="async" />
    <div className="article-list-card__body">
      <span className="article-category-pill">{articleCategory(article)}</span>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <small>{articleMeta(article)}</small>
    </div>
  </a>
}

export function ArticlesPage() {
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
  const featured = useMemo(() => page === 1 && !category && !search ? articles[0] : null, [articles, page, category, search])

  return <div className="article-shell">
    <Navbar variant="article" />
    <main>
      <section className="article-index-header">
        <div className="article-index-header__inner">
          <span className="article-eyebrow">ZETRUV STORIES</span>
          <h1>Articles &amp; Guides</h1>
          <p>Artikel yang diterbitkan oleh tim Zetruv.</p>
          <div className="article-index-tools">
            <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari artikel" aria-label="Cari artikel" /></label>
            <div>
              <button type="button" className={!category ? 'active' : ''} onClick={() => { setCategory(''); setPage(1) }}>Semua</button>
              {categories.map((item) => <button type="button" className={category === item.slug ? 'active' : ''} onClick={() => { setCategory(item.slug); setPage(1) }} key={item.id}>{item.name}</button>)}
            </div>
          </div>
        </div>
      </section>

      {featured && state === 'ready' && <section className="article-featured-section">
        <div className="article-section-inner">
          <div className="article-section-heading"><span>ARTIKEL TERBARU</span><h2>Mulai dari sini</h2></div>
          <a className="article-featured-card" href={`/articles/${encodeURIComponent(featured.slug)}`}>
            <img src={articleImage(featured)} alt="" fetchPriority="high" decoding="async" />
            <div><span className="article-category-pill">{articleCategory(featured)}</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><small>{articleMeta(featured)}</small><span className="article-read-button">Baca artikel <ArrowRight size={16} /></span></div>
          </a>
        </div>
      </section>}

      <section className="article-latest-section">
        <div className="article-section-inner">
          <div className="article-section-heading"><span>ARTIKEL</span><h2>Semua cerita</h2></div>
          {state === 'loading' && <p role="status">Memuat artikel…</p>}
          {state === 'error' && <p role="alert">Artikel gagal dimuat. Silakan muat ulang halaman.</p>}
          {state === 'ready' && articles.length === 0 && <p role="status">Belum ada artikel terbit yang cocok dengan pencarian ini.</p>}
          {state === 'ready' && <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div>}
          {state === 'ready' && result.totalPages > 1 && <nav aria-label="Halaman artikel" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
            <span>Halaman {page} dari {result.totalPages}</span>
            <button type="button" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
          </nav>}
        </div>
      </section>
    </main>
    <Footer />
  </div>
}

function SafeArticleContent({ content }) {
  // Render CMS text without injecting HTML/script into the storefront.
  const blocks = String(content || '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean)
  if (!blocks.length) return <p>Konten artikel belum tersedia.</p>
  return blocks.map((block, index) => {
    if (/^#{1,3}\s/.test(block)) return <h2 key={index}>{block.replace(/^#{1,3}\s*/, '')}</h2>
    if (block.split('\n').every((line) => /^[-*]\s/.test(line))) return <ul key={index}>{block.split('\n').map((line, i) => <li key={i}>{line.replace(/^[-*]\s/, '')}</li>)}</ul>
    return <p key={index} style={{ whiteSpace: 'pre-line' }}>{block}</p>
  })
}

export function ArticleDetailPage({ slug }) {
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
    <Navbar variant="article" />
    <main>
      {state !== 'ready' && <section className="article-latest-section"><div className="article-section-inner" role="status">
        {state === 'loading' ? 'Memuat artikel…' : state === 'not-found' ? 'Artikel tidak ditemukan atau belum dipublikasikan.' : 'Artikel gagal dimuat. Silakan coba lagi.'}
        <p><a href="/articles">Kembali ke daftar artikel</a></p>
      </div></section>}
      {state === 'ready' && <>
        <section className="article-detail-header"><div className="article-detail-header__inner">
          <span className="article-category-pill">{articleCategory(article)}</span>
          <h1>{article.title}</h1><p>{article.excerpt}</p>
          <div className="article-detail-meta"><span>{date}</span><i /><span>{article.authorName || 'ZETRUV'}</span><i /><span>{article.readTimeMinutes} MIN READ</span></div>
        </div></section>
        {article.thumbnailUrl && <section className="article-detail-hero"><img src={article.thumbnailUrl} alt="" fetchPriority="high" decoding="async" /></section>}
        <section className="article-detail-body"><div className="article-reading-layout">
          <aside className="article-share-rail"><span>SHARE</span><button type="button" aria-label="Salin tautan artikel" onClick={async () => {
            try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { setCopied(false) }
          }}><Copy size={16} /></button>{copied && <small role="status">Tersalin</small>}</aside>
          <article className="article-reading-column"><SafeArticleContent content={article.content} /></article>
        </div></section>
        {related.length > 0 && <section className="article-read-next"><div className="article-read-next__inner">
          <div className="article-read-next__header"><h2>Baca juga</h2></div>
          <div className="article-related-grid">{related.map((item) => <a href={`/articles/${encodeURIComponent(item.slug)}`} key={item.id}>
            <img src={articleImage(item)} alt="" loading="lazy" decoding="async" />
            <span className="article-category-pill">{articleCategory(item)}</span><h3>{item.title}</h3><small>{articleMeta(item)}</small>
          </a>)}</div><a className="article-view-all" href="/articles">Lihat semua artikel <ArrowRight size={14} /></a>
        </div></section>}
      </>}
    </main>
    <Footer />
  </div>
}
