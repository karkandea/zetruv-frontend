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
let currentRevision=null
let conflict=null // RAM only: never persist a private account cart to browser storage.
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
  currentRevision=null
  conflict=null
  writing++ // Invalidate outstanding responses from the previous account.
  leaveAuthenticatedCart() // Never render another customer's lines while authenticating.
  notify('loading')
  window.dispatchEvent(new CustomEvent(CUSTOMER_EVENT,{detail:{authenticated:true}}))
  return value
}
export function logoutCustomer(){
  if(typeof window==='undefined')return
  window.sessionStorage.removeItem(SESSION_KEY)
  boot=null
  currentRevision=null
  conflict=null
  writing++
  leaveAuthenticatedCart()
  notify('guest')
  window.dispatchEvent(new CustomEvent(CUSTOMER_EVENT,{detail:{authenticated:false}}))
}

const auth=token=>({Authorization:'Bearer '+token})
export const getServerCart=token=>apiRequest('/me/cart',{
  method:'GET',cache:'no-store',headers:auth(token)
})
const putServerCart=(token,items,revision)=>apiRequest('/me/cart',{
  method:'PUT',headers:auth(token),body:JSON.stringify({items,revision})
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
  currentRevision=reply.revision
  setAuthenticatedCart(reply.items.map(serverLineToCart),rows=>persist(rows,token))
  notify('synced')
}

function conflictMessage(){
  return 'Keranjang berubah di perangkat lain. Draft lokal tetap tersedia. '+
    'Server: '+(conflict?.serverItems?.length??'?')+' produk, '+
    'draft lokal: '+(conflict?.localSnapshot?.length??'?')+
    ' produk. Pilih versi yang ingin dipakai sebelum checkout.'
}
function persist(snapshot,token){
  const version=++writing
  if(conflict?.token===token){
    conflict.localSnapshot=snapshot // Preserve the newest unsaved user edits in memory.
    notify('conflict',conflictMessage())
    return Promise.resolve()
  }
  notify('saving')
  writeQueue=writeQueue.catch(()=>{}).then(async()=>{
    if(token!==activeToken())return
    try{
      const result=await putServerCart(token,await toServerItems(snapshot),currentRevision)
      if(token===activeToken())currentRevision=result.revision
      if(token===activeToken()&&version===writing)
        adopt(await getServerCart(token),token)
    }catch(e){
      if(token!==activeToken() || version!==writing)return
      // A failed PUT never discards the user's optimistic edit. A 409 means
      // another browser changed the server revision; explicit choice required.
      try{
        const latest=await getServerCart(token)
        if(token!==activeToken())return
        conflict={token,localSnapshot:snapshot,serverRevision:latest.revision,serverItems:latest.items}
        notify('conflict',conflictMessage())
      }catch{
        conflict={token,localSnapshot:snapshot,serverRevision:null,serverItems:null}
        notify('error',(e.message||'Gagal menyimpan keranjang')+
          '. Draft lokal belum dihapus. Coba lagi setelah koneksi pulih.')
      }
    }
  })
  return writeQueue
}

// Explicit, user-initiated conflict resolution. 'server' discards the local
// draft only after the user chooses it; 'local' requires a fresh CAS revision.
// A second concurrent change rejects the overwrite and demands another review.
export async function resolveCartConflict(choice){
  const pending=conflict
  const token=activeToken()
  if(!pending || !token || pending.token!==token)
    throw Error('Tidak ada konflik keranjang untuk sesi ini.')
  if(choice!=='server' && choice!=='local')
    throw Error('Pilih versi keranjang yang ingin dipertahankan.')
  await writeQueue.catch(()=>{})
  const latest=await getServerCart(token)
  if(token!==activeToken())return
  if(choice==='server'){
    conflict=null
    adopt(latest,token)
    return
  }
  if(pending.serverRevision!==latest.revision){
    conflict={...pending,serverRevision:latest.revision,serverItems:latest.items}
    notify('conflict',conflictMessage())
    throw Error('Server berubah lagi. Periksa ulang sebelum mengganti versi server.')
  }
  notify('saving')
  try{
    const items=await toServerItems(pending.localSnapshot)
    await putServerCart(token,items,latest.revision)
    if(token!==activeToken())return
    conflict=null
    adopt(await getServerCart(token),token)
  }catch(e){
    if(token!==activeToken())return
    const fresh=await getServerCart(token).catch(()=>null)
    if(fresh)conflict={...pending,serverRevision:fresh.revision,serverItems:fresh.items}
    notify(fresh?'conflict':'error',fresh?conflictMessage():(e.message||'Gagal menyimpan draft lokal.'))
    throw e
  }
}
export async function activateCustomerCart(){
  const token=activeToken()
  if(!token){leaveAuthenticatedCart();notify('guest');return}
  // Never silently discard a pending local draft during a refresh.
  if(conflict?.token===token){notify('conflict',conflictMessage());return}
  if(boot)return boot
  boot=(async()=>{
    notify('loading')
    const guest=readGuestCart()
    if(guest.length){
      await mergeServerCart(token,await toServerItems(guest))
      // Only this verified session may clear its own guest draft.
      if(token!==activeToken())return
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
  if(['saving','conflict','error'].includes(status.state))return
  if(!isAuthenticatedCart())return activateCustomerCart()
  try{adopt(await getServerCart(token),token)}
  catch(e){notify('error',e.message||'Gagal memuat cart server.')}
}
