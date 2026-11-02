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
  const [data, setData] = useState(emptyHomepage)
  const [session, setSession] = useState(readCustomerSession)
  const [error, setError] = useState('')
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
        if (active) { setData({ ...emptyHomepage, ...result }); setError(''); setLoading(false) }
      })
      .catch((error) => {
        if (active) { setError('Konten beranda belum bisa dimuat. Coba muat ulang halaman.'); setLoading(false) }
        console.error('Homepage API unavailable.', error)
      })
    return () => { active = false }
  }, [session?.accessToken])

  return (
    <div className="site-shell site-shell--homepage-final">
      <Navbar
        variant={session ? 'homeLoggedIn' : 'default'}
        onAuthenticated={() => setSession(readCustomerSession())}
      />
      <main>
        {error && <p role="alert" style={{ textAlign: 'center', padding: 16 }}>{error}</p>}
        {loading ? <p role="status" style={{ padding: 48, textAlign: 'center' }}>Memuat beranda Zetruv…</p> : <>
        <Hero items={data.heroes} />
        <ServiceCategories items={data.serviceCategories} />
        <FlashSale items={data.flashSale} countdown={data.flashSaleEndsAt} />
        <PopularAndRecent popular={data.popularGames} recent={data.recentPurchases} authenticated={Boolean(session)} />
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
