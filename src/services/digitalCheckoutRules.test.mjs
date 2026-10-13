import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeIndonesianWhatsApp, checkoutFields, validateCheckoutField,
  validateCheckoutAccount, matchingAccountSource, currentCatalogDifferences,
  paymentSelectionAllowed,
} from './digitalCheckoutRules.js'

const product = {id:'p1',slug:'genshin',isAvailable:true,kind:'TopUpLogin',
  variants:[{id:'v1',name:'Crystals',price:16500,effectivePrice:16500,isAvailable:true,stockQuantity:null}],
  inputFields:[
    {scope:'LoginCredential',key:'login',label:'Email / Username',type:'Text',isRequired:true,maxLength:320,sortOrder:0},
    {scope:'LoginCredential',key:'password',label:'Password',type:'Password',isRequired:true,maxLength:1000,sortOrder:1},
    {scope:'LoginCredential',key:'server',label:'Server',type:'Select',options:['Asia','Europe'],isRequired:false,maxLength:30,sortOrder:2},
  ]}
const login = (key,slug='genshin')=>({cartKey:key,productId:slug,productSlug:slug,variantId:'v1',variantName:'Crystals',unitPrice:16500,quantity:1,fulfillmentMethod:'MANUAL_LOGIN'})
const fields=checkoutFields(product,'LoginCredential')

test('WhatsApp normalization accepts +62 / 08, rejects invalid',()=>{
 assert.equal(normalizeIndonesianWhatsApp('0812 3456 7890'),'+6281234567890')
 assert.equal(normalizeIndonesianWhatsApp('+62 812-3456-7890'),'+6281234567890')
 assert.equal(normalizeIndonesianWhatsApp('6281234567890'),'+6281234567890')
 assert.equal(normalizeIndonesianWhatsApp('12345'),'')
 assert.equal(normalizeIndonesianWhatsApp('abc081234567890'),'')
})
test('username text accepts non-email, required password is validated',()=>{
 assert.equal(validateCheckoutAccount(fields,{login:'Traveler'}),'Lengkapi Password.')
 assert.equal(validateCheckoutAccount(fields,{login:'Traveler',password:'abc',server:'Asia'}),'')
 assert.equal(validateCheckoutAccount(fields,{login:'',password:'abc'}),'Lengkapi Email / Username.')
})
test('select options invalid and numeric fields require numbers',()=>{
 assert.match(validateCheckoutAccount(fields,{login:'user',password:'secret',server:'Mars'}),/Server/)
 assert.match(validateCheckoutField({label:'User ID',required:true,type:'Number',maxLength:20},'xyz'),/angka/)
})
test('OTP, 2FA and recovery code are prohibited even if backend sends fields',()=>{
 const schema=checkoutFields({inputFields:[{scope:'LoginCredential',key:'otp',label:'OTP',isRequired:true}]},'LoginCredential')
 assert.equal(schema[0].prohibited,true)
 assert.match(validateCheckoutAccount(schema,{otp:'111111'}),/tidak boleh diminta/)
})
test('Via ID server-scoped fields retain their labels and requirements',()=>{
 const x=checkoutFields({inputFields:[
 {scope:'AccountValidation',key:'userid',label:'User ID',isRequired:true,sortOrder:1,type:'Text'},
 {scope:'AccountValidation',key:'zone',label:'Zona',isRequired:true,sortOrder:2,type:'Text'},
 ]},'AccountValidation')
 assert.equal(validateCheckoutAccount(x,{userId:'12345',zone:''}),'Lengkapi Zona.')
 assert.equal(validateCheckoutAccount(x,{userId:'12345',zone:'2211'}),'')
})
test('mixed cart different games NEVER shares account accidentally',()=>{
 const a=login('a'),b=login('b','honkai')
 assert.equal(matchingAccountSource([a,b],b,{b:'a'}),'b')
})
test('same product shares ONLY after explicit opt-in',()=>{
 const a=login('a'),b=login('b')
 assert.equal(matchingAccountSource([a,b],b,{}),'b')
 assert.equal(matchingAccountSource([a,b],b,{b:'a'}),'a')
})
test('catalog reprice and unavailable products block checkout until resolved',()=>{
 const a=login('a')
 assert.deepEqual(currentCatalogDifferences([a],{genshin:product}),{changes:[],problems:[]})
 const changed={...product,variants:[{...product.variants[0],effectivePrice:17000}]}
 assert.equal(currentCatalogDifferences([a],{genshin:changed}).changes[0].newPrice,17000)
 const off={...product,isAvailable:false}
 assert.equal(currentCatalogDifferences([a],{genshin:off}).problems.length,1)
})
test('backend live gateway determines available selected methods',()=>{
 assert.equal(paymentSelectionAllowed({canAcceptLivePayments:false,availableMethods:[]},'QRIS'),false)
 assert.equal(paymentSelectionAllowed({canAcceptLivePayments:true,availableMethods:[{code:'QRIS'}]},'QRIS'),true)
 assert.equal(paymentSelectionAllowed({canAcceptLivePayments:true,availableMethods:[{code:'QRIS'}]},'GOPAY'),false)
})
