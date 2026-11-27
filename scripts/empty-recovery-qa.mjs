import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const browser=await chromium.launch({headless:true,executablePath:process.env.ZETRUV_CHROMIUM || undefined,args:['--no-sandbox']})
const base=process.env.ZETRUV_TEST_URL || 'http://127.0.0.1:4178'
try {
  for (const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:900}})
    let fail=true, count=0
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.route('**/api/v1/catalog/products?*',async route=>{
      count++
      await route.fulfill({status:fail?503:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(fail?{message:'QA unavailable'}:{items:[],totalItems:0,totalPages:0})})
    })
    await page.route('**/api/v1/catalog/games',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'[]'}))
    for (const path of ['/search?kind=GameVoucher','/merchandise','/game-accounts/dota-2']) {
      fail=true
      await page.goto(base+path,{waitUntil:'domcontentloaded'})
      const error=page.locator('.storefront-state--error')
      await error.waitFor({timeout:15000})
      const before=count
      fail=false
      await error.locator('button').click()
      await page.locator('.storefront-state--empty').waitFor({timeout:15000})
      assert.ok(count>before,'Retry calls API again')
      assert.equal(await page.locator('.ga-live-card').count(),0,'No demo accounts on empty live catalog')
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
    }
    await page.goto(base+'/game-accounts',{waitUntil:'domcontentloaded'})
    await page.locator('.storefront-state--empty').waitFor({timeout:15000})
    assert.equal(await page.locator('.account-browse-grid .search-game-card').count(),0)
    assert.deepEqual(errors,[])
    console.log('PASS',width,'catalog failure, retry to empty, no dummy accounts, mobile/desktop overflow')
    await page.close()
  }
} finally {await browser.close()}
