// Browser-based contract simulation: two independent browser contexts, two
// customers, revision 409 and explicit conflict resolution. No real DEV writes.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const origin='http://127.0.0.1:4178'
const vid='d9339202-1d6b-4d09-b9e4-b589f1b8cda1'
const productId='96176e58-131e-4b48-84a9-47c57eb359d5'
const users={
  alice:{token:'synthetic-alice-session-token-xxxxxxxxxxxxxxxxxxxx',revision:1,
    items:[makeLine('alice-line','Alice Credits',1)]},
  bob:{token:'synthetic-bob-session-token-xxxxxxxxxxxxxxxxxxxx',revision:1,
    items:[makeLine('bob-line','Bob Only Voucher',1)]},
}
function makeLine(id,variantName,quantity){
  return {id,productId,productSlug:'qa-voucher',productName:variantName,
    gameName:variantName,kind:'GameVoucher',fulfillmentMethod:'VOUCHER_CODE',
    thumbnailUrl:null,productVariantId:vid,variantName,quantity,unitPrice:1234,
    regularPrice:1500,stockQuantity:20,isAvailable:true,target:null}
}
const copy=x=>JSON.parse(JSON.stringify(x))
const json=(route,status,obj)=>route.fulfill({status,contentType:'application/json',
  headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'},
  body:JSON.stringify(obj)})
let holdStaleAliceB=false
let staleSnapshot=null
let conflicts=0
let authCalls=0
let writeCalls=0
function backendFor(request){
  const h=request.headers().authorization||''
  return Object.values(users).find(x=>h==='Bearer '+x.token)
}
async function context(device){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}})
  await ctx.route('**/api/v1/**',async route=>{
    const req=route.request()
    const path=new URL(req.url()).pathname
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:{
      'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*',
      'Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'}})
    if(path.endsWith('/auth/login')&&req.method()==='POST'){
      authCalls++
      const body=JSON.parse(req.postData()||'{}')
      const who=body.email==='alice@example.test'?'alice':body.email==='bob@example.test'?'bob':null
      if(!who||body.password!=='synthetic-password')return json(route,401,{message:'invalid'})
      return json(route,200,{accessToken:users[who].token,customer:{
        email:body.email,name:who}})
    }
    if(path.endsWith('/me/cart')&&req.method()==='GET'){
      const user=backendFor(req)
      if(!user)return json(route,401,{message:'unauthorized'})
      const stale=holdStaleAliceB && device==='b'
        && user===users.alice && staleSnapshot
      const state=stale?staleSnapshot:user
      return json(route,200,{items:copy(state.items),revision:'rev-'+state.revision})
    }
    if(path.endsWith('/me/cart')&&req.method()==='PUT'){
      writeCalls++
      const user=backendFor(req)
      if(!user)return json(route,401,{message:'unauthorized'})
      const body=JSON.parse(req.postData()||'{}')
      if(body.revision!=='rev-'+user.revision){
        conflicts++
        holdStaleAliceB=false
        return json(route,409,{code:'CART_CHANGED',message:'Cart changed in another session.'})
      }
      user.items=body.items.map((item,i)=>makeLine(
        user===users.alice?'alice-line':'bob-line',
        user===users.alice?'Alice Credits':'Bob Only Voucher',item.quantity))
      user.revision++
      return json(route,200,{revision:'rev-'+user.revision,count:user.items.length})
    }
    if(path.endsWith('/me/cart/merge')&&req.method()==='POST'){
      const user=backendFor(req)
      if(!user)return json(route,401,{message:'unauthorized'})
      return json(route,200,{revision:'rev-'+user.revision,count:user.items.length})
    }
    // Catalog and payment methods aren't part of this concurrency test.
    return json(route,404,{message:'Synthetic unrelated API disabled'})
  })
  return ctx
}
async function login(page,email){
  await page.getByRole('button',{name:'Login',exact:true}).first().click()
  const dialog=page.getByRole('dialog',{name:'Login'})
  await dialog.locator('input[name="email"]').fill(email)
  await dialog.locator('input[name="password"]').fill('synthetic-password')
  await dialog.getByRole('button',{name:'Login',exact:true}).click()
  await page.getByText('Keranjang tersimpan di akun Zetruv').waitFor({timeout:20000})
}
const qa=[]
try{
  const ctxA=await context('a'),ctxB=await context('b')
  const a=await ctxA.newPage(),b=await ctxB.newPage()
  // Different contexts = distinct browser sessions, same account on both.
  await a.goto(origin+'/cart')
  await b.goto(origin+'/cart')
  await login(a,'alice@example.test')
  await login(b,'alice@example.test')
  assert.equal(await a.getByText('Alice Credits').count()>0,true)
  assert.equal(await b.getByText('Alice Credits').count()>0,true)
  staleSnapshot=copy(users.alice)
  holdStaleAliceB=true
  // Writer A commits two edits while B retains a stale snapshot.
  await a.getByRole('button',{name:'Tambah jumlah'}).click()
  await a.getByRole('button',{name:'Tambah jumlah'}).click()
  await a.waitForFunction(()=>document.querySelector('.digital-qty output')?.textContent==='3')
  // Before using B, ensure A has completed both serialized writes.
  for(let i=0;i<40&&users.alice.items[0].quantity!==3;i++)
    await new Promise(r=>setTimeout(r,100))
  assert.equal(users.alice.items[0].quantity,3)
  await b.getByRole('button',{name:'Tambah jumlah'}).click()
  await b.getByText('Keranjang berubah di perangkat lain',{exact:false}).waitFor({timeout:12000})
  assert.equal(users.alice.items[0].quantity,3,'stale PUT must not overwrite A')
  assert.ok(conflicts>=1)
  b.once('dialog',d=>d.accept())
  await b.getByRole('button',{name:'Gunakan versi server'}).click()
  await b.getByText('Keranjang tersimpan di akun Zetruv').waitFor({timeout:12000})
  assert.equal(await b.locator('.digital-qty output').first().textContent(),'3')
  qa.push({scenario:'concurrent two-browser 409 and explicit server choice',status:'PASS'})
  // Account switch in same browser must never expose Alice's cart to Bob.
  await a.getByRole('button',{name:'Keluar'}).click()
  await login(a,'bob@example.test')
  await a.getByText('Bob Only Voucher').first().waitFor({timeout:12000})
  assert.equal(await a.getByText('Alice Credits').count(),0)
  await a.reload()
  await a.getByText('Bob Only Voucher').first().waitFor({timeout:12000})
  assert.equal(await a.getByText('Alice Credits').count(),0)
  qa.push({scenario:'cross-account logout/login isolation and refresh',status:'PASS'})
  assert.ok(authCalls>=3)
  assert.ok(writeCalls>=3)
  console.log(JSON.stringify({status:'PASS',tests:qa,conflicts,authCalls,writeCalls}))
  await ctxA.close();await ctxB.close()
}finally{await browser.close()}
