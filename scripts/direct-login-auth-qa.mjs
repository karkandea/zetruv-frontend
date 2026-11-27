import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const browser=await chromium.launch({headless:true,executablePath:process.env.ZETRUV_CHROMIUM||undefined,args:['--no-sandbox']})
const base=process.env.ZETRUV_TEST_URL||'http://127.0.0.1:4188'
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}})
  let signedIn=false, failLogin=true, mutations=0
  const session={accessToken:'synthetic-browser-qa-token-no-real-session-00000',expiresAt:new Date(Date.now()+3600000).toISOString(),customer:{id:'a0000000-0000-0000-0000-000000000001',name:'QA',email:'qa@example.test'}}
  const respond=(route,status,data)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':base,'access-control-allow-credentials':'true','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'GET,POST,OPTIONS'},body:JSON.stringify(data)})
  await page.route('**/api/v1/auth/session',route=>route.request().method()==='OPTIONS'?respond(route,200,{}):respond(route,signedIn?200:401,signedIn?session:{message:'not authenticated'}))
  await page.route('**/api/v1/auth/login',route=>{
   if(route.request().method()==='OPTIONS')return respond(route,200,{})
   if(failLogin)return respond(route,401,{message:'wrong password'})
   signedIn=true
   return respond(route,200,session)
  })
  await page.route('**/api/v1/me/cart**',route=>{if(!['GET','OPTIONS'].includes(route.request().method()))mutations++;return respond(route,200,{revision:1,items:[]})})
  await page.route('**/api/v1/checkout/orders**',route=>{mutations++;return respond(route,500,{message:'Test forbids order creation'})})
  await page.addInitScript(()=>localStorage.setItem('zetruv-cookie-choice-v1','decline-all'))
  await page.goto(base+'/product/efootball-mobile/login',{waitUntil:'domcontentloaded'})
  const buy=page.locator('.login-product-buy')
  await buy.waitFor()
  await page.waitForFunction(()=>!document.querySelector('.login-product-buy')?.disabled)
  await buy.click()
  const dialog=page.locator('.auth-modal')
  await dialog.waitFor()
  assert.ok(page.url().includes('/product/'),'Guest stays on PDP before login')
  assert.equal(await page.locator('.digital-checkout-page').count(),0)
  await page.keyboard.press('Escape')
  await dialog.waitFor({state:'detached'})
  assert.ok(page.url().includes('/product/'))
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('zetruv-direct-login-checkout-v1')),null)
  await buy.click()
  await dialog.waitFor()
  await dialog.locator('input[name=email]').fill('qa@example.test')
  await dialog.locator('input[name=password]').fill('synthetic-test-only')
  await dialog.locator('button[type=submit]').click()
  await dialog.locator('.auth-error').waitFor()
  assert.ok(page.url().includes('/product/'))
  failLogin=false
  await dialog.locator('button[type=submit]').click()
  await page.waitForURL('**/checkout?flow=direct-login')
  await page.locator('.checkout-product__identity').waitFor()
  assert.equal(await page.locator('.checkout-product__identity').count(),1)
  assert.ok((await page.locator('.checkout-product__identity').innerText()).includes('137 Coins'))
  assert.equal(await page.locator('.auth-modal').count(),0)
  await page.reload()
  await page.locator('.checkout-product__identity').waitFor()
  assert.equal(await page.locator('.checkout-product__identity').count(),1)
  await page.goto(base+'/product/call-of-duty-mobile/login')
  await page.waitForFunction(()=>{const b=document.querySelector('.login-product-buy');return b&&!b.disabled})
  await page.locator('.login-product-buy').click()
  await page.waitForURL('**/checkout?flow=direct-login')
  await page.locator('.checkout-product__identity').waitFor()
  assert.equal(await page.locator('.auth-modal').count(),0)
  assert.equal(mutations,0)
  console.log('PASS',width,'guest login first, cancel, invalid login, resume, refresh, signed-in direct, no order/cart mutation')
  await page.close()
 }
}finally{await browser.close()}
