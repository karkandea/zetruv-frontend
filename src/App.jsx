import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/search/login' || path === '/categories/login') {
    return <SearchPage mode="login" />
  }

  if (path === '/search' || path === '/categories') {
    return <SearchPage />
  }

  return <HomePage />
}
