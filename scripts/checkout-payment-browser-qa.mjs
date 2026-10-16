// Contract-based frontend E2E only. Mock server responses; no live checkout/payment/email.
// A server-confirmed state is the only source of payment truth.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const origin = 'http://127.0.0.1:4178'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const variantId = 'c5dcf15d-a911-4b78-997c-17185d548019'
const productId = 'c983c9b4-998c-4473-ab14-61736ed11ca0'
const orderId = '8d5987b5-1f7a-4b31-86b0-af89ad51407c'
const accessToken = 'qa-frontend-mock-session-with-no-real-access'
const grant = 'qa-short-lived-order-access-token'
const product = {
  id: productId,slug: 'qa-voucher',name: 'QA Test Voucher',
  kind: 'GameVoucher', fulfillmentMethod: 'VOUCHER_CODE',
  isAvailable: true,requiresGameAccountValidation: false,inputFields: [],
  variants: [{ id: variantId,name: '10 Credits',price: 25000,
    effectivePrice: 25000,isAvailable:true,stockQuantity:20 }],
}
const line = {
  id:'7e246939-d196-475c-9656-aeb9bc00edb7',productId,
  productSlug:'qa-voucher',productName:'QA Test Voucher',kind:'GameVoucher',
  fulfillmentMethod:'VOUCHER_CODE',gameName:'QA Test Voucher',
  productVariantId:variantId,variantName:'10 Credits',
  unitPrice:25000,regularPrice:25000,quantity:1,stockQuantity:20,
  isAvailable:true,target:null,
}
const order = {
  id:orderId,orderNumber:'ZTR-QA-CHECKOUT-2026',status:0,paymentStatus:0,
  subtotal:25000,discountAmount:0,shippingAmount:0,grandTotal:25000,
  currency:'IDR',orderAccessToken:grant,
  orderAccessTokenExpiresAt:'2099-01-01T00:00:00Z',
  createdAt:'2026-10-16T00:00:00Z',
  items:[{productName:'QA Test Voucher',variantName:'10 Credits',quantity:1,lineTotal:25000}],
}
const readiness = {
  canAcceptLivePayments:true,status:'Ready',isSandbox:true,
  availableMethods:[{code:'QRIS',name:'QRIS',paymentFee:0}],
}
const payment = state => ({
  orderId,state,canRetry:false,hasActivePaymentSession:state==='Pending',
  expiresAt:'2099-01-01T00:00:00Z',
  qrString:state==='Pending'?'synthetic-qris-string':null,
  checkedAt:'2026-10-16T00:00:00Z',
})
const json = (route, status, data) => route.fulfill({
  status,contentType:'application/json',
  headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'},
  body:JSON.stringify(data),
})

try {
  for (const [device,viewport] of [
    ['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}],
  ]) {
    const ctx=await browser.newContext({viewport})
    const page=await ctx.newPage()
    let orderPosts=0,paymentPosts=0,paymentGets=0
    let remotePayment='Pending', methodsAvailable=true
    await page.addInitScript(({accessToken})=>{
      if(!sessionStorage.getItem('qa-checkout-seeded')){
        sessionStorage.setItem('zetruv-customer-session-v1', JSON.stringify({
          version:1,accessToken,customer:{name:'QA Test',email:'checkout@example.test'},
        }))
        sessionStorage.setItem('qa-checkout-seeded','1')
      }
    },{accessToken})
    await page.route('**/api/v1/**',async route=>{
      const req=route.request(),url=new URL(req.url()),path=url.pathname
      if(req.method()==='OPTIONS')return route.fulfill({
        status:204,headers:{'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'},
      })
      if(path.endsWith('/catalog/products/qa-voucher')&&req.method()==='GET')
        return json(route,200,product)
      if(path.endsWith('/checkout/payment-options')&&req.method()==='GET')
        return json(route,200,methodsAvailable?readiness:{canAcceptLivePayments:false,isSandbox:true,availableMethods:[],status:'NoSupportedMethods'})
      if(path.endsWith('/me/cart')&&req.method()==='GET'){
        assert.equal(req.headers().authorization,'Bearer '+accessToken)
        return json(route,200,{items:[line],revision:'rev-1'})
      }
      if(path.endsWith('/me/cart/merge')&&req.method()==='POST')
        return json(route,200,{items:[line],revision:'rev-1'})
      if(path.endsWith('/checkout/orders')&&req.method()==='POST'){
        orderPosts++
        const body=req.postDataJSON()
        assert.equal(body.customerEmail,'checkout@example.test')
        assert.equal(body.customerPhone,'+6281234567890')
        assert.equal(body.items.length,1)
        assert.equal(body.items[0].productVariantId,variantId)
        assert.ok(req.headers()['idempotency-key'])
        assert.equal(req.headers().authorization,'Bearer '+accessToken)
        return json(route,200,order)
      }
      if(path.endsWith('/checkout/orders/'+orderId+'/payment')&&req.method()==='POST'){
        paymentPosts++
        assert.equal(req.headers()['x-order-access-token'],grant)
        assert.equal(url.searchParams.get('methodCode'),'QRIS')
        return json(route,200,payment('Pending'))
      }
      if(path.endsWith('/checkout/orders/'+orderId+'/payment')&&req.method()==='GET'){
        paymentGets++
        assert.equal(req.headers()['x-order-access-token'],grant)
        return json(route,200,payment(remotePayment))
      }
      return json(route,404,{message:'Unrelated test API not enabled'})
    })
    // Payment deep-link without server-issued order context must remain harmless.
    await page.goto(origin+'/payment',{waitUntil:'domcontentloaded'})
    await page.getByRole('heading',{name:'Tidak ada sesi pembayaran'}).waitFor()
    assert.equal(paymentGets,0)
    await page.goto(origin+'/checkout',{waitUntil:'domcontentloaded'})
    await page.getByRole('heading',{name:'Checkout Digital'}).waitFor()
    await page.getByText('QA Test Voucher').first().waitFor()
    await page.locator('#checkout-phone').fill('081234567890')
    await page.getByRole('button',{name:'QRIS',exact:false}).first().click()
    const pay=page.getByRole('button',{name:'Bayar Sekarang'})
    await pay.waitFor()
    assert.equal(await pay.isDisabled(),false,'verified catalog, synced cart, sandbox methods should allow pay')
    // Changing gateway readiness prevents new order creation.
    methodsAvailable=false
    await page.getByRole('button',{name:'Bayar Sekarang'}).click()
    await page.getByRole('alert').getByText(/Metode pembayaran tidak tersedia lagi/).waitFor()
    assert.equal(orderPosts,0)
    methodsAvailable=true
    // A fresh method choice may require a reload after an unavailable gateway.
    await page.reload()
    await page.getByText('QA Test Voucher').first().waitFor()
    await page.locator('#checkout-phone').fill('081234567890')
    await page.getByRole('button',{name:'QRIS',exact:false}).first().click()
    await page.getByRole('button',{name:'Bayar Sekarang'}).click()
    await page.waitForURL('**/payment',{timeout:20000})
    await page.getByRole('heading',{name:'Menunggu pembayaran'}).waitFor({timeout:15000})
    assert.equal(orderPosts,1,'only one backend order should be created')
    assert.equal(paymentPosts,1,'only one payment session should be created')
    assert.ok(paymentGets>=1)
    assert.equal(await page.getByRole('heading',{name:'Pembayaran terkonfirmasi'}).count(),0)
    await page.reload()
    await page.getByRole('heading',{name:'Menunggu pembayaran'}).waitFor()
    assert.equal(orderPosts,1,'refresh never creates a second order')
    assert.equal(paymentPosts,1,'refresh never creates a second payment')
    remotePayment='Paid'
    await page.getByRole('button',{name:'Periksa status'}).click()
    await page.getByRole('heading',{name:'Pembayaran terkonfirmasi'}).waitFor()
    assert.equal(orderPosts,1)
    assert.equal(paymentPosts,1)
    const info=await page.evaluate(()=>JSON.stringify({
      session:{...sessionStorage},local:{...localStorage},
    }))
    assert.ok(!info.includes('081234567890'))
    assert.ok(!info.includes('synthetic-password'))
    console.log('PASS',device,'payment deep link guard, backend method gate, one order+payment, refresh, pending->Paid by server')
    await ctx.close()
  }
} finally {
  await browser.close()
}
