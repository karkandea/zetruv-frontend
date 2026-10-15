// Synthetic browser checks only: all order lookup/login HTTP responses intercepted.
// No real customer information, payment, or order mutation is used.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const site = 'http://127.0.0.1:4178'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
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
    await page.getByRole('heading', { name: 'Cek Pesanan' }).waitFor()
    assert.equal(await page.getByText('#ZTR-260906-1842').count(), 0, 'demo order must be absent')
    assert.equal(await page.getByText('PAID', { exact: true }).count(), 0, 'payment never pre-populated')
    assert.equal(requests.length, 0, 'no automatic lookup or PII request')
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
    await page.getByRole('heading', { name: 'Cek Pesanan' }).waitFor()
    assert.equal(await page.getByText('Z3truv!Ancient#2026').count(), 0)

    // Merchandise guest cart: selected size, visible success confirmation,
    // cart count, redirect to cart and sign-in requirement.
    await page.goto(site + '/merchandise/zetruv-gaming-jersey')
    await page.getByRole('heading', { name: 'Zetruv Gaming Jersey' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Pilih Ukuran Dulu' }).isDisabled(), true)
    await page.locator('.physical-size-options').getByRole('button', { name: 'L', exact: true }).click()
    await page.getByRole('button', { name: 'Tambah ke Keranjang' }).click()
    await page.getByRole('status').getByText(/berhasil dimasukkan ke keranjang/).waitFor()
    assert.equal(await page.locator('.nav-cart-count').first().innerText(), '1')
    await page.getByRole('button', { name: 'Lihat Keranjang' }).click()
    await page.waitForURL('**/cart?flow=physical')
    await page.getByText('Black · Size L').waitFor()
    await page.getByRole('button', { name: 'Masuk untuk Checkout' }).waitFor()
    assert.equal(await page.getByText('Checkout merchandise belum aktif').count(), 1)
    const physical = await page.evaluate(() => JSON.parse(sessionStorage.getItem('zetruv-physical-cart-v1') || 'null'))
    assert.equal(physical.size, 'L')
    assert.equal(physical.qty, 1)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert.ok(overflow <= 2, device + ' horizontal overflow: ' + overflow)

    await page.route('**/api/v1/auth/login', async route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'synthetic-test-jwt-value-with-more-than-30-characters',
        customer: { name: 'Synthetic Tester', email: 'synthetic@example.test' },
      }),
    }))
    await page.getByRole('button', { name: 'Masuk untuk Checkout' }).click()
    const login = page.getByRole('dialog', { name: 'Login' })
    await login.locator('input[name="email"]').fill('synthetic@example.test')
    await login.locator('input[name="password"]').fill('synthetic-only-not-a-credential')
    await login.getByRole('button', { name: 'Login', exact: true }).click()
    await page.waitForURL('**/checkout?flow=physical')
    await page.getByText('Belum bisa diproses').waitFor()
    assert.ok(await page.evaluate(() => Boolean(sessionStorage.getItem('zetruv-physical-cart-v1'))))

    // Narrow mobile navigation remains interactive, no sample order or fake invoice.
    await page.goto(site + '/order-status')
    if (device === 'mobile') {
      await page.getByRole('button', { name: 'Menu lainnya' }).click()
      await page.getByRole('menuitem', { name: 'Merchandise' }).waitFor()
    }
    const orderOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert.ok(orderOverflow <= 2, device + ' order page horizontal overflow: ' + orderOverflow)
    console.log('PASS:', device, 'secure lookup 404/503/success, cart feedback, guest login, viewport')
    await ctx.close()
  }
} finally {
  await browser.close()
}
