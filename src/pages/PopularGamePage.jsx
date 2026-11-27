import StorefrontState from '../components/StorefrontState'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { getCatalogProducts } from '../services/catalogService'
import { searchProductHref } from '../services/navbarSearchHelpers'

const servicePriority = ['TopUpGame', 'TopUpLogin', 'GameVoucher', 'Joki', 'GameAccount']

export default function PopularGamePage({ slug }) {
  const copy = useStorefrontCopy()
  const [state, setState] = useState('loading')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    getCatalogProducts({ game: slug, pageSize: 100, signal: controller.signal })
      .then(({ items }) => {
        if (controller.signal.aborted) return
        const available = (items || []).filter((item) => item.slug && item.isAvailable !== false)
        const product = servicePriority
          .map((kind) => available.find((item) => item.kind === kind))
          .find(Boolean)
        if (product) window.location.replace(searchProductHref(product))
        else setState('empty')
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('error')
      })
    return () => controller.abort()
  }, [slug, retry])

  return (
    <div className="search-site-shell">
      <Navbar homepageMobileMenu />
      <main className="search-page search-page--browse">
        <div className="search-page__container">
          <p className="search-breadcrumb"><a href="/">{copy.home}</a> {copy.popularGames}</p>
          {state === 'loading' ? <div className="search-empty search-empty--browse" role="status">{copy.loadingCatalog}</div> : <StorefrontState kind={state === 'error' ? 'error' : 'empty'} title={state === 'error' ? copy.weCouldnTLoadTheCatalogPlease : copy.noProductsFoundInThisCategory} action={state === 'error' ? copy.tryAgain3 : undefined} onAction={() => setRetry(n => n + 1)} href="/search" linkLabel={copy.browseProducts} />}
        </div>
      </main>
    </div>
  )
}
