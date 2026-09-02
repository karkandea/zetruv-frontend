import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ServiceCategories from '../components/ServiceCategories'
import PopularAndRecent from '../components/PopularAndRecent'
import FlashSale from '../components/FlashSale'
import JockeyGames from '../components/JockeyGames'
import Merchandise from '../components/Merchandise'
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
  merchandise: [],
}

export default function HomePage() {
  const [data, setData] = useState(emptyHomepage)

  useEffect(() => {
    let active = true
    getHomepageData()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((error) => {
        console.error('Homepage API unavailable.', error)
      })
    return () => { active = false }
  }, [])

  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <Hero hero={data.hero} />
        <ServiceCategories items={data.serviceCategories} />
        <PopularAndRecent popular={data.popularGames} recent={data.recentPurchases} />
        <FlashSale items={data.flashSale} countdown={data.flashSaleEndsAt} />
        <JockeyGames items={data.jockeyGames} />
        <Merchandise items={data.merchandise} />
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}
