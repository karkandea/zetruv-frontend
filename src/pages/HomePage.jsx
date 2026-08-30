import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import FlashSale from '../components/FlashSale'
import TrendingGames from '../components/TrendingGames'
import SupportChat from '../components/SupportChat'
import Footer from '../components/Footer'
import { homepageMock } from '../data/mockData'
import { getHomepageData } from '../services/homeService'

export default function HomePage() {
  const [data, setData] = useState(homepageMock)

  useEffect(() => {
    let active = true
    getHomepageData().then((result) => {
      if (active) setData(result)
    })
    return () => { active = false }
  }, [])

  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <Hero registeredUsers={data.registeredUsers} />
        <FlashSale items={data.flashSale} countdown={data.flashSaleEndsAt} />
        <TrendingGames items={data.trending} />
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}
