import { spawn } from 'node:child_process'

const chrome = process.env.CHROME_BIN
if (!chrome) throw new Error('CHROME_BIN is required')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitJson(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {}
    await sleep(500)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const chromeProcess = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--ignore-certificate-errors',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/zetruv-schema-probe',
  'about:blank',
], { stdio: 'inherit' })

try {
  await waitJson('http://127.0.0.1:9222/json/version')
  const targetResponse = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })
  const target = await targetResponse.json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed')
    return result.result.value
  }
  const navigate = async (url) => {
    await send('Page.navigate', { url })
    for (let i = 0; i < 40; i += 1) {
      await sleep(250)
      const ready = await evaluate('document.readyState')
      if (ready === 'complete') break
    }
    await sleep(2500)
  }

  await send('Page.enable')
  await send('Runtime.enable')

  const productResponse = await fetch('https://api-dev.zetruv.com/api/v1/catalog/products/genshin-impact')
  if (!productResponse.ok) throw new Error(`Genshin API returned ${productResponse.status}`)
  const product = await productResponse.json()
  const variant = product.variants.find((item) => item.isAvailable) || product.variants[0]
  if (!variant) throw new Error('No Genshin variant available for browser probe')

  await navigate('https://dev.zetruv.com/product/genshin-impact/login')
  const cart = [{
    cartKey: `${variant.id}:default`,
    accountKey: 'default',
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    productKind: product.kind,
    fulfillmentMethod: product.fulfillmentMethod,
    requiresGameAccountValidation: product.requiresGameAccountValidation,
    thumbnailUrl: product.thumbnailUrl || product.game?.imageUrl || null,
    gameName: product.game?.name || null,
    variantId: variant.id,
    variantName: variant.name,
    unitPrice: variant.effectivePrice ?? variant.price,
    regularPrice: variant.price,
    isOnSale: variant.isOnSale,
    quantity: 1,
    maxQuantity: variant.stockQuantity ?? 99,
  }]
  const stored = await evaluate(`localStorage.setItem('zetruv-cart-v1', ${JSON.stringify(JSON.stringify(cart))}); Boolean(localStorage.getItem('zetruv-cart-v1'))`)
  if (!stored) throw new Error('Could not persist non-sensitive cart fixture in browser')

  await navigate('https://dev.zetruv.com/checkout?method=MANUAL_LOGIN')
  const checkout = await evaluate(`(() => ({
    labels: [...document.querySelectorAll('.credential-block label > span')].map((node) => node.textContent.trim()),
    inputTypes: [...document.querySelectorAll('.credential-block input')].map((node) => node.type),
    selectOptions: [...document.querySelectorAll('.credential-block select option')].map((node) => node.textContent.trim()),
    hasGenshin: document.body.innerText.includes('Genshin Impact'),
    body: document.body.innerText.slice(0, 1200),
  }))()`)
  console.log('GENSHIN_BROWSER_PROOF', JSON.stringify(checkout))
  if (!checkout.hasGenshin) throw new Error('Genshin checkout item was not rendered')
  for (const label of ['Email / Username *', 'Password *', 'Server / Region']) {
    if (!checkout.labels.includes(label)) throw new Error(`Missing dynamic checkout label: ${label}`)
  }
  if (!checkout.inputTypes.includes('password')) throw new Error('Dynamic password input did not render as password')
  for (const option of ['Asia', 'America', 'Europe', 'TW/HK/MO']) {
    if (!checkout.selectOptions.includes(option)) throw new Error(`Missing dynamic server option: ${option}`)
  }

  await navigate('https://admin-dev.zetruv.com')
  const adminBundle = await evaluate(`(async () => {
    const urls = [...document.scripts].map((script) => script.src).filter(Boolean)
    const text = (await Promise.all(urls.map((url) => fetch(url).then((response) => response.text())))).join('\n')
    return {
      hasInputPanel: text.includes('Customer input fields'),
      hasAddField: text.includes('Add customer input field'),
      hasScopeCopy: text.includes('Non-sensitive account fields collected before validation'),
    }
  })()`)
  console.log('ADMIN_LIVE_BUNDLE_PROOF', JSON.stringify(adminBundle))
  if (!adminBundle.hasInputPanel || !adminBundle.hasAddField || !adminBundle.hasScopeCopy) {
    throw new Error('Live admin bundle does not contain dynamic schema editor')
  }

  ws.close()
  console.log('PASS: Genshin dynamic checkout rendered in Chromium and admin DEV bundle contains schema editor')
} finally {
  chromeProcess.kill('SIGTERM')
}
