import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const browser = await chromium.launch({headless:true,executablePath:process.env.ZETRUV_CHROMIUM || undefined,args:['--no-sandbox']})
const base=process.env.ZETRUV_TEST_URL || 'http://127.0.0.1:4178'
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const page=await browser.newPage({viewport})
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(base,{waitUntil:'domcontentloaded'})
    const trigger=page.locator('.auth-actions button').first()
    if (await trigger.isVisible()) {
      await trigger.click()
      const dialog=page.locator('.auth-modal')
      await dialog.waitFor()
      for(let i=0;i<18;i++){
        await page.keyboard.press('Tab')
        assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)),'Tab stays in dialog')
      }
      await page.keyboard.press('Shift+Tab')
      assert.ok(await dialog.evaluate(el=>el.contains(document.activeElement)))
      await page.keyboard.press('Escape')
      await dialog.waitFor({state:'detached'})
      assert.ok(await trigger.evaluate(el=>document.activeElement===el),'Restore opener')
    }
    await page.goto(base+'/articles',{waitUntil:'domcontentloaded'})
    const input=page.locator('.article-index-tools input')
    await input.fill('QA')
    await page.locator('.article-search-clear').click()
    assert.equal(await input.inputValue(),'')
    assert.ok(await input.evaluate(el=>document.activeElement===el))
    for(const path of ['/product/mobile-legends','/product/genshin-impact/login','/cart','/checkout','/payment','/game-accounts','/merchandise','/account','/articles']){
      await page.goto(base+path,{waitUntil:'domcontentloaded'})
      await page.waitForTimeout(300)
      const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}))
      assert.ok(width.scroll<=width.viewport+2, path+' overflow '+JSON.stringify(width))
    }
    assert.deepEqual(errors,[])
    console.log('PASS',viewport.width,'modal keyboard where visible, article search, 9 route smoke and viewport overflow')
    await page.close()
  }
} finally {await browser.close()}
