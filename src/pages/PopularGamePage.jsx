import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { getCatalogProducts } from '../services/catalogService'
import { searchProductHref } from '../services/navbarSearchHelpers'

const servicePriority = ['TopUpGame', 'TopUpLogin', 'GameVoucher', 'Joki', 'GameAccount']

export default function PopularGamePage({ slug }) {
  const copy = useStorefrontCopy()
  const [state, setState] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
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
  }, [slug])

  return (
    <div className="search-site-shell">
      <Navbar homepageMobileMenu />
      <main className="search-page search-page--browse">
        <div className="search-page__container">
          <p className="search-breadcrumb"><a href="/">{copy.home}</a> {copy.popularGames}</p>
          <div className="search-empty search-empty--browse" role="status">
            {state === 'loading' && copy.loadingCatalog}
            {state === 'empty' && copy.noProductsMatchYourSearch}
            {state === 'error' && copy.weCouldnTLoadTheCatalogPlease}
            {state !== 'loading' && <p><a href="/search">{copy.browseProducts}</a></p>}
          </div>
        </div>
      </main>
    </div>
  )
}
