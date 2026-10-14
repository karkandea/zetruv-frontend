import { apiRequest } from '../api/httpClient'
import { getCatalogProduct } from './catalogService'
import { verifyTopUpIdDestination } from './digitalPurchaseCapabilities'
import {
  readGuestCart, clearGuestCart, setAuthenticatedCart,
  leaveAuthenticatedCart, isAuthenticatedCart,
} from './cartService'
import { serverLineToCart } from './serverCartMapper'

const SESSION_KEY='zetruv-customer-session-v1'
export const CUSTOMER_EVENT='zetruv-customer-auth-change'
export const CART_SYNC_EVENT='zetruv-cart-sync-status'
let boot=null
let writeQueue=Promise.resolve()
let writing=0
let status={state:'guest',message:''}

function notify(state,message=''){
  status={state,message}
  if(typeof window!=='undefined')
    window.dispatchEvent(new CustomEvent(CART_SYNC_EVENT,{detail:status}))
}
export const getCartSyncStatus=()=>status

export function readCustomerSession(){
  if(typeof window==='undefined')return null
  try{
    const obj=JSON.parse(window.sessionStorage.getItem(SESSION_KEY)||'null')
    return obj?.version===1 && typeof obj.accessToken==='string' &&
      obj.accessToken.length>30?obj:null
  }catch{return null}
}
const activeToken=()=>readCustomerSession()?.accessToken||null
export function setCustomerSession(response){
  if(!response?.accessToken || typeof response.accessToken!=='string')
    throw Error('Sesi Zetruv belum terverifikasi.')
  const value={version:1,accessToken:response.accessToken,customer:response.customer||null}
  window.sessionStorage.setItem(SESSION_KEY,JSON.stringify(value))
  boot=null
  window.dispatchEvent(new CustomEvent(CUSTOMER_EVENT,{detail:{authenticated:true}}))
  return value
}
export function logoutCustomer(){
  if(typeof window==='undefined')return
  window.sessionStorage.removeItem(SESSION_KEY)
  boot=null
  leaveAuthenticatedCart()
  notify('guest')
  window.dispatchEvent(new CustomEvent(CUSTOMER_EVENT,{detail:{authenticated:false}}))
}

const auth=token=>({Authorization:'Bearer '+token})
export const getServerCart=token=>apiRequest('/me/cart',{
  method:'GET',cache:'no-store',headers:auth(token)
})
const putServerCart=(token,items)=>apiRequest('/me/cart',{
  method:'PUT',headers:auth(token),body:JSON.stringify({items})
})
const mergeServerCart=(token,items)=>apiRequest('/me/cart/merge',{
  method:'POST',headers:auth(token),body:JSON.stringify({items})
})

const fieldsFor=product=>(product?.inputFields||[])
  .filter(f=>f.scope==='AccountValidation')
  .sort((a,b)=>(a.sortOrder??0)-(b.sortOrder??0))

async function validatedTarget(item){
  if(item.fulfillmentMethod!=='AUTO_ID')return null
  if(item.gameAccountValidationId &&
      Date.parse(item.validationExpiresAt||'')>Date.now())return item.gameAccountValidationId
  const product=await getCatalogProduct(item.productSlug)
  if(product.id!==item.productId || product.fulfillmentMethod!=='AUTO_ID')
    throw Error(item.productName+': product/provider berubah.')
  const definitions=fieldsFor(product)
  if(!definitions.length||definitions.length>2||definitions.some(f=>f.isSensitive))
    throw Error(item.productName+': format tujuan perlu pemeriksaan. Keranjang guest tetap aman.')
  const payload={}
  for(const [i,field] of definitions.entries()){
    const value=String((i===0?item.accountFields?.userId:item.accountFields?.zone)||'').trim()
    if(field.isRequired&&!value)throw Error(item.productName+': isi '+field.label+' sebelum sinkronisasi.')
    if(value.length>(field.maxLength||200))throw Error(item.productName+': '+field.label+' terlalu panjang.')
    if(value)payload[field.key]=value
  }
  const v=await verifyTopUpIdDestination(product.id,payload)
  if(v.status!=='Verified'||!v.validationId)throw Error(item.productName+': tujuan belum terverifikasi.')
  return v.validationId
}

async function toServerItems(rows){
  const loginSku=new Map()
  for(const x of rows){
    if(x.fulfillmentMethod!=='MANUAL_LOGIN')continue
    const id=String(x.variantId)
    if(!loginSku.has(id))loginSku.set(id,new Set())
    loginSku.get(id).add(x.accountKey||'checkout-required')
  }
  if([...loginSku.values()].some(s=>s.size>1))
    throw Error('Via Login dengan dua akun berbeda tidak bisa digabung otomatis. Periksa draft guest.')
  const out=[]
  for(const item of rows){
    if(!item.variantId||!item.productId||!item.productSlug)
      throw Error('SKU guest tidak lengkap. Data guest tidak dihapus.')
    out.push({
      productVariantId:item.variantId,
      quantity:Math.max(1,Math.min(99,Number(item.quantity)||1)),
      gameAccountValidationId:await validatedTarget(item),
    })
  }
  return out
}

function adopt(reply,token){
  if(token!==activeToken())return
  setAuthenticatedCart(reply.items.map(serverLineToCart),rows=>persist(rows,token))
  notify('synced')
}

function persist(snapshot,token){
  const version=++writing
  notify('saving')
  writeQueue=writeQueue.catch(()=>{}).then(async()=>{
    if(token!==activeToken())return
    try{
      await putServerCart(token,await toServerItems(snapshot))
      if(token===activeToken()&&version===writing)
        adopt(await getServerCart(token),token)
    }catch(e){
      if(token!==activeToken())return
      if(version===writing){
        try{adopt(await getServerCart(token),token)}catch{/* retain sync error */}
        notify('error',(e.message||'Perubahan cart gagal')+'. Periksa cart sebelum checkout.')
      }
    }
  })
  return writeQueue
}
export async function activateCustomerCart(){
  const token=activeToken()
  if(!token){leaveAuthenticatedCart();notify('guest');return}
  if(boot)return boot
  boot=(async()=>{
    notify('loading')
    const guest=readGuestCart()
    if(guest.length){
      await mergeServerCart(token,await toServerItems(guest))
      // Data guest only cleared after successful atomic merge response.
      clearGuestCart()
    }
    adopt(await getServerCart(token),token)
  })().catch(e=>{
    if(token===activeToken()){
      leaveAuthenticatedCart()
      notify('error',(e.message||'Sinkronisasi gagal')+'. Draft guest belum dihapus.')
    }
    throw e
  }).finally(()=>{boot=null})
  return boot
}
export async function refreshCustomerCart(){
  const token=activeToken()
  if(!token)return
  if(status.state==='saving')return
  if(!isAuthenticatedCart())return activateCustomerCart()
  try{adopt(await getServerCart(token),token)}
  catch(e){notify('error',e.message||'Gagal memuat cart server.')}
}
