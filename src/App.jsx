import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductDetailLoginPage from './pages/ProductDetailLoginPage'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (
    path === '/product/genshin-impact/login'
    || path === '/product-detail/genshin-impact/login'
    || path === '/product/login/genshin-impact'
  ) {
    return <ProductDetailLoginPage />
  }

  if (path === '/product/mobile-legends' || path === '/product-detail/mobile-legends') {
    return <ProductDetailPage />
  }

  if (path === '/search/login' || path === '/categories/login') {
    return <SearchPage mode="login" />
  }

  if (path === '/search' || path === '/categories') {
    return <SearchPage />
  }

  return <HomePage />
}
