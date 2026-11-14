import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const site = 'http://127.0.0.1:4178'
const accessToken = 'qa-joki-mock-session-with-no-real-access'
const customer = { name: 'QA Joki', email: 'joki@example.test' }
const session = { accessToken, customer, expiresAt: '2099-01-01T00:00:00Z' }
const products = [
  {
    id: '6792bd94-f0b9-449d-a83a-bd9f8dcbe4e0', slug: 'demo-joki-mlbb-epic-ke-legend',
    name: 'Joki MLBB — Epic ke Legend', game: { name: 'Mobile Legends', publisher: 'Moonton' },
    variant: { id: '024f3d93-536a-4dd8-9130-dbc98bb4065b', name: 'Epic V → Legend V', price: 99000, effectivePrice: 89000 },
  },
  {
    id: 'db2d5409-a8c9-4a06-a357-40654ba49784', slug: 'demo-joki-dota2-boost-100-mmr',
    name: 'Joki Dota 2 — Boost 100 MMR', game: { name: 'Dota 2', publisher: 'Valve' },
    variant: { id: '69fc8aef-6915-47da-96a2-3a37389508a3', name: '100 MMR (3.001–4.000)', price: 79000, effectivePrice: 79000 },
  },
].map(({ variant, ...product }) => ({
  ...product, kind: 'Joki', fulfillmentMethod: 'MANUAL', isAvailable: true,
  variants: [
    { id: `${variant.id}-sold-out`, name: 'Paket habis', price: 10000, isAvailable: false },
    { ...variant, isAvailable: true },
  ],
}))

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
try {
  for (const [index, viewport] of [{ width: 1440, height: 900 }, { width: 390, height: 844 }].entries()) {
    const context = await browser.newContext({ viewport })
    await context.addInitScript(() => localStorage.setItem('zetruv-navbar-language', 'id'))
    const page = await context.newPage()
    const product = products[index]
    const variant = product.variants[1]
    const amount = `Rp${new Intl.NumberFormat('id-ID').format(variant.effectivePrice)}`
    let failDetail = true
    let cart = { items: [], revision: 'rev-1' }
    let cartWrites = 0
    let orderRequests = 0
    const errors = []
    page.on('pageerror', error => errors.push(error.message))

    await context.addInitScript((session) => {
      sessionStorage.setItem('zetruv-customer-session-v1', JSON.stringify({ version: 1, ...session }))
    }, session)

    await context.route('**/api/v1/**', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname.replace('/api/v1', '')
      const headers = {
        'Access-Control-Allow-Origin': site,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'authorization, content-type, idempotency-key',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      }
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      const json = (payload, status = 200) => route.fulfill({ status, headers, json: payload })
      if (path === '/auth/session') return json(session)
      if (path === '/catalog/categories') return json([])
      if (path === '/catalog/products') return json({ items: url.searchParams.get('kind') === 'Joki' ? products : [] })
      if (path === `/catalog/products/${product.slug}`) {
        if (failDetail) { failDetail = false; return json({}, 503) }
        return json(product)
      }
      if (path === '/catalog/products/joki-unavailable') return json({ ...product, name: 'Joki unavailable', variants: [] })
      if (path === '/catalog/products/wrong-kind') return json({ ...product, kind: 'TopUpGame' })
      if (path === '/me/cart' && request.method() === 'GET') return json(cart)
      if (path === '/me/cart' && request.method() === 'PUT') {
        cartWrites++
        assert.deepEqual(request.postDataJSON().items, [{ productVariantId: variant.id, quantity: 1, gameAccountValidationId: null }])
        cart = {
          revision: 'rev-2',
          items: [{
            id: 'qa-cart-line', productId: product.id, productSlug: product.slug, productName: product.name,
            kind: product.kind, fulfillmentMethod: product.fulfillmentMethod, gameName: product.game.name,
            productVariantId: variant.id, variantName: variant.name, unitPrice: variant.effectivePrice,
            regularPrice: variant.price, quantity: 1, isAvailable: true,
          }],
        }
        return json(cart)
      }
      if (path === '/checkout/payment-options') return json({
        isSandbox: true, canAcceptLivePayments: true, availableMethods: [{ code: 'QRIS', paymentFee: 0 }],
      })
      if (path === '/checkout/orders' && request.method() === 'POST') {
        orderRequests++
        assert.deepEqual(request.postDataJSON().items, [{ productVariantId: variant.id, quantity: 1, expectedUnitPrice: variant.effectivePrice }])
        return json({ message: 'Synthetic QA order request' }, 400)
      }
      return json({}, 404)
    })

    await page.goto(`${site}/search?kind=Joki`)
    await page.getByRole('link', { name: `Lihat ${product.name}` }).click()
    await page.getByRole('heading', { name: 'Produk Belum Bisa Dimuat' }).waitFor()
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await page.getByRole('heading', { name: product.name }).waitFor()
    const packageButton = page.getByRole('button', { name: variant.name, exact: false })
    assert.equal(await packageButton.getAttribute('aria-pressed'), 'true')
    assert.equal(await page.getByRole('button', { name: /Paket habis/ }).isDisabled(), true)
    await page.locator('.special-summary-total').getByText(amount).waitFor()
    await page.getByRole('button', { name: 'Tambah ke Keranjang' }).click()
    await page.getByText('Produk ditambahkan ke keranjang.').waitFor()
    await page.getByRole('button', { name: 'Tambah dan Lihat Keranjang' }).click()
    await page.getByRole('heading', { name: product.name }).waitFor()
    assert.equal(cartWrites, 1, 'opening the cart again should keep one copy of the package')
    await page.getByRole('button', { name: 'Lanjut ke Checkout' }).click()
    await page.getByRole('heading', { name: 'Checkout Digital' }).waitFor()
    const checkoutPrice = page.getByRole('article', { name: `${product.name} ${variant.name}` }).locator('.checkout-product__price')
    assert.ok((await checkoutPrice.innerText()).includes(amount))
    await page.locator('#checkout-phone').fill('081234567890')
    await page.getByRole('button', { name: /QRIS/ }).first().click()
    await page.getByRole('button', { name: 'Bayar Sekarang' }).click()
    await page.getByRole('alert').getByText('Pembayaran belum bisa dimulai. Silakan coba lagi.').waitFor()
    assert.equal(orderRequests, 1)

    await page.goto(`${site}/product/joki/joki-unavailable`)
    await page.getByText('Belum ada paket yang tersedia untuk dipilih.').waitFor()
    assert.equal(await page.getByRole('button', { name: /Tambah.*Keranjang/ }).count(), 0)
    for (const slug of ['wrong-kind', 'joki-missing']) {
      await page.goto(`${site}/product/joki/${slug}`)
      await page.getByRole('heading', { name: 'Produk Tidak Ditemukan' }).waitFor()
      assert.equal(await page.getByRole('link', { name: 'Kembali ke Joki Game' }).getAttribute('href'), '/search?kind=Joki')
    }
    assert.deepEqual(errors, [])
    console.log(`PASS ${viewport.width}px: ${product.name}, retry, catalog pricing, cart, checkout and unavailable states`)
    await context.close()
  }
} finally {
  await browser.close()
}
