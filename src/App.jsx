import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductDetailLoginPage from './pages/ProductDetailLoginPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const segments = path.split('/').filter(Boolean)

  if (path === '/leaderboard') {
    return <LeaderboardPage />
  }

  if (
    segments.length === 3
    && (segments[0] === 'product' || segments[0] === 'product-detail')
    && segments[2] === 'login'
  ) {
    return <ProductDetailLoginPage slug={segments[1]} />
  }

  if (
    segments.length === 2
    && (segments[0] === 'product' || segments[0] === 'product-detail')
  ) {
    return <ProductDetailPage slug={segments[1]} />
  }

  if (path === '/product/login/genshin-impact') {
    return <ProductDetailLoginPage slug="genshin-impact" />
  }

  if (path === '/search/login' || path === '/categories/login') {
    return <SearchPage mode="login" />
  }

  if (path === '/search' || path === '/categories') {
    return <SearchPage />
  }

  return <HomePage />
}
