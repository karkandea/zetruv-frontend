import test from 'node:test'
import assert from 'node:assert/strict'
import { serverLineToCart } from './serverCartMapper.js'
test('authoritative server pricing and UID/zone mapping',()=>{
  const row=serverLineToCart({
    id:'line',productId:'p',productSlug:'ml',productName:'ML',
    kind:'TopUpGame',fulfillmentMethod:'AUTO_ID',productVariantId:'v',
    variantName:'5',unitPrice:1234,regularPrice:1500,quantity:1,stockQuantity:5,
    isAvailable:true,target:{validationId:'target1',expiresAt:'2099-01-01T00:00:00Z',
      fields:{userid:'123456',zoneid:'1020'}}
  })
  assert.equal(row.unitPrice,1234)
  assert.equal(row.regularPrice,1500)
  assert.equal(row.gameAccountValidationId,'target1')
  assert.equal(row.accountFields.userId,'123456')
  assert.equal(row.accountFields.zone,'1020')
})
test('identical SKU different targets stay distinct and omit game password',()=>{
  const original={productId:'p',kind:'TopUpGame',fulfillmentMethod:'AUTO_ID',
    productVariantId:'v',unitPrice:1,quantity:1}
  const a=serverLineToCart({...original,target:{validationId:'a',fields:{userid:'1',zone:'2'}}})
  const b=serverLineToCart({...original,target:{validationId:'b',fields:{userid:'1',zone:'3'}}})
  assert.notDeepEqual(a.accountFields,b.accountFields)
  assert.ok(!JSON.stringify([a,b]).includes('password'))
})

test('cart carries existing variant icon and structured rank values',()=>{
  const value = serverLineToCart({kind:'Joki',variantName:'Epic V → Legend V',
    variantIconUrl:'/media/catalog/value.webp',rankFrom:'Epic V',rankTo:'Legend V',
    rankFromIconUrl:'/media/catalog/epic.webp',rankToIconUrl:'/media/catalog/legend.webp'})
  assert.equal(value.variantIconUrl,'/media/catalog/value.webp')
  assert.equal(value.rankFrom,'Epic V')
  assert.equal(value.rankTo,'Legend V')
  assert.equal(value.rankToIconUrl,'/media/catalog/legend.webp')
})
