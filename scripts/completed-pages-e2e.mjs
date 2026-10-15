// DEV-only, read-only browser acceptance for 11 Notion-Complete pages.
// Runs against the deployed VPS storefront, never against real customer production.
// Server-side writes are blocked; auth registration and checkout are not submitted.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'

const base = (process.env.ZETRUV_E2E_BASE_URL || 'https://dev.zetruv.com').replace(/\/$/, '')
if (base !== 'https://dev.zetruv.com') {
  throw Error('Safety gate: this acceptance suite runs against https://dev.zetruv.com only.')
}
const out = 'e2e-results'
mkdirSync(out, { recursive: true })
const cases = [
  { id: 'homepage', path: '/', selector: 'header.navbar', label: 'Homepage' },
  { id: 'search', path: '/search?q=mobile', selector: 'main', label: 'Hasil Pencarian' },
  { id: 'physical-product', path: '/merchandise/zetruv-gaming-jersey', selector: 'h1', label: 'Detail Produk Fisik' },
  { id: 'favorites', path: '/account/favorites', selector: 'h1', label: 'Favorit / Wishlist' },
  { id: 'order-success', path: '/order-status?view=via-id', selector: 'h1', label: 'Pesanan Berhasil (preview state)' },
  { id: 'payment-status', path: '/payment?flow=physical&state=pending', selector: 'main', label: 'Status Pembayaran (preview state)' },
  { id: 'orders', path: '/account/orders', selector: 'h1', label: 'Riwayat Pesanan' },
  { id: 'physical-order-detail', path: '/account/orders/ZTR-260817-0871?state=transit', selector: 'main', label: 'Detail Pesanan Fisik (preview fixture)' },
  { id: 'addresses', path: '/account/addresses', selector: 'h1', label: 'Alamat Saya' },
  { id: 'articles', path: '/articles', selector: 'h1', label: 'Daftar Artikel' },
]
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const results = []
let failed = false
const record = (device, label, ok, detail = {}) => {
  const item = { device, label, ok, ...detail }
  results.push(item)
  console.log((ok ? 'PASS' : 'FAIL') + ' [' + device + '] ' + label + (detail.error ? ': ' + detail.error : ''))
  if (!ok) failed = true
}

try {
  const health = await fetch('https://api-dev.zetruv.com/health', {
    signal: AbortSignal.timeout(20000),
  })
  assert.equal(health.status, 200, 'backend /health returned non-200')
  record('vps', 'API DEV /health', true, { status: health.status })
} catch (error) {
  record('vps', 'API DEV /health', false, { error: String(error.message || error) })
}
try {
  for (const [device, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobile', { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
      viewport, deviceScaleFactor: 1, reducedMotion: 'reduce',
    })
    // This test is inspection only. Protect server-side orders, registration,
    // profile/address mutation, and payment gateway from accidental writes.
    await context.route('**/api/v1/**', async (route) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        return route.continue()
      }
      return route.abort('blockedbyclient')
    })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    const jsErrors = []
    page.on('pageerror', (error) => jsErrors.push(String(error.message).slice(0, 240)))
    const open = async (route) => {
      jsErrors.length = 0
      const res = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!res || res.status() >= 400) throw Error('HTTP ' + (res?.status() ?? 'no response'))
      await page.waitForTimeout(650)
      if (jsErrors.length) throw Error('JavaScript: ' + jsErrors.join('; '))
      return res
    }
    // Verified public-page reachability, including SPA deep links on VPS/Nginx.
    for (const scenario of cases) {
      try {
        await open(scenario.path)
        await page.locator(scenario.selector).first().waitFor({ state: 'visible' })
        const heading = (await page.locator('h1').first().textContent().catch(() => ''))?.trim() || ''
        const metrics = await page.evaluate(() => ({
          contentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }))
        await page.screenshot({
          path: out + '/' + device + '-' + scenario.id + '.png',
          fullPage: true, animations: 'disabled',
        })
        record(device, scenario.label, true, {
          route: scenario.path, heading,
          overflowPx: Math.max(0, metrics.contentWidth - metrics.viewportWidth),
          scope: 'render/smoke only — backend integration not implied',
        })
      } catch (error) {
        record(device, scenario.label, false, { route: scenario.path, error: String(error.message || error) })
        await page.screenshot({ path: out + '/' + device + '-' + scenario.id + '-failed.png' }).catch(() => {})
      }
    }
    // Login / Registration: exercise the actual modal without authenticating.
    try {
      await open('/')
      await page.getByRole('button', { name: 'Login', exact: true }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Login' })
      await dialog.waitFor({ state: 'visible' })
      await dialog.getByRole('tab', { name: 'Register' }).click()
      await page.getByRole('dialog', { name: 'Register' }).waitFor({ state: 'visible' })
      assert.equal(await page.getByRole('dialog', { name: 'Register' }).locator('input[name="email"]').count(), 1)
      await page.keyboard.press('Escape')
      record(device, 'Login & Registrasi — UI', true, { scope: 'modal only; real login needs seeded test account' })
    } catch (error) {
      record(device, 'Login & Registrasi — UI', false, { error: String(error.message || error) })
    }
    // Wishlist: local-only create -> display -> remove. Never writes backend.
    try {
      await open('/merchandise/zetruv-gaming-jersey')
      const add = page.getByRole('button', { name: 'Tambahkan ke Favorit' })
      await add.click()
      await open('/account/favorites')
      await page.getByText('Zetruv Gaming Jersey').first().waitFor({ state: 'visible' })
      await page.getByRole('button', { name: 'Hapus Favorit' }).first().click()
      await page.getByText('Belum ada produk favorit').waitFor({ state: 'visible' })
      record(device, 'Wishlist local roundtrip', true, { scope: 'localStorage; cross-device API not covered' })
    } catch (error) {
      record(device, 'Wishlist local roundtrip', false, { error: String(error.message || error) })
    }
    // Articles: navigate list -> detail (read-only).
    try {
      await open('/articles')
      await page.locator('a[href^="/articles/"]').first().click()
      await page.locator('h1').first().waitFor({ state: 'visible' })
      record(device, 'Artikel list → detail', true, { url: page.url(), scope: 'UI navigation; CMS API contract not covered' })
    } catch (error) {
      record(device, 'Artikel list → detail', false, { error: String(error.message || error) })
    }
    await context.close()
  }
} finally {
  await browser.close()
  const summary = {
    base, checkedAt: new Date().toISOString(),
    passed: results.filter(x => x.ok).length,
    failed: results.filter(x => !x.ok).length,
    note: 'Notion Complete != backend integrated. Read docs/e2e-completed-pages.md for known gaps.',
    results,
  }
  writeFileSync(out + '/summary.json', JSON.stringify(summary, null, 2))
  console.log('ZETRUV DEV E2E SUMMARY:', JSON.stringify({
    passed: summary.passed, failed: summary.failed, base: summary.base,
  }))
}
if (failed) process.exitCode = 1
