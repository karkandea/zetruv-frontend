// Only a non-sensitive tab-scoped reference, NEVER JWT, password, form or order payload.
export const CHECKOUT_ATTEMPT_KEY = 'zetruv-checkout-attempt-v1'
const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function readCheckoutAttempt(storage=globalThis.sessionStorage) {
  try {
    const a=JSON.parse(storage?.getItem(CHECKOUT_ATTEMPT_KEY)||'null')
    return a?.version===1 && v4.test(a.key) && /^[A-Z0-9_]{2,32}$/.test(a.methodCode)?a:null
  } catch { return null }
}
export function preserveCheckoutAttempt(key,methodCode,storage=globalThis.sessionStorage) {
  if(!v4.test(key)||!/^[A-Z0-9_]{2,32}$/.test(methodCode||''))throw Error('Checkout attempt tidak valid.')
  const old=readCheckoutAttempt(storage)
  if(old&&(old.key!==key||old.methodCode!==methodCode))throw Error('Masih ada checkout yang harus dipulihkan.')
  if(old)return old
  if(!storage)throw Error('Penyimpanan sesi browser tidak tersedia.')
  const a={version:1,key,methodCode,createdAt:new Date().toISOString()}
  storage.setItem(CHECKOUT_ATTEMPT_KEY,JSON.stringify(a))
  return a
}
export function clearCheckoutAttempt(storage=globalThis.sessionStorage) {
  try{storage?.removeItem(CHECKOUT_ATTEMPT_KEY)}catch{/* storage inaccessible */}
}
