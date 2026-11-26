import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const site = 'http://127.0.0.1:4178'
const accessToken = 'qa-item-mock-session-with-no-real-access'
const customer = { name: 'QA Item', email: 'item@example.test' }
const session = { accessToken, customer, expiresAt: '2099-01-01T00:00:00Z' }
// All APIs are intercepted; no real orders, payments or messages.
const products = [
  {
    id: 'e01e399d-cb0f-31ef-6bd9-2041c003644b', slug: 'demo-game-item-grandmaster-sprinkler',
    name: 'QA Grandmaster Sprinkler', game: { name: 'Roblox' },
    variant: { id: '95f1dac9-9802-95d7-1851-b1a973543511', name: '1 sprinkler', price: 3000, effectivePrice: 2000 },
  },
  {
    id: 'df709768-8d70-0779-fe86-fb99bc1b8b53', slug: 'demo-game-item-dragonfly',
    name: 'QA Dragonfly', game: { name: 'Roblox' },
    variant: { id: '9a1b29e4-def2-48ef-d35a-dc520e0c81f5', name: '1 pet', price: 42000, effectivePrice: 42000 },
  },
].map(({ variant, ...product }) => ({
  ...product, kind: 'GameItem', fulfillmentMethod: 'MANUAL', isAvailable: true,
  inputFields: [{ key: 'playerName', label: 'QA Player Name', scope: 'OrderDelivery', type: 'Text', isRequired: true, isSensitive: false, maxLength: 60 }],
  minPrice: variant.effectivePrice, maxPrice: variant.effectivePrice,
  variants: [
    { id: `${variant.id}-sold-out`, name: 'Paket habis', price: 10000, isAvailable: false, stockQuantity: 0 },
    { ...variant, isAvailable: true, stockQuantity: 10 },
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
    let paymentRequests = 0
    let paid = false
    const orderId = '8d5987b5-1f7a-4b31-86b0-af89ad51407c'
    const orderNumber = 'ZTR-QA-ITEM-2026'
    const grant = 'qa-item-order-access-token'
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
        'Access-Control-Allow-Headers': 'authorization, content-type, idempotency-key, x-order-access-token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      }
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      const json = (payload, status = 200) => route.fulfill({ status, headers, json: payload })
      if (path === '/auth/session') return json(session)
      if (path === '/catalog/categories') return json([])
      if (path === '/catalog/products') return json({ items: url.searchParams.get('kind') === 'GameItem' ? products : [] })
      if (path === `/catalog/products/${product.slug}`) {
        if (failDetail) { failDetail = false; return json({}, 503) }
        return json(product)
      }
      if (path === '/catalog/products/item-unavailable') return json({ ...product, name: 'Item unavailable', isAvailable: false, variants: [{ ...variant, isAvailable: false, stockQuantity: 0 }] })
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
        isSandbox: true, canAcceptLivePayments: true, availableMethods: [{ code: 'MIDTRANS_SNAP', paymentFee: 0 }],
      })
      if (path === '/checkout/orders' && request.method() === 'POST') {
        orderRequests++
        assert.deepEqual(request.postDataJSON().items, [{ productVariantId: variant.id, quantity: 1, expectedUnitPrice: variant.effectivePrice, deliveryDetails: { playerName: 'synthetic-qa-player' } }])
        return json({ id: orderId, orderNumber, status: 0, paymentStatus: 0, subtotal: variant.effectivePrice, discountAmount: 0, shippingAmount: 0, grandTotal: variant.effectivePrice, currency: 'IDR', orderAccessToken: grant, orderAccessTokenExpiresAt: '2099-01-01T00:00:00Z', items: [{ productName: product.name, variantName: variant.name, quantity: 1, lineTotal: variant.effectivePrice }] })
      }
      if (path === '/checkout/orders/' + orderId + '/payment') {
        assert.equal(request.headers()['x-order-access-token'], grant)
        if (request.method() === 'POST') { paymentRequests++; assert.equal(url.searchParams.get('methodCode'), 'MIDTRANS_SNAP') }
        return json({ orderId, state: paid ? 'Paid' : 'Pending', canRetry: false, hasActivePaymentSession: !paid, expiresAt: '2099-01-01T00:00:00Z', paymentUrl: paid ? null : 'https://app.sandbox.midtrans.com/snap/v2/vtweb/SYNTHETIC-ITEM-QA', gameItemSupportPhone: '+12025550123' })
      }
      return json({}, 404)
    })

    await page.goto(`${site}/search?kind=GameItem`)
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
    await page.getByRole('button', { name: /Midtrans \(Sandbox\)/ }).first().click()
    const pay = page.getByRole('button', { name: 'Bayar Sekarang' })
    assert.equal(await pay.isDisabled(), true, 'required delivery field must gate checkout')
    await page.getByLabel(/QA Player Name/).fill('synthetic-qa-player')
    await pay.click()
    await page.waitForURL('**/payment')
    await page.getByRole('heading', { name: 'Menunggu Pembayaran' }).waitFor()
    assert.equal(orderRequests, 1)
    assert.equal(paymentRequests, 1)
    assert.equal(await page.locator('.game-item-admin-contact').count(), 0)
    await page.reload()
    await page.getByRole('heading', { name: 'Menunggu Pembayaran' }).waitFor()
    assert.equal(paymentRequests, 1)
    paid = true
    await page.getByRole('button', { name: 'Periksa Status' }).click()
    await page.getByRole('heading', { name: 'Pembayaran Terkonfirmasi' }).waitFor()
    const contact = page.locator('.game-item-admin-contact a')
    await contact.waitFor()
    assert.match(await contact.getAttribute('href'), /^https:\/\/wa\.me\/12025550123\?text=/)
    assert.ok(!(await page.evaluate(() => JSON.stringify({ session: {...sessionStorage}, local: {...localStorage} }))).includes('synthetic-qa-player'))

    await page.goto(`${site}/product/item/item-unavailable`)
    await page.getByText('Item ini belum bisa dibeli.').waitFor()
    assert.equal(await page.getByRole('button', { name: /Tambah.*Keranjang/ }).count(), 0)
    const soldOut = page.getByRole('button', { name: /Tidak tersedia/ })
    assert.equal(await soldOut.isDisabled(), true)
    assert.equal(await soldOut.getAttribute('aria-pressed'), 'false')
    for (const slug of ['wrong-kind', 'item-missing']) {
      await page.goto(`${site}/product/item/${slug}`)
      await page.getByRole('heading', { name: 'Produk Tidak Ditemukan' }).waitFor()
      assert.equal(await page.getByRole('link', { name: 'Kembali ke Katalog' }).getAttribute('href'), '/search?kind=GameItem')
    }
    assert.deepEqual(errors, [])
    console.log(`PASS ${viewport.width}px: ${product.name}, item catalog, retry, stock, cart, delivery schema, synthetic payment and paid-only contact`)
    await context.close()
  }
} finally {
  await browser.close()
}
