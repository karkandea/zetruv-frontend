import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductDetailLoginPage from './pages/ProductDetailLoginPage'
import SpecialProductPage from './pages/SpecialProductPage'
import LeaderboardPage from './pages/LeaderboardPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'
import SharedOrderStatusPage from './pages/SharedOrderStatusPage'
import { PhysicalCartPage, PhysicalCheckoutPage, PhysicalPaymentPage, PhysicalOrderTrackingPage } from './pages/PhysicalPurchasePages'
import { LivePhysicalCatalogPage, LivePhysicalProductPage } from './pages/LivePhysicalPages'
import { ArticlesPage, ArticleDetailPage } from './pages/ArticlePages'
import { AccountOverviewPage, AccountEditProfilePage, AccountAddressesPage, AccountAddressFormPage, AccountFavoritesPage } from './pages/AccountPages'
import CustomerOrdersPage from './pages/CustomerOrdersPage'
import Navbar from './components/Navbar'
import VerifyEmailPage from './pages/VerifyEmailPage'
import { GameAccountsPage, GameAccountListingPage, GameAccountDetailPage } from './pages/GameAccountPublicPages'
import {
  GameAccountCartPage,
  GameAccountCheckoutPage,
  GameAccountPaymentPage,
  GameAccountOrderDetailPage,
} from './pages/GameAccountPages'

function AccountOrderUnavailablePage() {
  return <div className="account-page"><Navbar variant="account" homepageMobileMenu />
    <main className="account-layout" style={{ display: 'block' }}>
      <section className="account-main" style={{ marginInline: 'auto', maxWidth: 720, padding: '40px 24px', textAlign: 'center' }}>
        <h1>Detail pesanan belum tersedia</h1>
        <p>Buka Pesanan Saya untuk melihat status pembayaran dan pemrosesan.</p>
        <a href="/account/orders" className="account-btn account-btn--primary">Pesanan Saya</a>
      </section>
    </main>
  </div>
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const params = new URLSearchParams(window.location.search)
  const flow = params.get('flow')
  const kind = params.get('kind')

  if (path === '/auth/verify-email') return <VerifyEmailPage />

  if (path === '/account' || path === '/my-account') return <AccountOverviewPage />
  if (path === '/account/edit' || path === '/account/profile') return <AccountEditProfilePage />

  const accountOrderPaymentMatch = path.match(/^\/account\/orders\/([^/]+)\/payment$/)
  if (accountOrderPaymentMatch) return <AccountOrderUnavailablePage />
  const accountOrderTrackingMatch = path.match(/^\/account\/orders\/([^/]+)\/tracking$/)
  if (accountOrderTrackingMatch) return <AccountOrderUnavailablePage />
  const accountOrderUpdateMatch = path.match(/^\/account\/orders\/([^/]+)\/update-login$/)
  if (accountOrderUpdateMatch) return <AccountOrderUnavailablePage />
  const accountOrderDetailMatch = path.match(/^\/account\/orders\/([^/]+)$/)
  if (accountOrderDetailMatch) return <CustomerOrdersPage orderId={accountOrderDetailMatch[1]} />

  if (path === '/account/orders') return <CustomerOrdersPage />
  if (path === '/account/addresses/add') return <AccountAddressFormPage mode="add" />
  if (path === '/account/addresses/edit') return <AccountAddressFormPage mode="edit" />
  if (path === '/account/addresses' || path === '/account/address') return <AccountAddressesPage />
  if (path === '/account/favorites' || path === '/account/favourites') return <AccountFavoritesPage />
  if (path === '/leaderboard') return <LeaderboardPage />
  if (path === '/articles' || path === '/article') return <ArticlesPage />
  const articleDetailMatch = path.match(/^\/(?:articles|article)\/([^/]+)$/)
  if (articleDetailMatch) return <ArticleDetailPage slug={decodeURIComponent(articleDetailMatch[1])} />
  if (path === '/cart' && flow === 'account') return <GameAccountCartPage />
  if (path === '/checkout' && flow === 'account') return <GameAccountCheckoutPage />
  if (path === '/payment' && flow === 'account') return <GameAccountPaymentPage />

  if (path === '/merchandise') return <LivePhysicalCatalogPage />
  const physicalProductMatch = path.match(/^\/merchandise\/([^/]+)$/)
  if (physicalProductMatch) return <LivePhysicalProductPage slug={decodeURIComponent(physicalProductMatch[1])} />
  if (path === '/cart' && flow === 'physical') return <PhysicalCartPage />
  if (path === '/checkout' && flow === 'physical') return <PhysicalCheckoutPage />
  if (path === '/payment' && flow === 'physical') return <PhysicalPaymentPage state={params.get('state') || 'pending'} />
  if ((path === '/order-status' || path === '/track-order') && flow === 'physical') return <PhysicalOrderTrackingPage state={params.get('state') || 'shipped'} />

  if (path === '/cart') return <CartPage />
  if (path === '/checkout') return <CheckoutPage />
  if (path === '/payment') return <PaymentPage />
  if (path === '/order-status' || path === '/track-order') {
    return params.get('guest') === '1' ? <SharedOrderStatusPage /> : <CustomerOrdersPage />
  }

  const accountDetailMatch = path.match(/^\/game-accounts\/([^/]+)\/([^/]+)$/)
  if (accountDetailMatch) {
    return <GameAccountDetailPage gameSlug={decodeURIComponent(accountDetailMatch[1])} accountSlug={decodeURIComponent(accountDetailMatch[2])} />
  }

  const accountListingMatch = path.match(/^\/game-accounts\/([^/]+)$/)
  if (accountListingMatch) return <GameAccountListingPage gameSlug={decodeURIComponent(accountListingMatch[1])} />
  if (path === '/game-accounts') return <GameAccountsPage />

  const voucherProductMatch = path.match(/^\/product\/voucher\/([^/]+)$/)
  if (voucherProductMatch) return <SpecialProductPage type="voucher" slug={decodeURIComponent(voucherProductMatch[1])} />

  const jokiProductMatch = path.match(/^\/product\/joki\/([^/]+)$/)
  if (jokiProductMatch) return <SpecialProductPage type="joki" slug={decodeURIComponent(jokiProductMatch[1])} />

  const loginProductMatch = path.match(/^\/(?:product|product-detail)\/([^/]+)\/login$/)
    || path.match(/^\/product\/login\/([^/]+)$/)
  if (loginProductMatch) return <ProductDetailLoginPage slug={decodeURIComponent(loginProductMatch[1])} initialVariantId={params.get('variant') || ''} />

  const productMatch = path.match(/^\/(?:product|product-detail)\/([^/]+)$/)
  if (productMatch) return <ProductDetailPage slug={decodeURIComponent(productMatch[1])} initialVariantId={params.get('variant') || ''} />

  if (path === '/search/login' || path === '/categories/login') return <SearchPage mode="login" />
  if (path === '/search' || path === '/categories') return <SearchPage />
  return <HomePage />
}
