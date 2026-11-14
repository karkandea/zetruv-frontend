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
  const [data, setData] = useState(emptyHomepage)
  const [session, setSession] = useState(readCustomerSession)
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
    const request = session?.accessToken
      ? getPersonalHomepage(session.accessToken).catch((error) => {
        if (error.status === 401 || error.status === 403) return getHomepageData()
        throw error
      })
      : getHomepageData()
    request
      .then((result) => {
        if (active) { setData({ ...emptyHomepage, ...result }); setHasError(false); setLoading(false) }
      })
      .catch((error) => {
        if (active) { setHasError(true); setLoading(false) }
        console.error('Homepage API unavailable.', error)
      })
    return () => { active = false }
  }, [session?.accessToken])

  return (
    <div className="site-shell site-shell--homepage-final">
      <Navbar
        variant={session ? 'homeLoggedIn' : 'default'}
        homepageMobileMenu
        onAuthenticated={() => setSession(readCustomerSession())}
      />
      <main>
        {hasError && <p role="alert" style={{ textAlign: 'center', padding: 16 }}>{copy.weCouldnTLoadTheHomepagePlease}</p>}
        {loading ? <p role="status" style={{ padding: 48, textAlign: 'center' }}>{copy.loadingTheZetruvHomepage}</p> : <>
        <Hero items={data.heroes} />
        <ServiceCategories items={data.serviceCategories} />
        <FlashSale items={data.flashSale} countdown={data.flashSaleEndsAt} />
        <PopularAndRecent popular={data.popularGames} recent={data.recentPurchases} featured={data.flashSale} authenticated={Boolean(session)} />
        <JockeyGames items={data.jockeyGames} />
        <GameAccounts items={data.gameAccounts} />
        <Merchandise items={data.merchandise} />
        <LatestArticles items={data.latestArticles} />
        </>}
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}
