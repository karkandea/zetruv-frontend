// Synthetic, read-only browser regression for PDP catalog pricing and cart validation.
// Never uses actual customer credentials, writes to DEV, or performs a checkout.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const site = 'http://127.0.0.1:4178'
const product = {
  id: 'sku-product-qa', slug: 'mobile-legends', name: 'Mobile Legends',
  kind: 'TopUpGame', fulfillmentMethod: 'AUTO_ID', isAvailable: true,
  game: { name: 'Mobile Legends', publisher: 'Moonton' },
  category: { name: 'Diamond' },
  variants: [{ id: 'sku-5-qa', name: '5 Diamond', price: 1500,
    effectivePrice: 1500, isAvailable: true, stockQuantity: 99 }],
  inputFields: [
    { scope: 'AccountValidation', key: 'uid', label: 'User ID', type: 'Number', isRequired: true, sortOrder: 0 },
    { scope: 'AccountValidation', key: 'zone', label: 'Zona', type: 'Number', isRequired: true, sortOrder: 1 },
  ],
}
const item = {
  productId: product.id, productSlug: product.slug, productName: product.name,
  gameName: product.name, productKind: product.kind,
  fulfillmentMethod: 'AUTO_ID', variantId: 'sku-5-qa',
  variantName: '5 Diamond', unitPrice: 1500, regularPrice: 1500,
  quantity: 1, maxQuantity: 99, accountFields: { userId: '12345', zone: '1001' },
  accountKey: '12345:1001',
}

function deferred() {
  let release
  const promise = new Promise((resolve) => { release = resolve })
  return { promise, release }
}

async function json(route, payload, status = 200) {
  await route.fulfill({
    status, contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(payload),
  })
}

try {
  for (const [device, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport })
    const gate = deferred()
    await context.route('**/api/v1/catalog/products/mobile-legends', async (route) => {
      await gate.promise
      await json(route, product)
    })
    const page = await context.newPage()
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto(`${site}/product/mobile-legends`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Memuat produk dan harga…' }).waitFor()
    assert.equal(await page.locator('.sku-grid').count(), 0, 'demo SKUs must not render before API')
    assert.equal(await page.locator('.pdp-sidebar-summary').count(), 0, 'no fake cart price')
    assert.equal(await page.getByText('Rp12.000').count(), 0, 'no placeholder price flash')
    gate.release()
    await page.getByRole('button', { name: /5 Diamond/ }).waitFor()
    await page.locator('.pdp-sidebar-item__price').getByText('Rp1.500').waitFor()
    assert.equal(await page.getByText('Rp12.000').count(), 0)

    // HTTP failure is a real error state, with a working user-initiated retry.
    let attempts = 0
    await context.route('**/api/v1/catalog/products/mobile-legends', (route) => {
      attempts++
      return attempts === 1
        ? json(route, { message: 'Synthetic catalog unavailable' }, 503)
        : json(route, product)
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Produk belum bisa dimuat' }).waitFor()
    assert.equal(await page.getByText('Rp12.000').count(), 0)
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await page.getByRole('button', { name: /5 Diamond/ }).waitFor()
    assert.equal(attempts, 2)

    await context.close()

    const cartContext = await browser.newContext({ viewport })
    await cartContext.addInitScript((draft) => {
      localStorage.setItem('zetruv-cart-v1', JSON.stringify([draft]))
    }, item)
    const cartGate = deferred()
    await cartContext.route('**/api/v1/catalog/products/mobile-legends', async (route) => {
      await cartGate.promise
      await json(route, product)
    })
    const cartPage = await cartContext.newPage()
    const cartErrors = []
    cartPage.on('pageerror', (error) => cartErrors.push(error.message))
    await cartPage.goto(`${site}/cart`, { waitUntil: 'domcontentloaded' })
    await cartPage.getByText('Memverifikasi aturan produk dan data akun…').waitFor()
    assert.equal(await cartPage.getByText('Data akun belum dapat diverifikasi.').count(), 0)
    assert.equal(await cartPage.locator('.digital-cart-item__warning').count(), 0)
    assert.equal(await cartPage.getByRole('button', { name: 'Masuk untuk Checkout' }).isDisabled(), true)
    cartGate.release()
    await cartPage.getByText('Memverifikasi aturan produk dan data akun…').waitFor({ state: 'hidden' })
    assert.equal(await cartPage.locator('.digital-cart-item__warning').count(), 0)
    assert.equal(await cartPage.getByRole('button', { name: 'Masuk untuk Checkout' }).isEnabled(), true)
    assert.deepEqual(pageErrors, [])
    assert.deepEqual(cartErrors, [])
    console.log('PASS:', device, 'PDP server price only, retry on 503, cart loading without false error')
    await cartContext.close()
  }
} finally {
  await browser.close()
}
