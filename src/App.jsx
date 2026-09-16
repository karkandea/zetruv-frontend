import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductDetailLoginPage from './pages/ProductDetailLoginPage'
import LeaderboardPage from './pages/LeaderboardPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'
import OrderStatusPage from './pages/OrderStatusPage'
import {
  GameAccountsPage,
  GameAccountListingPage,
  GameAccountDetailPage,
  GameAccountCartPage,
  GameAccountCheckoutPage,
} from './pages/GameAccountPages'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const params = new URLSearchParams(window.location.search)
  const flow = params.get('flow')
  const kind = params.get('kind')

  if (path === '/leaderboard') return <LeaderboardPage />
  if (path === '/cart' && flow === 'account') return <GameAccountCartPage />
  if (path === '/checkout' && flow === 'account') return <GameAccountCheckoutPage />
  if (path === '/cart') return <CartPage />
  if (path === '/checkout') return <CheckoutPage />
  if (path === '/payment') return <PaymentPage />
  if (path === '/order-status' || path === '/track-order') return <OrderStatusPage />

  const accountDetailMatch = path.match(/^\/game-accounts\/([^/]+)\/([^/]+)$/)
  if (accountDetailMatch) {
    return <GameAccountDetailPage gameSlug={decodeURIComponent(accountDetailMatch[1])} accountSlug={decodeURIComponent(accountDetailMatch[2])} />
  }

  const accountListingMatch = path.match(/^\/game-accounts\/([^/]+)$/)
  if (accountListingMatch) return <GameAccountListingPage gameSlug={decodeURIComponent(accountListingMatch[1])} />
  if (path === '/game-accounts') return <GameAccountsPage />
  if ((path === '/search' || path === '/categories') && kind === 'GameAccount') return <GameAccountsPage />

  const loginProductMatch = path.match(/^\/(?:product|product-detail)\/([^/]+)\/login$/)
    || path.match(/^\/product\/login\/([^/]+)$/)
  if (loginProductMatch) return <ProductDetailLoginPage slug={decodeURIComponent(loginProductMatch[1])} />

  const productMatch = path.match(/^\/(?:product|product-detail)\/([^/]+)$/)
  if (productMatch) return <ProductDetailPage slug={decodeURIComponent(productMatch[1])} />

  if (path === '/search/login' || path === '/categories/login') return <SearchPage mode="login" />
  if (path === '/search' || path === '/categories') return <SearchPage />
  return <HomePage />
}
