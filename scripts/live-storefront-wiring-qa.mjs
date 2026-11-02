// Synthetic browser verification of CMS / catalog / customer API wiring.
// All responses are intercepted; no registration, checkout or payment calls.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const site = 'http://127.0.0.1:4178'

const article = {
  id: 'article-qa', slug: 'synthetic-qa-guide', title: 'Synthetic CMS Guide',
  excerpt: 'Published editorial content from API', thumbnailUrl: '',
  category: { id: 'category-qa', name: 'Guides', slug: 'guides' },
  authorName: 'QA Editor', publishedAt: '2026-10-30T01:00:00Z',
  readTimeMinutes: 3, content: 'This paragraph is provided by CMS.\n\n## Verified heading',
}
const merchandise = {
  id: 'product-qa', slug: 'synthetic-qa-jersey', name: 'Synthetic QA Jersey',
  kind: 'Merchandise', categorySlug: 'merchandise', thumbnailUrl: '',
  isAvailable: true, minPrice: 123000, soldQuantity: 0, rating: null,
  reviewCount: 0,
}
const homepage = {
  heroes: [{ id: 'banner-qa', title: 'Synthetic CMS Banner', subtitle: 'Real API shape', imageUrl: '',
    primaryCtaLabel: 'Lihat katalog', primaryCtaUrl: '/search' }],
  serviceCategories: [{ id: 'category-qa', name: 'Merchandise CMS', kind: 'Merchandise', slug: 'merchandise' }],
  popularGames: [], recentlyPurchased: [], flashSale: null, joki: [], gameAccounts: [],
  merchandise: [merchandise], latestArticles: [article],
}
const product = {
  ...merchandise, description: 'Product details supplied by catalog.',
  images: [], variants: [{ id: 'variant-qa', name: 'XL', price: 123000, effectivePrice: 119000,
    stockQuantity: 3, isAvailable: true }],
}

async function json(route, body, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

try {
  for (const [device, viewport] of [
    ['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport })
    await context.route('**/api/v1/homepage', (route) => json(route, homepage))
    await context.route('**/api/v1/articles/categories', (route) => json(route, [article.category]))
    await context.route('**/api/v1/articles/synthetic-qa-guide', (route) => json(route, article))
    await context.route('**/api/v1/articles?*', (route) => json(route, {
      items: [article], page: 1, pageSize: 12, totalItems: 1, totalPages: 1,
    }))
    await context.route('**/api/v1/catalog/products?*', (route) => json(route, {
      items: [merchandise], page: 1, pageSize: 50, totalItems: 1, totalPages: 1,
    }))
    await context.route('**/api/v1/catalog/products/synthetic-qa-jersey', (route) => json(route, product))
    await context.route('**/api/v1/auth/me', (route) => json(route, {
      id: 'account-qa', name: 'Synthetic Customer', email: 'qa@example.test', emailVerified: true,
    }))

    const page = await context.newPage()
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto(site, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Synthetic CMS Banner' }).waitFor()
    await page.getByText('Merchandise CMS').waitFor()
    await page.getByRole('heading', { name: 'Synthetic CMS Guide' }).waitFor()
    assert.equal(await page.getByText('5 Things to Check Before Buying a Game Account').count(), 0)
    assert.equal(await page.locator('.merch-card').count(), 1)
    assert.equal(await page.getByText('4.9', { exact: true }).count(), 0)

    await page.goto(`${site}/articles`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Synthetic CMS Guide' }).first().waitFor()
    await page.goto(`${site}/articles/synthetic-qa-guide`, { waitUntil: 'domcontentloaded' })
    await page.getByText('This paragraph is provided by CMS.').waitFor()
    await page.getByRole('heading', { name: 'Verified heading' }).waitFor()

    await page.goto(`${site}/merchandise`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Synthetic QA Jersey').waitFor()
    await page.goto(`${site}/merchandise/synthetic-qa-jersey`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Synthetic QA Jersey' }).waitFor()
    await page.getByText('Rp119.000').first().waitFor()
    await page.getByRole('button', { name: 'Simpan Draft Keranjang' }).click()
    await page.getByText(/Draft Synthetic QA Jersey/).waitFor()
    const physicalCart = await page.evaluate(() => JSON.parse(sessionStorage.getItem('zetruv-physical-cart-v1') || 'null'))
    assert.equal(physicalCart.variantId, 'variant-qa')
    assert.equal(physicalCart.price, 119000)

    await page.addInitScript(() => sessionStorage.setItem('zetruv-customer-session-v1', JSON.stringify({
      version: 1, accessToken: 'synthetic-qa-jwt-token-more-than-30-characters', customer: { name: 'Stale Browser Name', email: 'stale@example.test' },
    })))
    await page.goto(`${site}/account`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Synthetic Customer').first().waitFor()
    await page.getByText('qa@example.test').first().waitFor()
    assert.equal(await page.getByText('Stale Browser Name').count(), 0)
    assert.deepEqual(pageErrors, [])
    console.log('PASS:', device, 'homepage CMS, articles, merchandise draft, verified customer profile')
    await context.close()
  }
} finally {
  await browser.close()
}
