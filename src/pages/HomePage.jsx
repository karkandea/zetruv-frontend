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
import { homepageMock } from '../data/mockData'
import { getHomepageData } from '../services/homeService'

function mergeHomepageData(result = {}) {
  return {
    ...homepageMock,
    ...result,
    serviceCategories: result.serviceCategories ?? homepageMock.serviceCategories,
    popularGames: result.popularGames ?? homepageMock.popularGames,
    recentPurchases: result.recentPurchases ?? homepageMock.recentPurchases,
    flashSale: result.flashSale ?? homepageMock.flashSale,
    jockeyGames: result.jockeyGames ?? result.trending ?? homepageMock.jockeyGames,
    merchandise: result.merchandise ?? homepageMock.merchandise,
  }
}

export default function HomePage() {
  const [data, setData] = useState(homepageMock)

  useEffect(() => {
    let active = true
    getHomepageData().then((result) => {
      if (active) setData(mergeHomepageData(result))
    })
    return () => { active = false }
  }, [])

  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <Hero />
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
