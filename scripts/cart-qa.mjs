// Browser E2E for guest -> backend login -> server cart -> refresh -> logout.
// ALL data and HTTP responses are synthetic, with network mutation intercepted.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
const output='visual-qa'
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const urls='http://127.0.0.1:4178'
const voucherId='d9339202-1d6b-4d09-b9e4-b589f1b8cda1'
const productId='96176e58-131e-4b48-84a9-47c57eb359d5'
const jwt='synthetic-customer-session-token-for-qa-no-real-credentials'
const guest={
  productId,productSlug:'qa-voucher',productName:'QA Test Voucher',
  productKind:'GameVoucher',fulfillmentMethod:'VOUCHER_CODE',
  variantId:voucherId,variantName:'Synthetic 10 Credits',unitPrice:1234,regularPrice:1500,
  quantity:1,maxQuantity:10,accountKey:'checkout-required',
}
const serverRows=[]
let mergeCalls=0
let sessionChecks=0
let report=[]
try{
  for(const [device,viewport] of [
    ['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]
  ]){
    const ctx=await browser.newContext({viewport,deviceScaleFactor:1})
    if(device==='desktop') await ctx.addInitScript(item=>{
      // Only anonymous draft. No secrets, real account ID or real transaction.
      if(!localStorage.getItem('qa-draft-seeded')){
        localStorage.setItem('zetruv-cart-v1',JSON.stringify([item]))
        localStorage.setItem('qa-draft-seeded','1')
      }
    },guest)
    let signedIn = false
    const session = {
      accessToken: jwt, expiresAt: '2099-01-01T00:00:00Z',
      customer: {name: 'QA Tester', email: 'qa@example.test'},
    }
    await ctx.route('**/api/v1/auth/session', async route => {
      if (route.request().method() === 'DELETE') {
        signedIn = false
        return route.fulfill({status: 204})
      }
      return route.fulfill({status: signedIn ? 200 : 401, json: signedIn ? session : {}})
    })
    await ctx.route('**/api/v1/auth/login', async route => {
      signedIn = true
      return route.fulfill({status: 200, json: session})
    })
    await ctx.route('**/api/v1/auth/verify-email', async route => {
      assert.equal(route.request().postDataJSON().token, 'synthetic-verification-token')
      signedIn = true
      return route.fulfill({status: 200, json: session})
    })
    await ctx.route('**/api/v1/me/cart/merge',async route=>{
      mergeCalls++
      const payload=JSON.parse(route.request().postData()||'{}')
      assert.equal(payload.items[0].productVariantId,voucherId)
      if(!serverRows.length)serverRows.push({
        id:'b3b2cbe1-2422-4a6f-91b3-dc3046c1a9f3',
        productId,productSlug:'qa-voucher',productName:'QA Test Voucher',
        kind:'GameVoucher',fulfillmentMethod:'VOUCHER_CODE',
        gameName:'QA Test Voucher',thumbnailUrl:null,
        productVariantId:voucherId,variantName:'Synthetic 10 Credits',
        unitPrice:1234,regularPrice:1500,quantity:1,isAvailable:true,
        stockQuantity:10,target:null,
      })
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4178','Access-Control-Allow-Credentials':'true'},
        body:JSON.stringify({count:serverRows.length,revision:'rev-1'})})
    })
    await ctx.route('**/api/v1/me/cart',async route=>{
      if(route.request().method()!=='GET')return route.abort('blockedbyclient')
      sessionChecks++
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4178','Access-Control-Allow-Credentials':'true'},
        body:JSON.stringify({items:serverRows,revision:'rev-1'})})
    })
    await ctx.route('**/api/v1/**',async route=>{
      if(route.request().method()==='OPTIONS')
        return route.fulfill({status:204,headers:{
          'Access-Control-Allow-Origin':'http://127.0.0.1:4178','Access-Control-Allow-Credentials':'true',
          'Access-Control-Allow-Headers':'authorization, content-type',
          'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS',
        }})
      return route.fallback()
    })
    const page=await ctx.newPage()
    await page.goto(urls+'/cart',{waitUntil:'domcontentloaded'})
    if(device==='desktop') await page.getByText('QA Test Voucher').first().waitFor({timeout:12000})
    else await page.getByText('Keranjang digital masih kosong').waitFor({timeout:12000})
    await page.screenshot({path:output+'/guest-'+device+'-cart.png',fullPage:true})
    // Navbar AuthModal must authenticate against backend, not preview flag.
    await page.getByRole('button',{name:'Login',exact:true}).first().click()
    const modal=page.getByRole('dialog',{name:'Login'})
    await modal.locator('input[name="email"]').fill('qa@example.test')
    await modal.locator('input[name="password"]').fill('synthetic-only-password')
    await modal.getByRole('button',{name:'Login',exact:true}).click()
    await page.getByText('Keranjang tersimpan di akun Zetruv').waitFor({timeout:20000})
    assert.equal(await page.evaluate(()=>localStorage.getItem('zetruv-cart-v1')),null)
    assert.equal(await page.evaluate(()=>Boolean(sessionStorage.getItem('zetruv-customer-session-v1'))),true)
    await page.screenshot({path:output+'/authenticated-'+device+'-cart.png',fullPage:true})
    await page.reload()
    await page.getByText('Keranjang tersimpan di akun Zetruv').waitFor({timeout:20000})
    assert.ok(await page.getByText('Synthetic 10 Credits').count()>0)
    const secondTab = await ctx.newPage()
    await secondTab.goto(urls + '/cart')
    await secondTab.getByText('Keranjang tersimpan di akun Zetruv').waitFor()
    await page.getByRole('button',{name:'Account menu'}).click()
    await page.getByRole('button',{name:'Logout',exact:true}).click()
    await secondTab.waitForFunction(() => !sessionStorage.getItem('zetruv-customer-session-v1'))
    await secondTab.close()
    await page.getByText('Keranjang digital masih kosong').waitFor({timeout:12000})
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('zetruv-customer-session-v1')),null)
    await page.screenshot({path:output+'/logout-'+device+'-cart.png',fullPage:true})
    await page.goto(urls + '/auth/verify-email?token=synthetic-verification-token')
    await page.getByRole('heading', {name: 'Email verified!'}).waitFor()
    const homeLink = page.getByRole('link', {name: 'Back to Home'})
    assert.equal(await homeLink.getAttribute('href'), '/')
    assert.equal(await page.getByRole('link', {name: 'Go to My Account'}).getAttribute('href'), '/account')
    const navbar = await page.locator('.navbar').boundingBox()
    const card = await page.locator('.verify-email-card').boundingBox()
    assert.ok(card.y > navbar.y + navbar.height, device + ' verification card overlaps navbar')
    assert.ok(card.x >= 0 && card.x + card.width <= viewport.width)
    assert.equal(page.url(), urls + '/auth/verify-email')
    const verifiedTab = await ctx.newPage()
    await verifiedTab.goto(urls + '/cart')
    await verifiedTab.getByText('Keranjang tersimpan di akun Zetruv').waitFor()
    report.push({device,mergeCalls,sessionChecks,afterReload:true,logoutIsolated:true,verification:true})
    await ctx.close()
  }
  assert.equal(mergeCalls,1,'same guest draft re-login may not duplicate merge')
  writeFileSync(output+'/cart-sync-e2e.json',JSON.stringify(report,null,2))
  console.log('PASS: synthetic guest/login/merge/refresh/logout desktop and mobile')
}finally{await browser.close()}
