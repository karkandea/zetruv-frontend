// READ ONLY responsive QA. All checkout/auth/payment mutations are blocked.
// Before = deployed DEV; after = local preview of the PR build.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
const routes=[
  ['home','/'],['pdp-id','/product/mobile-legends'],
  ['pdp-login','/product/genshin-impact/login'],
  ['cart','/cart'],['checkout','/checkout'],['payment','/payment'],
]
const viewports=[['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]
const targets=[['before','https://dev.zetruv.com'],['after','http://127.0.0.1:4178']]
const out='visual-qa'
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
const results=[]
try {
  for(const [phase,origin] of targets){
    for(const [device,viewport] of viewports){
      const context=await browser.newContext({viewport,deviceScaleFactor:1,
        reducedMotion:'reduce',colorScheme:'light'})
      // No credentials or orders; accept public GET only. Resolve DEV API
      // server-side for the local preview to avoid cross-origin CORS noise.
      await context.route('**/api/v1/**',async route=>{
        if(route.request().method()!=='GET')return route.abort('blockedbyclient')
        try{
          const response=await fetch(route.request().url(),{signal:AbortSignal.timeout(12000)})
          const body=await response.text()
          await route.fulfill({status:response.status,body,headers:{
            'Content-Type':response.headers.get('content-type')||'application/json',
            'Access-Control-Allow-Origin':'*','Cache-Control':'no-store',
          }})
        }catch{await route.abort('failed')}
      })
      for(const [name,path] of routes){
        const page=await context.newPage()
        const errors=[]
        page.on('pageerror',e=>errors.push(String(e.message).slice(0,180)))
        let navigationError=''
        try{
          await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:25000})
          await page.waitForTimeout(2200)
          const dimension=await page.evaluate(()=>({
            width:document.documentElement.scrollWidth,
            viewport:window.innerWidth,
            height:document.documentElement.scrollHeight,
            heading:document.querySelector('h1')?.textContent?.trim()||'',
          }))
          await page.screenshot({path:out+'/'+phase+'-'+device+'-'+name+'.png',
            fullPage:true,animations:'disabled'})
          results.push({phase,device,name,path,...dimension,
            overflow:dimension.width>dimension.viewport+4,errors})
        }catch(e){
          navigationError=String(e.message).slice(0,200)
          results.push({phase,device,name,path,error:navigationError})
        }finally{await page.close()}
      }
      await context.close()
    }
  }
}finally{await browser.close()}
writeFileSync(out+'/results.json',JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
// Existing DEV visual defects should not break functional PR CI, but
// any NEW horizontal overflow on the PR build is a regression.
const before=new Map(results.filter(x=>x.phase==='before').map(x=>[x.device+':'+x.name,x]))
const introduced=results.filter(x=>x.phase==='after'&&x.overflow&&
  !before.get(x.device+':'+x.name)?.overflow)
if(introduced.length)throw Error('New responsive horizontal overflow: '+introduced.map(x=>x.device+':'+x.name).join(', '))
if(results.filter(x=>x.phase==='after'&&x.error).length)
  throw Error('PR pages failed to render for one or more viewport/routes')
