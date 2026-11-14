import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.ZETRUV_TEST_URL || 'http://127.0.0.1:4178'
const local = new URL(base).hostname === '127.0.0.1'
const browser = await chromium.launch({ executablePath: process.env.ZETRUV_CHROMIUM, args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', err => errors.push(err.message))
const cmsBanner = { id: 'hero1', title: 'Judul Banner CMS', subtitle: 'Teks dari CMS', primaryCtaLabel: 'Tombol CMS', primaryCtaUrl: '/search' }
const cmsArticle = { id: 'article1', slug: 'cms-article', title: 'Judul Artikel CMS', excerpt: 'Ringkasan dari CMS', category: { name: 'Kategori CMS' }, readTimeMinutes: 3 }
let cms = true
if (local) await context.route('**/api/v1/**', async route => {
 const path = new URL(route.request().url()).pathname.replace('/api/v1','')
 let json = []
 if (path === '/homepage') json = cms ? { heroes:[cmsBanner], latestArticles:[cmsArticle], serviceCategories:[{id:'cat1', name:'Kategori Produk CMS', kind:'TopUpGame'}] } : {}
 if (path === '/articles') json = { items:[cmsArticle], totalPages:1 }
 if (path === '/catalog/categories') json = [{ id:'category1', kind:'TopUpGame', name:'Kategori Katalog CMS' }]
 if (path === '/catalog/products') json = { items:[], totalPages:1 }
 if (path === '/auth/session') return route.fulfill({ status: 401, json: {} })
 if (path === '/orders/lookup') json = {orderNumber:'ZTR-TEST-123',status:'Completed',paymentStatus:'Paid',items:[{productName:'Nama Produk CMS', fulfillmentStatus:'Processing', lineTotal:10000, quantity:1}],grandTotal:10000}
 await route.fulfill({json})
})
const locales = {
 en: ['English EN','Popular Games','Browse Categories','Articles & Guides','Digital Cart','Digital Checkout','No Payment Session','Check a Guest Order','Report an Issue','Forgot Password?','Explore Zetruv products','Paid','Merchandise Cart','Log In to Continue','My Orders','Log In to View Orders'],
 id: ['Bahasa Indonesia ID','Game Populer','Jelajahi Kategori','Artikel & Panduan','Keranjang Digital','Checkout Digital','Tidak Ada Sesi Pembayaran','Cek Pesanan Tamu','Laporkan Kendala','Lupa Kata Sandi?','Jelajahi produk Zetruv','Dibayar','Keranjang Merchandise','Masuk untuk Melanjutkan Checkout','Pesanan Saya','Masuk untuk Melihat Pesanan'],
 ms: ['Bahasa Melayu MY','Permainan Popular','Terokai Kategori','Artikel & Panduan','Troli Digital','Pembayaran Digital','Tiada Sesi Pembayaran','Semak Pesanan Tetamu','Laporkan Masalah','Lupa Kata Laluan?','Terokai produk Zetruv','Dibayar','Troli Barangan','Log Masuk untuk Meneruskan','Pesanan Saya','Log Masuk untuk Melihat Pesanan'],
}
const waitHeading = (name, scope = page) => scope.getByRole('heading', {name, exact:true}).first().waitFor({timeout:12000})
for (const [language, a] of Object.entries(locales)) {
 await page.goto(base, {waitUntil:'domcontentloaded'})
 await page.locator('.nav-language-trigger').click()
 await page.getByRole('menuitemradio', {name:a[0]}).click()
 assert.equal(await page.locator('html').getAttribute('lang'), language)
 await waitHeading(a[1])
 if (local) {
  await waitHeading(cmsBanner.title)
  await page.getByRole('link',{name:cmsBanner.primaryCtaLabel,exact:true}).waitFor()
  await page.getByText('Kategori Produk CMS',{exact:true}).waitFor()
  await waitHeading(cmsArticle.title)
  await page.getByText('Kategori CMS',{exact:true}).waitFor()
 }
 await page.locator('.contact-fab').click()
 await waitHeading(a[8], page.getByRole('dialog'))
 await page.locator('.chat-panel__back').click()
 await page.locator('.auth-actions button').first().click()
 await page.getByRole('dialog').getByRole('button',{name:a[9],exact:true}).click()
 await waitHeading(a[9], page.getByRole('dialog'))
 for (const [path, heading] of [['/search',a[2]],['/articles',a[3]],['/cart',a[4]],['/checkout',a[5]],['/payment',a[6]],['/order-status',a[14]],['/order-status?guest=1',a[7]],['/cart?flow=physical',a[12]],['/cart?flow=account',a[4]],['/checkout?flow=account',a[13]]]) {
  await page.goto(base + path,{waitUntil:'domcontentloaded'})
  await waitHeading(heading)
  assert.equal(await page.locator('html').getAttribute('lang'),language,path)
  if (local && path === '/articles') await waitHeading(cmsArticle.title)
  if (local && path === '/search') await page.getByText('Kategori Katalog CMS',{exact:true}).first().waitFor()
  if (local && path === '/order-status') {
   await waitHeading(a[15])
   assert.equal(await page.locator('#sos-order-number').count(),0)
  }
  if (local && path === '/order-status?guest=1') {
   await page.locator('#sos-order-number').fill('ZTR-TEST-123')
   await page.locator('#sos-contact').fill('qa@example.com')
   await page.locator('.sos-lookup-submit').click()
   await page.getByText(a[11],{exact:true}).waitFor()
   await page.getByText('Nama Produk CMS',{exact:true}).waitFor()
  }
 }
 if (local) {
  cms=false
  await page.goto(base,{waitUntil:'domcontentloaded'})
  await waitHeading(a[10])
  cms=true
 }
 console.log(language, 'desktop switch, persistence, storefront routes and forms passed')
}
await page.setViewportSize({width:390,height:844})
await page.goto(base,{waitUntil:'domcontentloaded'})
await page.locator('.navbar__hamburger').click()
await page.getByRole('button',{name:/Bahasa Indonesia/}).click()
await waitHeading(locales.id[1])
assert.equal(await page.locator('html').getAttribute('lang'),'id')
console.log('mobile language switch passed')
assert.deepEqual(errors, [])
await browser.close()
