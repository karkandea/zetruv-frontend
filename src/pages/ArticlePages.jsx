import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import { assets } from '../data/assets'
import { articleAssets } from '../data/articleAssets'
import '../styles/articles.css'

const articles = [
  {
    slug: 'how-to-secure-your-account-after-purchase',
    category: 'SECURITY',
    title: 'How to Secure Your Account After Purchase',
    description: 'Simple steps to lock down email, password, recovery methods, and 2FA after the transfer.',
    meta: 'Account Safety  ·  4 min read',
    image: articleAssets.thumbA,
  },
  {
    slug: 'dota-2-rank-guide-what-each-tier-means',
    category: 'DOTA 2',
    title: 'Dota 2 Rank Guide: What Each Tier Means',
    description: 'Understand the ladder so you can compare listings with the right context before buying.',
    meta: 'Dota 2  ·  6 min read',
    image: articleAssets.thumbB,
  },
  {
    slug: 'how-to-choose-the-right-mobile-legends-diamond-pack',
    category: 'TOP UP',
    title: 'How to Choose the Right Mobile Legends Diamond Pack',
    description: 'A quick way to compare denominations, bonus value, and the safest route for your account.',
    meta: 'Top Up Guide  ·  5 min read',
    image: articleAssets.featured,
  },
  {
    slug: 'how-to-spot-a-trustworthy-game-account-seller',
    category: 'BUYER GUIDE',
    title: 'How to Spot a Trustworthy Game Account Seller',
    description: 'Signals to check before paying: history, proof of ownership, reviews, and recovery transparency.',
    meta: 'Buyer Guide  ·  7 min read',
    image: articleAssets.thumbA,
  },
  {
    slug: 'gaming-jersey-size-guide-get-the-fit-right',
    category: 'MERCH',
    title: 'Gaming Jersey Size Guide: Get the Fit Right',
    description: 'Use chest width, length, and preferred fit to choose the right jersey size before checkout.',
    meta: 'Merchandise  ·  4 min read',
    image: articleAssets.thumbB,
  },
  {
    slug: 'what-happens-after-you-place-an-order-on-zetruv',
    category: 'PAYMENT',
    title: 'What Happens After You Place an Order on Zetruv?',
    description: 'A simple breakdown of payment confirmation, seller processing, delivery, and support.',
    meta: 'Platform Guide  ·  5 min read',
    image: articleAssets.featured,
  },
]

const articleSections = [
  {
    index: '01',
    title: 'Verify that you can actually access the account',
    paragraphs: [
      'Start with the basics: confirm which login method is used and what credentials are included in the transfer. The listing should clearly state whether access is through email, username, publisher ID, or a third-party account.',
      'A working username and password does not automatically mean full ownership. The important question is whether you can control the account once the transfer is complete.',
    ],
    bullets: [
      'Ask exactly which credentials will be handed over.',
      'Check whether any region, platform, or device restrictions apply.',
    ],
  },
  {
    index: '02',
    title: 'Check recovery email and linked accounts',
    paragraphs: [
      'Recovery access is one of the most important parts of an account transfer. Confirm whether the original email can be changed, whether a phone number is linked, and whether external accounts are still connected.',
      'If a linked account cannot be removed, understand what that means before paying. A seller who still controls a recovery channel may be able to regain access later.',
    ],
    bullets: [
      'Confirm which recovery methods can be changed immediately.',
      'Ask whether any third-party account will remain linked after delivery.',
    ],
  },
  {
    index: '03',
    title: 'Confirm ownership history and seller proof',
    paragraphs: [
      'Look for signals that the seller genuinely controls the account. Useful proof may include recent in-game screenshots, account settings, purchase history, or other details that match the listing.',
      'Seller reputation matters too. Read recent reviews, check how long the seller has been active, and pay attention to how clearly they answer questions about ownership and recovery.',
    ],
    bullets: [
      'Compare listing details with the proof the seller provides.',
      'Prefer sellers with clear history and recent successful transactions.',
    ],
  },
  {
    index: '04',
    title: 'Understand your protection before you pay',
    paragraphs: [
      'Read the delivery terms, dispute process, and any guarantee that applies to the order. You should know what happens if the credentials do not work, the account is different from the listing, or access is recovered by the previous owner.',
      'Keep important communication and transaction details on-platform whenever possible. That gives support teams a clearer record if something goes wrong.',
    ],
    bullets: [
      'Check the order protection or dispute window.',
      'Do not move payment or critical communication outside the platform.',
    ],
  },
  {
    index: '05',
    title: 'Secure everything immediately after transfer',
    paragraphs: [
      'Once the account is delivered, change every credential the platform allows you to change. Update the password, recovery email, phone number, security questions, and two-factor authentication where available.',
      'Then review active sessions and connected devices. Sign out anything you do not recognise and store your new recovery information somewhere safe.',
    ],
    bullets: [
      'Change password and recovery details first.',
      'Enable 2FA and remove unfamiliar sessions or devices.',
    ],
  },
]

const checklist = [
  'I know exactly how the account will be delivered.',
  'I can change or control the recovery methods.',
  'The seller has provided credible ownership proof.',
  'I understand the protection and dispute process.',
  'I know what to secure immediately after transfer.',
]

function ArticleFooter() {
  const payments = [
    assets.payBca, assets.payBni, assets.payBri, assets.payCimb, assets.payDanamon, assets.payMaybank,
    assets.payPermata, assets.payDana, assets.payGopay, assets.payLinkaja, assets.payOvo, assets.payShopee,
  ]
  const socials = [assets.twitter, assets.instagram, assets.facebook, assets.discord, assets.youtube]

  return (
    <footer className="article-footer">
      <span className="article-footer__glow article-footer__glow--left" />
      <span className="article-footer__glow article-footer__glow--right" />
      <div className="article-footer__inner">
        <section className="article-footer__brand">
          <img src={assets.footerLogo || assets.logo} alt="Zetruv" />
          <p>Your gaming adventure is about to begin, before that let's top up first to make your story easier. Top up the game here, will make you more prepared to face all challenges. Easy transactions, Process only takes a few seconds!</p>
          <div className="article-footer__socials">{socials.map((icon, index) => <a href="#" key={index} aria-label={'Social ' + (index + 1)}><img src={icon} alt="" /></a>)}</div>
        </section>
        <section className="article-footer__links">
          <div><h3>Page</h3><a href="/">Homepage</a><a href="#">FAQ</a><a href="/articles">Articles</a><a href="/search">Product</a></div>
          <div><h3>Support</h3><a href="#">Youtube</a><a href="#">Facebook</a></div>
          <div><h3>Legality</h3><a href="#">Term &amp; Condition</a></div>
          <div className="article-footer__payment"><h3>Payment</h3><span>{payments.map((logo, index) => <img src={logo} alt="" key={index} />)}</span></div>
        </section>
      </div>
      <div className="article-footer__copyright">© 2026 CV Zetruv. All rights reserved.</div>
    </footer>
  )
}

function CategoryPill({ children }) {
  return <span className="article-category-pill">{children}</span>
}

function ArticleCard({ article }) {
  return (
    <a className="article-list-card" href={'/articles/' + article.slug}>
      <img src={article.image} alt="" loading="lazy" decoding="async" />
      <div className="article-list-card__body">
        <CategoryPill>{article.category}</CategoryPill>
        <h3>{article.title}</h3>
        <p>{article.description}</p>
        <small>{article.meta}</small>
      </div>
    </a>
  )
}

export function ArticlesPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Buyer Guide', 'Security', 'Game Guides', 'Updates']

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const matchQuery = (article.title + ' ' + article.description + ' ' + article.category).toLowerCase().includes(query.toLowerCase())
      if (!matchQuery) return false
      if (filter === 'All') return true
      if (filter === 'Buyer Guide') return article.category === 'BUYER GUIDE'
      if (filter === 'Security') return article.category === 'SECURITY'
      if (filter === 'Game Guides') return ['DOTA 2', 'TOP UP', 'MERCH'].includes(article.category)
      return article.category === 'PAYMENT'
    })
  }, [query, filter])

  return (
    <div className="article-shell">
      <Navbar variant="article" />

      <main>
        <section className="article-index-header">
          <div className="article-index-header__inner">
            <span className="article-eyebrow">ZETRUV STORIES</span>
            <h1>Articles &amp; Guides</h1>
            <p>Buyer guides, account security tips, game explainers, and platform updates — written to help you shop and play with confidence.</p>
            <div className="article-index-tools">
              <label>
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" />
              </label>
              <div>{filters.map((item) => <button type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
            </div>
          </div>
        </section>

        <section className="article-featured-section">
          <div className="article-section-inner">
            <div className="article-section-heading"><span>FEATURED STORY</span><h2>Start here</h2></div>
            <a className="article-featured-card" href="/articles/5-things-to-check-before-buying-a-game-account">
              <img src={activeArticle.image} alt="" fetchPriority="high" decoding="async" />
              <div>
                <CategoryPill>BUYER GUIDE</CategoryPill>
                <h2>5 Things to Check Before Buying a Game Account</h2>
                <p>A practical checklist for account access, recovery methods, ownership, seller credibility, and what to secure immediately after the transfer.</p>
                <small>Buyer Guide  ·  5 min read  ·  Updated Sep 2026</small>
                <span className="article-read-button">Read article <ArrowRight size={16} /></span>
              </div>
            </a>
          </div>
        </section>

        <section className="article-latest-section">
          <div className="article-section-inner">
            <div className="article-section-heading"><span>LATEST ARTICLES</span><h2>Browse all stories</h2></div>
            <div className="article-grid">
              {filtered.map((article) => <ArticleCard article={article} key={article.slug} />)}
            </div>
          </div>
        </section>

        <section className="article-newsletter-section">
          <div className="article-newsletter">
            <div><span>LEVEL UP YOUR INBOX</span><h2>Get useful guides, not spam.</h2><p>Fresh buyer tips, security reminders, and game explainers from Zetruv Stories.</p></div>
            <form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Enter your email" aria-label="Email address" /><button type="submit">Subscribe</button></form>
          </div>
        </section>
      </main>

      <ArticleFooter />
    </div>
  )
}

function ShareRail() {
  function copyLink() {
    if (navigator.clipboard) navigator.clipboard.writeText(window.location.href)
  }

  return (
    <aside className="article-share-rail">
      <span>SHARE</span>
      <button type="button" aria-label="Copy link" onClick={copyLink}><Copy size={16} /></button>
      <a href="#" aria-label="Share to Twitter"><img src={assets.twitter} alt="" /></a>
      <a href="#" aria-label="Share to Facebook"><img src={assets.facebook} alt="" /></a>
    </aside>
  )
}

export function ArticleDetailPage({ slug = '5-things-to-check-before-buying-a-game-account' }) {
  const featuredArticle = {
    slug: '5-things-to-check-before-buying-a-game-account',
    category: 'BUYER GUIDE',
    title: '5 Things to Check Before Buying a Game Account',
    description: 'A practical checklist for account access, recovery methods, ownership, seller credibility, and what to secure immediately after the transfer.',
    meta: 'Buyer Guide  ·  5 min read',
    image: articleAssets.featured,
  }
  const activeArticle = slug === featuredArticle.slug
    ? featuredArticle
    : articles.find((article) => article.slug === slug) || featuredArticle

  return (
    <div className="article-shell">
      <Navbar variant="article" />

      <main>
        <section className="article-detail-header">
          <div className="article-detail-header__inner">
            <CategoryPill>{activeArticle.category}</CategoryPill>
            <h1>{activeArticle.title}</h1>
            <p>{activeArticle.description}</p>
            <div className="article-detail-meta"><span>SEP 6, 2026</span><i /><span>ZETRUV EDITORIAL</span><i /><span>5 MIN READ</span></div>
          </div>
        </section>

        <section className="article-detail-hero">
          <img src={articleAssets.featured} alt="" fetchPriority="high" decoding="async" />
        </section>

        <section className="article-detail-body">
          <div className="article-reading-layout">
            <ShareRail />
            <article className="article-reading-column">
              <p className="article-lead">Buying a game account is different from buying a normal digital item. You are taking over access, recovery methods, and a history that may have been built over years.</p>
              <p>A few checks before payment can save you from losing access later. Use this guide as a practical pre-purchase checklist, and ask the seller whenever an important detail is unclear.</p>

              {articleSections.map((section) => (
                <section className="article-editorial-section" key={section.index}>
                  <span>{section.index}</span>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  <ul>{section.bullets.map((bullet) => <li key={bullet}><span /><span>{bullet}</span></li>)}</ul>
                </section>
              ))}

              <hr />

              <section className="article-checklist">
                <h2>Quick checklist before you buy</h2>
                <p>Use this as the final check before you continue to payment.</p>
                <ul>{checklist.map((item) => <li key={item}><span><Check size={13} /></span><strong>{item}</strong></li>)}</ul>
              </section>

              <aside className="article-editorial-note">
                <strong>EDITORIAL NOTE</strong>
                <p>Transfer rules can vary by game, publisher, and platform. Always check the listing requirements and the game publisher’s own account policies before purchasing.</p>
              </aside>
            </article>
          </div>
        </section>

        <section className="article-read-next">
          <div className="article-read-next__inner">
            <div className="article-read-next__header"><h2>Read next</h2><span><button type="button" aria-label="Previous"><ArrowLeft size={16} /></button><button type="button" aria-label="Next"><ArrowRight size={16} /></button></span></div>
            <div className="article-related-grid">
              <a href="/articles/how-to-secure-your-account-after-purchase"><img src={articleAssets.thumbA} alt="" loading="lazy" decoding="async" /><CategoryPill>SECURITY</CategoryPill><h3>How to Secure Your Account After Purchase</h3><small>4 min read</small></a>
              <a href="/articles/how-to-spot-a-trustworthy-game-account-seller"><img src={articleAssets.featured} alt="" loading="lazy" decoding="async" /><CategoryPill>BUYER GUIDE</CategoryPill><h3>How to Spot a Trustworthy Game Account Seller</h3><small>7 min read</small></a>
              <a href="/articles/what-happens-after-you-place-an-order-on-zetruv"><img src={articleAssets.thumbB} alt="" loading="lazy" decoding="async" /><CategoryPill>PAYMENT</CategoryPill><h3>What Happens After You Place an Order on Zetruv?</h3><small>5 min read</small></a>
            </div>
            <a className="article-view-all" href="/articles">View all articles <ArrowRight size={14} /></a>
          </div>
        </section>
      </main>

      <ArticleFooter />
    </div>
  )
}
