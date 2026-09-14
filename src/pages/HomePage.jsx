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
import { getHomepageData } from '../services/homeService'

const emptyHomepage = {
  hero: null,
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem('zetruv-auth-preview') === '1'
  })

  useEffect(() => {
    let active = true
    getHomepageData()
      .then((result) => {
        if (active) setData({ ...emptyHomepage, ...result })
      })
      .catch((error) => {
        console.error('Homepage API unavailable.', error)
      })
    return () => { active = false }
  }, [])

  return (
    <div className="site-shell site-shell--homepage-final">
      <Navbar
        variant={isAuthenticated ? 'homeLoggedIn' : 'default'}
        onAuthenticated={() => {
          window.sessionStorage.setItem('zetruv-auth-preview', '1')
          setIsAuthenticated(true)
        }}
      />
      <main>
        <Hero />
        <ServiceCategories />
        <FlashSale items={data.flashSale} countdown={data.flashSaleEndsAt} />
        <PopularAndRecent popular={data.popularGames} recent={data.recentPurchases} />
        <JockeyGames items={data.jockeyGames} />
        <GameAccounts items={data.gameAccounts} />
        <Merchandise items={data.merchandise} />
        <LatestArticles items={data.latestArticles} />
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}
