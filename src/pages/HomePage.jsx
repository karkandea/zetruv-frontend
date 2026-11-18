import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ServiceCategories from '../components/ServiceCategories'
import FlashSale from '../components/FlashSale'
import PopularAndRecent from '../components/PopularAndRecent'
import JockeyGames from '../components/JockeyGames'
import GameAccounts from '../components/GameAccounts'
import Merchandise from '../components/Merchandise'
import LatestArticles from '../components/LatestArticles'
import SupportChat from '../components/SupportChat'
import Footer from '../components/Footer'
import CookieNotice from '../components/CookieNotice'
import { getHomepageData, getPersonalHomepage } from '../services/homeService'
import { CUSTOMER_EVENT, readCustomerSession } from '../services/customerCartSync'

const emptyHomepage = {
  heroes: [],
  serviceCategories: [],
  popularGames: [],
  recentPurchases: [],
  flashSale: [],
  flashSaleEndsAt: undefined,
  jockeyGames: [],
  gameAccounts: [],
  merchandise: [],
  latestArticles: [],
}

export default function HomePage() {
  const copy = useStorefrontCopy()
  const [{ data, loadedFor }, setHomepage] = useState({ data: emptyHomepage, loadedFor: null })
  const [session, setSession] = useState(readCustomerSession)
  const token = session?.accessToken || null
  const [hasError, setHasError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const update = () => setSession(readCustomerSession())
    window.addEventListener(CUSTOMER_EVENT, update)
    return () => window.removeEventListener(CUSTOMER_EVENT, update)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    // Personal purchases are not included in the public homepage response.
    const request = token
      ? getPersonalHomepage(token).catch((error) => {
        if (error.status === 401 || error.status === 403) return getHomepageData()
        throw error
      })
      : getHomepageData()
    request
      .then((result) => {
        if (active) {
          setHomepage({ data: { ...emptyHomepage, ...result }, loadedFor: token })
          setHasError(false)
          setLoading(false)
        }
      })
      .catch((error) => {
        if (active) { setHasError(true); setLoading(false) }
        console.error('Homepage API unavailable.', error)
      })
    return () => { active = false }
  }, [token])

  const recent = token && token === loadedFor && !hasError ? data.recentPurchases : []

  return (
    <div className="site-shell site-shell--homepage-final">
      <Navbar
        variant={session ? 'homeLoggedIn' : 'default'}
        homepageMobileMenu
        onAuthenticated={() => setSession(readCustomerSession())}
      />
      <main>
        {hasError && <p role="alert" style={{ textAlign: 'center', padding: 16 }}>{copy.weCouldnTLoadTheHomepagePlease}</p>}
        {loading && <p className="skeleton-status" role="status">{copy.loadingTheZetruvHomepage}</p>}
        <div className={loading ? 'skeleton-content' : undefined} inert={loading} aria-hidden={loading || undefined}>
          <Hero items={data.heroes} loading={loading} />
          <ServiceCategories items={data.serviceCategories} loading={loading} />
          <FlashSale items={data.flashSale} countdown={data.flashSaleEndsAt} loading={loading} />
          <PopularAndRecent popular={data.popularGames} recent={recent} loading={loading} />
          <JockeyGames items={data.jockeyGames} loading={loading} />
          <GameAccounts items={data.gameAccounts} loading={loading} />
          <Merchandise items={data.merchandise} loading={loading} />
          <LatestArticles items={data.latestArticles} loading={loading} />
        </div>
      </main>
      <Footer />
      <SupportChat />
      <CookieNotice />
    </div>
  )
}
