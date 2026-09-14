import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductDetailLoginPage from './pages/ProductDetailLoginPage'
import LeaderboardPage from './pages/LeaderboardPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderStatusPage from './pages/OrderStatusPage'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/leaderboard') return <LeaderboardPage />
  if (path === '/cart') return <CartPage />
  if (path === '/checkout') return <CheckoutPage />
  if (path === '/order-status' || path === '/track-order') return <OrderStatusPage />

  const loginProductMatch = path.match(/^\/(?:product|product-detail)\/([^/]+)\/login$/)
    || path.match(/^\/product\/login\/([^/]+)$/)
  if (loginProductMatch) {
    return <ProductDetailLoginPage slug={decodeURIComponent(loginProductMatch[1])} />
  }

  const productMatch = path.match(/^\/(?:product|product-detail)\/([^/]+)$/)
  if (productMatch) {
    return <ProductDetailPage slug={decodeURIComponent(productMatch[1])} />
  }

  if (path === '/search/login' || path === '/categories/login') {
    return <SearchPage mode="login" />
  }

  if (path === '/search' || path === '/categories') {
    return <SearchPage />
  }

  return <HomePage />
}
