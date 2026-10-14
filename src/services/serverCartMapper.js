// Pure DTO projection. Never copy credentials or trust cached price as final checkout price.
function targetFields(fields={}){
  const entries=Object.entries(fields||{})
  const zone=entries.find(([key])=>/(zone|server|region)/i.test(key))
  const user=entries.find(([key])=>/(userid|user_id|player|uid|character|accountid|user)/i.test(key))
    ||entries.find(([key])=>key!==zone?.[0])
  return {userId:String(user?.[1]||''),zone:String(zone?.[1]||'')}
}
export function serverLineToCart(row){
  const target=row.target||null
  const accountFields=targetFields(target?.fields)
  return {
    serverLineId:row.id,productId:row.productId,productSlug:row.productSlug,
    productName:row.productName,productKind:row.kind,
    fulfillmentMethod:row.fulfillmentMethod,gameName:row.gameName||row.productName,
    thumbnailUrl:row.thumbnailUrl,variantId:row.productVariantId,
    variantName:row.variantName,unitPrice:Number(row.unitPrice),
    regularPrice:Number(row.regularPrice??row.unitPrice),
    quantity:row.quantity,maxQuantity:row.stockQuantity??99,
    isAvailable:row.isAvailable,
    gameAccountValidationId:target?.validationId||null,
    validationExpiresAt:target?.expiresAt||null,
    accountFields,serverTargetFields:target?.fields||null,
    accountLabel:target?.accountDisplayName||accountFields.userId,
    accountKey:row.fulfillmentMethod==='AUTO_ID'
      ?accountFields.userId+':'+accountFields.zone:'checkout-required',
  }
}
