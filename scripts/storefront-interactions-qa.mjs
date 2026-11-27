import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] })
const base = process.env.ZETRUV_TEST_URL || 'http://127.0.0.1:4178'
try {
  const page = await browser.newPage({ viewport:{ width:1440,height:900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem('zetruv-cookie-choice-v1','decline-all'))
  await page.goto(base,{waitUntil:'domcontentloaded'})
  const trigger = page.locator('.navlinks__product')
  await trigger.click()
  const menu = page.locator('#navbar-product-dropdown')
  await menu.waitFor({state:'visible'})
  const rows = menu.locator('a')
  assert.ok(await rows.count() >= 7)
  for (const row of await rows.all()) {
    const size = await row.boundingBox()
    assert.ok(size && size.height >= 44, 'Product menu target >=44px')
  }
  const gap = await rows.nth(1).evaluate(el => parseFloat(getComputedStyle(el).marginTop))
  assert.ok(gap <= 6, 'Product menu spacing')
  await rows.nth(1).hover()
  await rows.nth(1).focus()
  await page.keyboard.press('Escape')
  assert.equal(await trigger.getAttribute('aria-expanded'),'false')
  assert.ok(await trigger.evaluate(el=>document.activeElement===el),'Escape restores focus')
  assert.equal(await page.locator('.navlinks > a[href="/"]').getAttribute('aria-current'),'page')
  await trigger.click()
  await page.locator('.nav-cart-trigger').click()
  assert.equal(await trigger.getAttribute('aria-expanded'),'false')
  assert.equal(await page.locator('.nav-cart-trigger').getAttribute('aria-expanded'),'true')
  await page.locator('.nav-language-trigger').click()
  assert.equal(await page.locator('.nav-cart-trigger').getAttribute('aria-expanded'),'false')
  assert.equal(await page.locator('.nav-language-option[aria-checked="true"] .nav-language-option__check').count(),1)
  await page.goto(base+'/search',{waitUntil:'domcontentloaded'})
  assert.equal(await page.locator('.navlinks__product').getAttribute('aria-current'),'page')
  await page.locator('.navbar-searchbox input').focus()
  await page.locator('.navlinks__product').click()
  assert.equal(await page.locator('.navbar-searchbox input').getAttribute('aria-expanded'),'false')
  assert.deepEqual(errors,[])
  console.log('PASS: product row hit area, hover spacing, focus restoration, popup exclusivity, active route, language check and search dismissal')
} finally { await browser.close() }
