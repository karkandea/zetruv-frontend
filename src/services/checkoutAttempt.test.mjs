import test from 'node:test'
import assert from 'node:assert/strict'
import {CHECKOUT_ATTEMPT_KEY,readCheckoutAttempt,preserveCheckoutAttempt,clearCheckoutAttempt} from './checkoutAttempt.js'
const a='f3b928c8-0041-4dd8-8eee-58774d2c4862',b='48b153e0-3b81-412e-9131-c638e215719f'
const storage=()=>{let data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
test('persist only opaque UUID and channel, not credentials',()=>{
 const s=storage();preserveCheckoutAttempt(a,'QRIS',s)
 assert.deepEqual(Object.keys(JSON.parse(s.getItem(CHECKOUT_ATTEMPT_KEY))).sort(),['createdAt','key','methodCode','version'])
 assert.equal(readCheckoutAttempt(s).key,a)
 clearCheckoutAttempt(s);assert.equal(readCheckoutAttempt(s),null)
})
test('repeat key safe, another attempt cannot replace unresolved order',()=>{
 const s=storage(),x=preserveCheckoutAttempt(a,'GOPAY',s)
 assert.deepEqual(preserveCheckoutAttempt(a,'GOPAY',s),x)
 assert.throws(()=>preserveCheckoutAttempt(b,'GOPAY',s))
 assert.throws(()=>preserveCheckoutAttempt(a,'QRIS',s))
})
test('invalid or missing session rejects unsafe recovery',()=>{
 const s=storage();s.setItem(CHECKOUT_ATTEMPT_KEY,'broken')
 assert.equal(readCheckoutAttempt(s),null)
 assert.throws(()=>preserveCheckoutAttempt('123','QRIS',s))
 assert.throws(()=>preserveCheckoutAttempt(a,'https:',s))
 assert.throws(()=>preserveCheckoutAttempt(a,'QRIS',null))
})
