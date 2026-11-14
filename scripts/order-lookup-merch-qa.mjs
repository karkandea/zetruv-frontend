// Synthetic browser checks only: all order lookup/login HTTP responses intercepted.
// No real customer information, payment, or order mutation is used.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const site = 'http://127.0.0.1:4178'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const voucherItemId = 'f570c8c1-6c8e-4fb1-8fa4-e2c0345a9aab'
const accessToken = 'synthetic-test-jwt-value-with-more-than-30-characters'
const customer = { name: 'Synthetic Tester', email: 'synthetic@example.test' }
const fakeOrder = {
  orderId: 'f570c8c1-6c8e-4fb1-8fa4-e2c0345a9aaa', orderNumber: 'ZTR-QA-VERIFY-2026',
  status: 1, paymentStatus: 0, hasFulfillmentIssue: false,
  subtotal: 25000, discountAmount: 0, shippingAmount: 0,
  grandTotal: 25000, currency: 'IDR', createdAt: '2026-10-15T13:00:00Z',
  items: [{ productName: 'Synthetic QA Voucher', variantName: '10 Credits',
    productSlug: 'qa-voucher', fulfillmentStatus: 0, lineTotal: 25000, quantity: 1 }],
  orderAccessToken: 'synthetic-sensitive-token-must-not-render',
}

try {
  for (const [device, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const ctx = await browser.newContext({ viewport })
    const page = await ctx.newPage()
    let requests = []
    let account = null
    let history = false
    let listFailure = false
    let revealRequests = 0

    await page.route('**/api/v1/auth/session', async route => {
      if (route.request().method() === 'DELETE') {
        account = null
        return route.fulfill({ status: 204 })
      }
      return account ? route.fulfill({ json: account }) : route.fulfill({ status: 401, json: {} })
    })
    await page.route('**/api/v1/me/cart', route => route.fulfill({ json: { items: [], revision: 'empty' } }))
    await page.route('**/api/v1/me/orders?*', route => {
      assert.equal(route.request().headers().authorization, 'Bearer ' + accessToken)
      if (listFailure) return route.fulfill({ status: 503, json: {} })
      const group = new URL(route.request().url()).searchParams.get('group')
      const items = (group === 'history') === history ? [{
        id: fakeOrder.orderId, orderNumber: fakeOrder.orderNumber,
        createdAt: fakeOrder.createdAt, grandTotal: fakeOrder.grandTotal, currency: 'IDR',
        status: history ? 'Completed' : 'Pending', paymentState: history ? 'Paid' : 'Expired',
        firstItem: fakeOrder.items[0], itemCount: 1,
      }] : []
      return route.fulfill({ json: { items, hasMore: false } })
    })
    await page.route(`**/api/v1/me/orders/${fakeOrder.orderId}`, route => {
      assert.equal(route.request().headers().authorization, 'Bearer ' + accessToken)
      const { orderAccessToken, ...detail } = fakeOrder
      return route.fulfill({ json: { ...detail, id: fakeOrder.orderId, status: 'Completed', paymentState: 'Paid',
        items: [{ ...detail.items[0], id: voucherItemId, kind: 'GameVoucher', fulfillmentStatus: 'Completed' }],
      } })
    })
    await page.route(`**/api/v1/me/orders/${fakeOrder.orderId}/items/${voucherItemId}/voucher-codes`, route => {
      assert.equal(route.request().headers().authorization, 'Bearer ' + accessToken)
      revealRequests++
      return route.fulfill({ json: { codes: ['SYNTHETIC-VOUCHER-QA'] } })
    })

    await page.route('**/api/v1/orders/lookup', async route => {
      const payload = route.request().postDataJSON()
      requests.push(payload)
      if (payload.orderNumber === 'NO-MATCH') {
        return route.fulfill({ status: 404, contentType: 'application/json',
          body: JSON.stringify({ message: 'Order was not found for the supplied details.' }) })
      }
      if (payload.orderNumber === 'BACKEND-ERROR') {
        return route.fulfill({ status: 503, contentType: 'application/json',
          body: JSON.stringify({ message: 'temporary error' }) })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeOrder) })
    })

    await page.goto(site + '/order-status?view=invoice', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Masuk untuk melihat pesanan' }).waitFor()
    assert.equal(await page.locator('#sos-order-number').count(), 0, 'guest lookup is a separate flow')
    assert.equal(await page.getByText('#ZTR-260906-1842').count(), 0, 'demo order must be absent')
    assert.equal(await page.getByText('PAID', { exact: true }).count(), 0, 'payment never pre-populated')
    assert.equal(requests.length, 0, 'no automatic lookup or PII request')
    await page.getByRole('link', { name: /Cek pesanan sebagai tamu/ }).click()
    await page.getByRole('heading', { name: 'Cek Pesanan Tamu' }).waitFor()
    await page.locator('#sos-order-number').fill('NO-MATCH')
    await page.locator('#sos-contact').fill('synthetic@example.test')
    await page.getByRole('button', { name: 'Cek Status Pesanan' }).click()
    await page.getByRole('alert').getByText(/Pesanan tidak ditemukan/).waitFor()
    assert.equal(await page.getByText('Synthetic QA Voucher').count(), 0)

    await page.locator('#sos-order-number').fill('BACKEND-ERROR')
    await page.getByRole('button', { name: 'Cek Status Pesanan' }).click()
    await page.getByRole('alert').getByText(/Belum bisa mengambil status pesanan/).waitFor()
    assert.equal(await page.getByText('Synthetic QA Voucher').count(), 0)

    await page.locator('#sos-order-number').fill('ZTR-QA-VERIFY-2026')
    await page.getByRole('button', { name: 'Cek Status Pesanan' }).click()
    await page.getByRole('heading', { name: 'ZTR-QA-VERIFY-2026' }).waitFor()
    await page.getByText('Synthetic QA Voucher').waitFor()
    assert.equal(await page.getByText('synthetic-sensitive-token-must-not-render').count(), 0)
    assert.equal(requests.length, 3)
    assert.equal(requests[2].customerEmail, 'synthetic@example.test')
    assert.equal(requests[2].customerPhone, null)
    await page.getByRole('button', { name: /Cek pesanan lain/ }).click()
    assert.equal(await page.getByText('Synthetic QA Voucher').count(), 0)

    // A legacy query alias must not reveal seeded order details either.
    await page.goto(site + '/order-status?flow=account&view=completed')
    await page.getByRole('heading', { name: 'Masuk untuk melihat pesanan' }).waitFor()
    assert.equal(await page.getByText('Z3truv!Ancient#2026').count(), 0)

    // Merchandise catalog-backed draft cart: variants and price are provided
    // by a synthetic backend, never pre-seeded in frontend source.
    await page.route('**/api/v1/catalog/products/zetruv-gaming-jersey', async route => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({
        id: 'bb000000-0000-4000-8000-000000000001', kind: 'Merchandise',
        name: 'Zetruv Gaming Jersey', slug: 'zetruv-gaming-jersey',
        description: 'Synthetic catalog description', isAvailable: true,
        soldQuantity: 0, rating: null, reviewCount: 0,
        images: [], thumbnailUrl: null,
        variants: [
          { id: 'bb000000-0000-4000-8000-000000000002', name: 'S', effectivePrice: 249000, isAvailable: true, stockQuantity: 5 },
          { id: 'bb000000-0000-4000-8000-000000000003', name: 'L', effectivePrice: 269000, isAvailable: true, stockQuantity: 3 },
        ],
      }),
    }))
    await page.goto(site + '/merchandise/zetruv-gaming-jersey')
    await page.getByRole('heading', { name: 'Zetruv Gaming Jersey' }).waitFor()
    await page.locator('.physical-size-options').getByRole('button', { name: /L · Rp269.000/ }).click()
    await page.getByRole('button', { name: 'Simpan Draft Keranjang' }).click()
    await page.getByRole('status').getByText(/disimpan ke keranjang/).waitFor()
    assert.equal(await page.locator('.nav-cart-count').first().innerText(), '1')
    await page.getByRole('button', { name: 'Lihat Keranjang' }).click()
    await page.waitForURL('**/cart?flow=physical')
    await page.getByText('Varian L').waitFor()
    await page.getByRole('button', { name: 'Masuk untuk Checkout' }).waitFor()
    assert.equal(await page.getByText('Checkout merchandise belum aktif').count(), 1)
    const physical = await page.evaluate(() => JSON.parse(sessionStorage.getItem('zetruv-physical-cart-v1') || 'null'))
    assert.equal(physical.size, 'L')
    assert.equal(physical.price, 269000)
    assert.equal(physical.qty, 1)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert.ok(overflow <= 2, device + ' horizontal overflow: ' + overflow)

    await page.route('**/api/v1/auth/login', route => {
      account = { accessToken, customer, expiresAt: '2099-01-01T00:00:00Z' }
      return route.fulfill({ json: account })
    })
    await page.getByRole('button', { name: 'Masuk untuk Checkout' }).click()
    const login = page.getByRole('dialog', { name: 'Login' })
    await login.locator('input[name="email"]').fill('synthetic@example.test')
    await login.locator('input[name="password"]').fill('synthetic-only-not-a-credential')
    await login.getByRole('button', { name: 'Login', exact: true }).click()
    await page.waitForURL('**/checkout?flow=physical')
    await page.getByText('Belum bisa diproses').waitFor()
    assert.ok(await page.evaluate(() => Boolean(sessionStorage.getItem('zetruv-physical-cart-v1'))))

    // Authenticated history restores across page loads and never falls back to guest tracking.
    await page.goto(site + '/order-status')
    await page.getByRole('heading', { name: fakeOrder.orderNumber }).waitFor()
    await page.getByText('Sesi pembayaran kedaluwarsa', { exact: true }).waitFor()
    assert.equal(await page.locator('#sos-order-number').count(), 0)
    const orderOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert.ok(orderOverflow <= 2, device + ' order page horizontal overflow: ' + orderOverflow)
    listFailure = true
    await page.getByRole('button', { name: 'Perbarui', exact: true }).click()
    await page.getByRole('heading', { name: 'Pesanan belum bisa dimuat' }).waitFor()
    assert.equal(await page.getByRole('heading', { name: fakeOrder.orderNumber }).count(), 0)
    listFailure = false
    await page.getByRole('button', { name: 'Coba Lagi' }).click()
    await page.getByRole('heading', { name: fakeOrder.orderNumber }).waitFor()
    history = true
    await page.getByRole('button', { name: 'Perbarui', exact: true }).click()
    await page.getByRole('heading', { name: 'Belum ada pesanan aktif' }).waitFor()
    await page.getByRole('link', { name: 'Riwayat', exact: true }).click()
    await page.getByRole('link', { name: 'Lihat detail ' + fakeOrder.orderNumber }).click()
    await page.getByRole('heading', { name: 'Detail Pesanan' }).waitFor()
    await page.getByText('Dibayar', { exact: true }).waitFor()
    assert.equal(revealRequests, 0)
    await page.getByRole('button', { name: 'Tampilkan Kode Voucher' }).click()
    await page.getByText('SYNTHETIC-VOUCHER-QA').waitFor()
    assert.equal(revealRequests, 1)
    assert.equal(requests.length, 3, 'account flow must not use guest lookup')
    await page.route(`**/api/v1/me/orders/${fakeOrder.orderId}`, route => route.fulfill({ status: 404, json: {} }))
    await page.getByRole('button', { name: 'Perbarui status' }).click()
    await page.getByRole('heading', { name: 'Pesanan tidak ditemukan' }).waitFor()
    assert.equal(await page.getByText('SYNTHETIC-VOUCHER-QA').count(), 0)
    console.log('PASS:', device, 'guest lookup, authenticated active/history and detail, voucher reveal, retry, unavailable order, merchandise regression')
    await ctx.close()
  }
} finally {
  await browser.close()
}
