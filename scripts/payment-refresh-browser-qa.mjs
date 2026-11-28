import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const origin='http://127.0.0.1:4178', orderId='8d5987b5-1f7a-4b31-86b0-af89ad51407c', token='qa-synthetic-session-not-real-access'
const items=[
 {productName:'Joki MLBB',productSlug:'qa-joki',kind:'Joki',variantName:'Epic V → Legend V',rankFrom:'Epic V',rankTo:'Legend V',rankFromIconUrl:'/assets/search/mobile-legends.webp',rankToIconUrl:'/assets/search/mobile-legends.webp',lineTotal:99000},
 {productName:'eFootball Mobile',productSlug:'efootball-mobile',kind:'TopUpLogin',variantName:'137 Coins',lineTotal:18000}
].map((x,i)=>({...x,id:'qa-line-'+i,productId:'qa-product-'+i,productVariantId:'qa-variant-'+i,quantity:1,thumbnailUrl:'/assets/search/mobile-legends.webp',unitPrice:x.lineTotal,regularPrice:x.lineTotal,isAvailable:true,fulfillmentMethod:i?'MANUAL_LOGIN':'MANUAL'}))
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})})
try{for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:900}})
 await ctx.addInitScript(({items,orderId,token})=>{
 localStorage.setItem('zetruv-navbar-language','id')
 sessionStorage.setItem('zetruv-customer-session-v1',JSON.stringify({version:1,accessToken:token,expiresAt:'2099-01-01T00:00:00Z',customer:{name:'QA',email:'qa@example.test'}}))
 sessionStorage.setItem('zetruv-payment-session-v1',JSON.stringify({version:1,orderId,orderNumber:'QA-VALUE',orderAccessToken:'mock',orderAccessTokenExpiresAt:'2099-01-01T00:00:00Z',methodCode:'MIDTRANS_OTHER_QRIS',grandTotal:117000,items}))
 },{items,orderId,token})
 const page=await ctx.newPage()
 let refreshed=false; const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await ctx.route('**/api/v1/**',async r=>{
 const path=new URL(r.request().url()).pathname.replace('/api/v1','')
 const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type,idempotency-key,x-order-access-token','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'}
 const json=(data,status=200)=>r.fulfill({status,headers,json:data})
 if(r.request().method()==='OPTIONS')return r.fulfill({status:204,headers})
 if(path==='/auth/session')return json({accessToken:token,expiresAt:'2099-01-01T00:00:00Z',customer:{name:'QA',email:'qa@example.test'}})
 if(path==='/me/cart')return json({items,revision:'qa-rev'})
 const x=items.find(i=>path==='/catalog/products/'+i.productSlug)
 if(x)return json({id:x.productId,slug:x.productSlug,name:x.productName,kind:x.kind,fulfillmentMethod:x.fulfillmentMethod,isAvailable:true,inputFields:[],variants:[{id:x.productVariantId,name:x.variantName,price:x.lineTotal,effectivePrice:x.lineTotal,isAvailable:true}]})
 if(path==='/checkout/vouchers/preview')return json({code:'QA10',discountAmount:10000})
 if(path==='/checkout/payment-options')return json({isSandbox:true,canAcceptLivePayments:true,availableMethods:[{code:'QRIS',name:'QRIS',group:'qris',paymentFee:0}]})
 if(path==='/checkout/orders/'+orderId+'/payment/refresh'){assert.equal(r.request().method(),'POST');refreshed=true;return json({orderId,state:'Paid',paymentStatus:'Paid',hasActivePaymentSession:false,canRetry:false})}
 if(path==='/checkout/orders/'+orderId+'/payment')return json({orderId,state:refreshed?'Paid':'Pending',hasActivePaymentSession:!refreshed,canRetry:false,expiresAt:'2099-01-01T00:00:00Z',paymentUrl:'https://api.sandbox.midtrans.com/v2/qris/8d5987b5-1f7a-4b31-86b0-af89ad51407c/qr-code'})
 return json({},404)
 })
 await ctx.route('https://api.sandbox.midtrans.com/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="white"/></svg>'}))
 for(const path of ['/checkout','/payment']){
 await page.goto(origin+path)
 if(path==='/checkout'){
 const selector=page.locator('.whatsapp-country select')
 await selector.waitFor({state:'attached'})
 assert.equal(await selector.inputValue(),'ID')
 assert.match(await page.locator('.whatsapp-country-display').innerText(),/\+62/)
 assert.equal(await page.locator('.whatsapp-flag').count(),1)
 await selector.selectOption('SG')
 assert.match(await page.locator('.whatsapp-country-display').innerText(),/\+65/)
 await page.locator('#checkout-phone').fill('91234567')
 await page.locator('#checkout-phone').blur()
 assert.equal(await page.locator('#checkout-phone').getAttribute('aria-invalid'),'false')
 await page.locator('#checkout-phone').fill('+60 12 345 6789')
 assert.equal(await selector.inputValue(),'MY')
 assert.match(await page.locator('.whatsapp-country-display').innerText(),/\+60/)
 assert.equal(await page.locator('#checkout-phone').inputValue(),'123456789')
 const promo=page.locator('.digital-payment-panel .digital-voucher')
 await promo.waitFor(); assert.equal(await page.locator('.digital-voucher').count(),1)
 const total=page.locator('.digital-checkout-total strong'); const before=await total.innerText()
 await promo.locator('input').fill('QA10'); await promo.locator('button').first().click()
 await page.locator('.digital-checkout-prices .is-discount').waitFor()
 assert.match(await page.locator('.digital-checkout-prices .is-discount').innerText(),/QA10/)
 assert.notEqual(await total.innerText(),before)
 await promo.locator('.checkout-voucher-applied button').click()
 assert.equal(await total.innerText(),before)
 assert.equal(await page.locator('.digital-checkout-prices .is-discount').count(),0)
 }

 const j=page.locator('.purchased-value--journey').first()
 await page.waitForFunction(()=>{const j=document.querySelector('.purchased-value--journey');return j?.querySelectorAll('.purchased-value__rank').length===2 && j?.querySelectorAll('.purchased-value__arrow').length===1}); assert.match(await j.innerText(),/Epic V/); assert.match(await j.innerText(),/Legend V/)
 const coin=page.locator('.purchased-value').filter({hasText:'137 Coins'}).first()
 await coin.locator('img').waitFor()
 await page.waitForFunction(()=>[...document.querySelectorAll('.purchased-value img')].every(i=>i.complete&&i.naturalWidth>0))
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2))
 if(path==='/payment'){const qr=page.locator('.payment-session-native-qr'); const check=qr.locator('.payment-session-check-status'); await check.waitFor(); assert.equal(await page.locator('.payment-session-check-status').count(),1); assert.ok(await check.evaluate(el=>el.previousElementSibling?.tagName==='IMG')); await check.click(); await page.locator('.payment-session-status .is-paid').waitFor(); assert.equal(refreshed,true); assert.equal(await qr.count(),0)}
 console.log('PASS',width,path)
 }
 assert.deepEqual(errors,[]);await ctx.close()
}}finally{await browser.close()}
