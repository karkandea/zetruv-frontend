import test from 'node:test'
import assert from 'node:assert/strict'
import { toVoucherPayload, validateVoucherForm, toLocalDatetime } from './discountVoucherForm.js'

const form = {code:' welcome10 ',type:'Percentage',value:'10',maximumDiscount:'50000',minimumSpend:'100000',applicableKind:'TopUpGame',maxUses:'20',maxUsesPerCustomer:'1',startsAt:'2026-09-25T10:00',endsAt:'2026-09-26T10:00',isActive:true}
test('normalizes voucher payload to backend contract', () => {
 const result = toVoucherPayload(form)
 assert.equal(result.code,'WELCOME10')
 assert.equal(result.type,'Percentage')
 assert.equal(result.value,10)
 assert.equal(result.maximumDiscount,50000)
 assert.equal(result.minimumSpend,100000)
 assert.equal(result.maxUses,20)
 assert.equal(result.maxUsesPerCustomer,1)
 assert.equal(result.applicableKind,'TopUpGame')
 assert.ok(result.startsAt.endsWith('Z'))
 assert.equal(validateVoucherForm(form),null)
})
test('omitted usage caps and fixed discount cap become null', () => {
 const result=toVoucherPayload({...form,type:'Fixed',maxUses:'',maxUsesPerCustomer:'',maximumDiscount:'50000',applicableKind:''})
 assert.equal(result.maximumDiscount,null)
 assert.equal(result.maxUses,null)
 assert.equal(result.maxUsesPerCustomer,null)
 assert.equal(result.applicableKind,null)
})
test('rejects invalid codes and discount dates', () => {
 assert.match(validateVoucherForm({...form,code:'%%%'}),/Code/)
 assert.match(validateVoucherForm({...form,value:'101'}),/100/)
 assert.match(validateVoucherForm({...form,endsAt:form.startsAt}),/End date/)
 assert.match(validateVoucherForm({...form,maxUses:'1.2'}),/whole numbers/)
})
test('date inputs are local representation, not UTC truncated', () => {
 assert.equal(toLocalDatetime(new Date('2026-09-25T03:00:00.000Z')).length,16)
})
