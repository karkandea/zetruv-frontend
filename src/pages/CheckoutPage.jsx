import { formatCopy } from '../services/storefrontCopy'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Info, LoaderCircle, Pencil, RefreshCw, ShieldAlert, ShoppingCart, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import { readCart, onCartChange, updateCartAccount, acceptCartPriceChanges, removeCartItem } from '../services/cartService'
import { getCatalogProduct } from '../services/catalogService'
import { getDigitalPricing } from '../services/digitalCartPricing'
import {
  checkoutFields, normalizeIndonesianWhatsApp, validateCheckoutAccount,
  validateCheckoutField, matchingAccountSource, currentCatalogDifferences, paymentSelectionAllowed,
  priceChangeExplanation,
} from '../services/digitalCheckoutRules'
import {
  getCheckoutPaymentOptions, previewCheckoutVoucher, authenticateCheckoutCustomer,
  createVerifiedCheckoutOrder, recoverVerifiedCheckoutOrder, startOrderPayment, getOrderPaymentStatus,
} from '../services/checkoutGatewayService'
import { checkoutAssets } from '../data/checkoutAssets'
import { checkoutActionHint, viaLoginServiceStatus } from '../services/digitalServiceAvailability'
import { getManualLoginReadiness, verifyTopUpIdDestination } from '../services/digitalPurchaseCapabilities'
import { storePaymentContext } from '../services/paymentSession'
import { readCustomerSession, setCustomerSession, activateCustomerCart, getCartSyncStatus, CUSTOMER_EVENT, CART_SYNC_EVENT } from '../services/customerCartSync'
import { readCheckoutAttempt, preserveCheckoutAttempt, clearCheckoutAttempt } from '../services/checkoutAttempt'
import '../styles/digital-commerce.css'
import '../styles/digital-checkout-improvements.css'
import '../styles/digital-checkout-polish.css'
import '../styles/digital-account-verification.css'

const rupiah = (v = 0) => `Rp${new Intl.NumberFormat('id-ID').format(Number(v) || 0)}`
// Backend readiness is authoritative; no independent storefront permission flag.
const paymentDisplay = (copy) => [
  {code: 'QRIS', name:'QRIS', description:copy.payByScanningTheQrCode, icon:checkoutAssets.qris},
  {code: 'BCA_VA', name:copy.virtualAccount, description:copy.bankTransfer, icon:checkoutAssets.virtualAccount},
  {code: 'GOPAY', name:'E-Wallet', description:copy.payWithADigitalWallet, icon:checkoutAssets.ewallet},
]
class CheckoutError extends Error {}

const methodLabel = (item, copy) => item.productKind === 'Joki' ? copy.gameBoosting : ({
  AUTO_ID:copy.topUpById, MANUAL_LOGIN:copy.topUpByLogin,
  VOUCHER_CODE:copy.gameVouchers, JOKI_MANUAL:copy.gameBoosting,
}[item.fulfillmentMethod] || (item.productKind === 'GameAccount' ? copy.gameAccount : copy.digitalProduct))

const renderLoginField = (field, value, onChange, visible, toggle, disabled, error, copy) => (
  <div className="checkout-account-field" key={field.key}>
    <label htmlFor={`checkout-${field.key}-${field.formId}`}>{field.label}{field.required ? ' *' : ` (${copy.optional})`}</label>
    {field.type === 'Select' ? (
      <select id={`checkout-${field.key}-${field.formId}`} value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)}>
        <option value="">{formatCopy(copy.select2, { field: field.label })}</option>
        {field.options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    ) : (
      <div className="checkout-account-input-wrap">
        <input id={`checkout-${field.key}-${field.formId}`}
          type={field.type === 'Password' && !visible ? 'password' : 'text'}
          inputMode={field.type === 'Number' ? 'numeric' : 'text'}
          maxLength={field.maxLength}
          placeholder={field.placeholder || field.label}
          autoComplete="off"
          value={value || ''}
          disabled={disabled} aria-invalid={Boolean(error)}
          onChange={e => onChange(e.target.value)} />
        {field.type === 'Password' && (
          <button type="button" disabled={disabled} aria-label={visible ? copy.hidePassword : copy.showPassword} onClick={toggle}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    )}
    {error ? <small className="checkout-field-error" role="alert">{error}</small>
      : field.helpText && field.type !== 'Password' ? <small className="checkout-field-help">{field.helpText}</small> : null}
  </div>
)

function CheckoutProduct({
  item, product, values, onValue, sharingWith, onShare, options, onIdSave, priceProblem,
  productProblem, showErrors, credentialAllowed, serviceStatus, onRemove,
  idValidation, onVerifyId, verifyingId,
}) {
  const copy = useStorefrontCopy()
  const [edit, setEdit] = useState(false)
  const [idValues, setIdValues] = useState({userId:item.accountFields?.userId || '',zone:item.accountFields?.zone || ''})
  const [passwordVisible, setPasswordVisible] = useState({})
  const isLogin = item.fulfillmentMethod === 'MANUAL_LOGIN'
  const isId = item.fulfillmentMethod === 'AUTO_ID'
  const fields = checkoutFields(product, isLogin ? 'LoginCredential' : 'AccountValidation')
  const effectiveValues = values || {}
  const validation = validateCheckoutAccount(fields, isId ? idValues : effectiveValues, copy)
  const sibling = options?.find(v => v.cartKey === sharingWith)
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const lineTotal = quantity * Number(item.unitPrice || 0)
  const fallback = '/assets/search/category-topup.webp'
  return (
    <article id={`checkout-item-${item.cartKey}`} className="digital-checkout-item checkout-product" aria-label={`${item.productName} ${item.variantName}`}>
      <div className="checkout-product__row">
        <img className="digital-checkout-item__thumb" src={item.thumbnailUrl || fallback} alt=""
          onError={e => { if(e.currentTarget.dataset.fail !== '1'){e.currentTarget.dataset.fail='1';e.currentTarget.src=fallback} }} />
        <div className="checkout-product__identity">
          <span className="digital-product-method">{methodLabel(item, copy)}</span>
          <strong>{item.productKind === 'Joki' ? item.productName : item.gameName || item.productName}</strong>
          <span>{item.variantName}</span>
          <small>{copy.unitPrice2} {rupiah(item.unitPrice)}{quantity > 1 ? ` · ${quantity} item` : ''}</small>
        </div>
        <strong className="checkout-product__price">{rupiah(lineTotal)}<small>{copy.subtotal} {quantity > 1 ? `(${quantity} item)` : ''}</small></strong>
      </div>

      {isId && (
        <div className="checkout-product__destination">
          <div className="checkout-product__destination-head">
            <strong>{copy.topUpDestinationAccount}</strong>
            <button type="button" onClick={() => {setIdValues({userId:item.accountFields?.userId||'',zone:item.accountFields?.zone||''});setEdit(x=>!x)}}>
              <Pencil size={15} aria-hidden="true"/> {edit ? copy.cancel : copy.editAccount}
            </button>
          </div>
          {edit ? (
            <div className="checkout-product__id-edit">
              {fields.map(f => <div className="checkout-account-field" key={f.key}>
                <label>{f.label}{f.required?' *':''}
                  <input type="text" value={idValues[f.slot] || ''} maxLength={f.maxLength}
                    placeholder={f.placeholder || f.label}
                    inputMode={f.type === 'Number' ? 'numeric' : 'text'}
                    onChange={e => setIdValues(v=>({...v,[f.slot]:e.target.value}))} />
                </label>
                {(showErrors || idValues[f.slot]) && validateCheckoutField(f,idValues[f.slot],copy) &&
                  <small className="checkout-field-error">{validateCheckoutField(f,idValues[f.slot],copy)}</small>}
              </div>)}
              <button type="button" className="checkout-product__save" disabled={Boolean(validation)}
                onClick={()=>{onIdSave(item,idValues,fields);setEdit(false)}}>{copy.saveAccountDetails}</button>
            </div>
          ) : (<>
            <p>{fields.map(f=>`${f.label}: ${item.accountFields?.[f.slot] || '—'}`).join(' · ')}</p>
            {product?.requiresGameAccountValidation && (
              <div className="checkout-product__verify">
                {idValidation?.validationId && Date.parse(idValidation.expiresAt)>Date.now()
                  ? <span className="checkout-product__verified"><CheckCircle2 size={15}/> {copy.destinationAccountVerified}</span>
                  : <button type="button" disabled={verifyingId || !product}
                      onClick={()=>onVerifyId(item,fields)}>
                      {verifyingId ? <LoaderCircle className="checkout-spinner" size={15}/> : <CheckCircle2 size={15}/>}
                      {verifyingId ? copy.checkingAccount : copy.verifyDestinationAccount}
                    </button>}
              </div>
            )}
          </>)}
        </div>
      )}

      {isLogin && (
        <div className="checkout-product__account">
          <div className="checkout-product__account-title">
            <strong>{copy.gameAccountForThisPackage}</strong>
            <span>{copy.useYourGameAccountDetailsHere}</span>
          </div>
          {!serviceStatus?.available ? (
            <div className="checkout-service-unavailable" role="status">
              <div className="checkout-service-unavailable__heading">
                <AlertCircle size={18} aria-hidden="true" />
                <strong>{copy.serviceTemporarilyUnavailable}</strong>
              </div>
              <p>{copy.topUpByLoginIsUnavailableFor}</p>
              <div className="checkout-service-unavailable__actions">
                <button type="button" onClick={() => onRemove(item)}><X size={15} aria-hidden="true" /> {copy.removeThisProduct}</button>
                <a href="/search">{copy.browseOtherProducts2} <ArrowRight size={14} aria-hidden="true" /></a>
              </div>
            </div>
          ) : <>
          {options?.length > 0 && (
            <label className="checkout-product__share">
              <input type="checkbox" checked={Boolean(sibling)}
                onChange={e => onShare(item.cartKey,e.target.checked ? options[0].cartKey : '')} />
              {copy.useTheSameGameAccountAs} {options[0].variantName}
            </label>
          )}
          {sibling ? (
            <p className="checkout-product__shared">{copy.usingAccountDetailsFrom} {sibling.variantName} {copy.above}</p>
          ) : <>
            {!credentialAllowed && (
              <p className="checkout-product__security"><ShieldAlert size={15} aria-hidden="true"/>
                {copy.gameLoginDetailsCanTBeCollected}
              </p>
            )}
            <div className="checkout-product__fields">
              {fields.length ? fields.map(f => {
                const error = (showErrors || Object.values(effectiveValues).some(v => String(v || '').length > 0)) ? validateCheckoutField(f,effectiveValues[f.slot],copy) : ''
                return renderLoginField({...f,formId:item.cartKey},effectiveValues[f.slot],
                  v=>onValue(item.cartKey,f.slot,v),Boolean(passwordVisible[f.key]),
                  ()=>setPasswordVisible(old=>({...old,[f.key]:!old[f.key]})),
                  !credentialAllowed,error,copy)
              }) : <p className="checkout-field-error">{copy.accountRequirementsAreCurrentlyUnavailable}</p>}
            </div>
          </>}
          </>}
        </div>
      )}
      {priceProblem && <p className="checkout-product__problem"><AlertCircle size={15}/>{priceProblem}</p>}
      {productProblem && <p className="checkout-product__problem"><AlertCircle size={15}/>{productProblem}</p>}
    </article>
  )
}

function CustomerLoginDialog({ onClose, onSuccess }) {
  const copy = useStorefrontCopy()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  return <div className="checkout-auth-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <form className="checkout-auth-modal" role="dialog" aria-modal="true" aria-label={copy.logInToZetruv}
      onSubmit={async e=>{
        e.preventDefault();if(busy)return;setBusy(true);setError('')
        try { const response=await authenticateCheckoutCustomer(email,password)
          if(!response?.accessToken)throw Error(copy.weCouldnTStartYourSession2)
          onSuccess(response)
        } catch(e){setError(e.status===401?copy.yourZetruvEmailOrPasswordIsIncorrect2:copy.weCouldnTLogYouInPlease)} finally{setBusy(false);setPassword('')}
      }}>
      <div className="checkout-auth-modal__head"><strong>{copy.logInToYourZetruvAccount}</strong><button type="button" aria-label={copy.close} onClick={onClose}><X size={18}/></button></div>
      <p>{copy.logInWithYourVerifiedZetruvAccount}</p>
      <label>{copy.zetruvEmail}<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>{copy.zetruvPassword}<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <p role="alert" className="checkout-field-error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? copy.verifying : copy.loginAndContinue}</button>
    </form>
  </div>
}

export default function CheckoutPage() {
  const copy = useStorefrontCopy()
  const [items,setItems]=useState(readCart)
  const [catalog,setCatalog]=useState({})
  const [serviceReadiness,setServiceReadiness]=useState({})
  const [idValidations,setIdValidations]=useState({})
  const [verifyingId,setVerifyingId]=useState(null)
  const [catalogState,setCatalogState]=useState('loading')
  const [readiness,setReadiness]=useState(null)
  const [methodsState,setMethodsState]=useState('loading')
  const [method,setMethod]=useState('')
  const [phone,setPhone]=useState('')
  const [phoneTouched,setPhoneTouched]=useState(false)
  const [values,setValues]=useState({})
  const [sharing,setSharing]=useState({})
  const [voucherInput,setVoucherInput]=useState('')
  const [voucher,setVoucher]=useState(null)
  const [voucherState,setVoucherState]=useState('idle')
  const [voucherMessage,setVoucherMessage]=useState('')
  const [formTouched,setFormTouched]=useState(false)
  const [error,setError]=useState('')
  const [order,setOrder]=useState(null)
  const [payment,setPayment]=useState(null)
  const [paymentState,setPaymentState]=useState('idle')
  const [authDialog,setAuthDialog]=useState(false)
  const [customer,setCustomer]=useState(()=>{
    const session=readCustomerSession()
    return session?{accessToken:session.accessToken,customer:session.customer}:null
  })
  const [cartSync,setCartSync]=useState(getCartSyncStatus)
  const [processing,setProcessing]=useState(false)
  const [pendingAttempt,setPendingAttempt]=useState(()=>readCheckoutAttempt())
  const [authPurpose,setAuthPurpose]=useState('pay')
  const attempt=useRef(null)
  const processingRef=useRef(false)

  useEffect(()=>onCartChange(newItems=>{
    setItems(newItems)
    setIdValidations(Object.fromEntries(newItems.filter(x=>x.gameAccountValidationId)
      .map(x=>[x.cartKey,{validationId:x.gameAccountValidationId,expiresAt:x.validationExpiresAt}])))
    attempt.current=null
    setVoucher(null)
    setVoucherState('idle')
    setOrder(null)
    setPayment(null)
  }),[])

  useEffect(()=>{
    const handler=()=>{
      const session=readCustomerSession()
      setCustomer(session?{accessToken:session.accessToken,customer:session.customer}:null)
    }
    window.addEventListener(CUSTOMER_EVENT,handler)
    return ()=>window.removeEventListener(CUSTOMER_EVENT,handler)
  },[])
  useEffect(()=>{
    const handler=e=>setCartSync(e.detail||getCartSyncStatus())
    window.addEventListener(CART_SYNC_EVENT,handler)
    return ()=>window.removeEventListener(CART_SYNC_EVENT,handler)
  },[])

  const slugs=useMemo(()=>[...new Set(items.map(i=>i.productSlug).filter(Boolean))].sort().join('|'),[items])
  const refreshCatalog=useCallback(async()=>{
    if(!slugs){setCatalog({});setCatalogState('ready');return {}}
    setCatalogState('loading')
    try{
      const rows=await Promise.all(slugs.split('|').map(async slug=>[slug,await getCatalogProduct(slug)]))
      const obj=Object.fromEntries(rows)
      const readyEntries=await Promise.all(rows.filter(([,product])=>product.fulfillmentMethod==='MANUAL_LOGIN')
        .map(async ([slug,product])=>[slug,await getManualLoginReadiness(product.id).catch(()=>null)]))
      setServiceReadiness(Object.fromEntries(readyEntries))
      setCatalog(obj);setCatalogState('ready');return obj
    }catch{setCatalogState('error');return null}
  },[slugs])

  useEffect(()=>{let active=true;const fetchData=async()=>{if(!active)return;await refreshCatalog()};fetchData();return ()=>{active=false}},[refreshCatalog])
  const refreshMethods=useCallback(async()=>{
    setMethodsState('loading')
    try{
      const data=await getCheckoutPaymentOptions()
      setReadiness(data);setMethodsState('ready')
      setMethod(current=>data.availableMethods?.some(m=>m.code===current)?current:'')
      return data
    }catch{setReadiness(null);setMethodsState('error');setMethod('');return null}
  },[])
  useEffect(()=>{refreshMethods()},[refreshMethods])

  const phoneNormalized=normalizeIndonesianWhatsApp(phone)
  const {changes,problems}=useMemo(()=>currentCatalogDifferences(items,catalog,copy),[items,catalog,copy])
  const linePricing=useMemo(()=>getDigitalPricing(items),[items])
  const voucherDiscount=Number(voucher?.discountAmount || 0)
  const selectedPaymentOption=readiness?.availableMethods?.find(option=>option.code===method)
  const paymentFee=selectedPaymentOption?.paymentFee
  const total=Math.max(0,linePricing.total-voucherDiscount+(paymentFee??0))
  const methodEnabled=paymentSelectionAllowed(readiness,method)
  const allowedCredentials=window.isSecureContext
  const blockedLoginItems=useMemo(()=>items.filter(item=>
    item.fulfillmentMethod==='MANUAL_LOGIN' &&
    !viaLoginServiceStatus(catalog[item.productSlug],item,serviceReadiness[item.productSlug]).available
  ),[items,catalog])

  const checkoutIssues=useMemo(()=>{
    const result=[]
    if(!items.length)result.push(copy.yourCartIsEmpty)
    if(customer && cartSync.state!=='synced')
      result.push(copy.yourAccountCartHasnTSyncedReview)
    if(!phoneNormalized)result.push(copy.enterAValidIndonesianWhatsappNumber)
    if(catalogState!=='ready')result.push(copy.theProductCatalogCouldnTBeVerified)
    if(problems.length)result.push(problems[0].message)
    if(changes.length)result.push(copy.aProductPriceChangedConfirmTheLatest)
    for(const item of items){
      const product=catalog[item.productSlug]
      if(item.fulfillmentMethod==='AUTO_ID'){
        const fields=checkoutFields(product,'AccountValidation')
        const message=validateCheckoutAccount(fields,item.accountFields,copy)
        if(message)result.push(`${item.gameName||item.productName}: ${message}`)
        if(!product?.requiresGameAccountValidation)
          result.push(`${item.gameName||item.productName}: ${copy.destinationVerificationIsnTSetUpYet}`)
        else if(!idValidations[item.cartKey]?.validationId ||
          Date.parse(idValidations[item.cartKey]?.expiresAt||'')<=Date.now())
          result.push(`${item.gameName||item.productName}: ${copy.verifyTheDestinationAccountBeforePaying}`)
      }
      if(item.fulfillmentMethod==='MANUAL_LOGIN'){
        if(!viaLoginServiceStatus(product,item,serviceReadiness[item.productSlug]).available){
          result.push(`${item.gameName||item.productName}: ${copy.thisServiceIsTemporarilyUnavailable}`)
        }else{
          const fields=checkoutFields(product,'LoginCredential')
          const key=matchingAccountSource(items,item,sharing)
          const message=validateCheckoutAccount(fields,values[key],copy)
          if(message)result.push(`${item.gameName||item.productName}: ${message}`)
          if(!allowedCredentials)result.push(copy.gameAccountInformationCanTBeEntered)
        }
      }
      if(item.requiresGameAccountValidation)result.push(`${item.productName}: ${copy.accountVerificationIsRequired}`)
    }
    if(voucherState==='checking')result.push(copy.checkingTheVoucher)
    if(methodsState!=='ready' || !readiness?.canAcceptLivePayments)result.push(copy.paymentMethodsAreCurrentlyUnavailable)
    if(import.meta.env.MODE==='dev' && readiness?.canAcceptLivePayments && !readiness?.isSandbox)
      result.push(copy.onlySandboxPaymentMethodsAreAvailableIn)
    if(!methodEnabled)result.push(copy.chooseAnAvailablePaymentMethod)
    // Payment-options currently declares channel availability but contains
    // no authoritative channel fee. Never enable a payable method with an
    // undisclosed potential surcharge.
    if(methodEnabled && readiness?.canAcceptLivePayments && paymentFee==null)
      result.push(copy.thePaymentFeeCouldnTBeConfirmed)
    if(total<=0)result.push(copy.thePaymentTotalMustBeGreaterThan)
    return [...new Set(result)]
  },[items,phoneNormalized,catalog,catalogState,problems,changes,sharing,values,allowedCredentials,
      voucherState,methodsState,readiness,methodEnabled,paymentFee,total,idValidations,serviceReadiness,customer,cartSync,copy])
  const valid=checkoutIssues.length===0
  const allCreds=items.filter(i=>i.fulfillmentMethod==='MANUAL_LOGIN')
  const firstAccountIssue=items.map(item=>{
    if(item.fulfillmentMethod==='MANUAL_LOGIN' && !viaLoginServiceStatus(catalog[item.productSlug],item,serviceReadiness[item.productSlug]).available) return null
    if(!['MANUAL_LOGIN','AUTO_ID'].includes(item.fulfillmentMethod)) return null
    const kind=item.fulfillmentMethod==='AUTO_ID'?'AccountValidation':'LoginCredential'
    const fields=checkoutFields(catalog[item.productSlug],kind)
    const sharedKey=matchingAccountSource(items,item,sharing)
    const reason=validateCheckoutAccount(fields,
      kind==='AccountValidation'?item.accountFields:values[sharedKey],copy)
    if(reason)return {cartKey:item.cartKey,message:`${item.gameName||item.productName}: ${reason}`}
    if(kind==='AccountValidation' && catalog[item.productSlug]?.requiresGameAccountValidation &&
      !idValidations[item.cartKey]?.validationId)
      return {cartKey:item.cartKey,message:formatCopy(copy.verifyTheDestinationAccountForBeforeContinuing, { product: item.gameName || item.productName })}
    return null
  }).find(Boolean)
  const guidance=checkoutActionHint({
    items, blocked:blockedLoginItems, phoneValid:Boolean(phoneNormalized),
    phoneTouched,formTouched,accountProblem:firstAccountIssue,
    catalogProblem:catalogState==='error'||problems.length>0,
    methodLoading:methodsState==='loading',
    methodsReady:Boolean(readiness?.canAcceptLivePayments),
    selectedMethodValid:methodEnabled,
    priceChanged:changes.length>0,
  }, copy)
  const displayMethods = paymentDisplay(copy)
  const showLiveMethods=readiness?.availableMethods?.length>0

  const applyVoucher=async()=>{
    const code=voucherInput.trim().toUpperCase()
    if(!code||voucherState==='checking')return
    setVoucherState('checking');setVoucherMessage('');setVoucher(null)
    try{
      const preview=await previewCheckoutVoucher({code,items,phone:phoneNormalized,email:customer?.email})
      if(!preview?.discountAmount || Number(preview.discountAmount)<=0)throw Error(copy.thisVoucherDoesnTApplyToThis)
      setVoucher({code:preview.code || code,discountAmount:Number(preview.discountAmount)})
      setVoucherState('applied')
      setVoucherMessage(formatCopy(copy.voucherApplied, { amount: rupiah(preview.discountAmount) }))
    }catch(e){
      const reason=String(copy.theVoucherCouldnTBeChecked)
      const lower=reason.toLowerCase()
      setVoucherState(lower.includes('expir')?'expired':
        lower.includes('eligib')||lower.includes('minimum')?'not-applicable':
        lower.includes('invalid')||lower.includes('inactive')?'invalid':'error')
      setVoucherMessage(lower.includes('expir')?copy.thisVoucherHasExpired:
        lower.includes('eligib')||lower.includes('minimum')?copy.thisVoucherDoesnTApplyToThis2:
        lower.includes('invalid')||lower.includes('inactive')?copy.theVoucherCodeIsInvalidOrInactive:
        copy.weCouldnTCheckTheVoucherPlease)
    }
  }
  const confirmPriceChange=()=>{
    acceptCartPriceChanges(changes)
    setError('')
    setVoucher(null);setVoucherState('idle')
  }
  const removeBlockedItem=(item)=>{
    removeCartItem(item.cartKey)
    setError('')
  }
  const jumpToIssue=()=>{
    if(guidance?.type==='phone'){
      document.getElementById('checkout-phone')?.focus()
    }else if(guidance?.cartKey){
      document.getElementById(`checkout-item-${guidance.cartKey}`)?.scrollIntoView({behavior:'smooth',block:'center'})
    }
  }
  const verifyId=async(item)=>{
    if(verifyingId)return
    setVerifyingId(item.cartKey);setError('')
    try{
      const product=catalog[item.productSlug]
      const fields=checkoutFields(product,'AccountValidation')
      const validationError=validateCheckoutAccount(fields,item.accountFields,copy)
      if(validationError)throw new Error(validationError)
      const payload=Object.fromEntries(fields.map(f=>[f.key,String(item.accountFields?.[f.slot]||'').trim()]))
      const res=await verifyTopUpIdDestination(product.id,payload)
      if(!res?.validationId || res.status!=='Verified')throw new Error(copy.theAccountCouldnTBeVerified)
      setIdValidations(prev=>({...prev,[item.cartKey]:{validationId:res.validationId,expiresAt:res.expiresAt}}))
    }catch(e){setError(copy.weCouldnTVerifyTheDestinationAccount)}finally{setVerifyingId(null)}
  }
  const saveId=(item,values,fields)=>{
    updateCartAccount(item.cartKey,values,{first:fields[0]?.label})
    setIdValidations({})
    setError('')
  }
  const performPay=async(token,verifiedCustomer)=>{
    if(processingRef.current)return
    processingRef.current=true;setProcessing(true);setError('');setFormTouched(true)
    try{
      // Server readiness and catalog refreshed before ANY mutation. No order
      // created while the method or item price has changed.
      const freshMethods=await refreshMethods()
      const freshCatalog=await refreshCatalog()
      if(!freshMethods || !paymentSelectionAllowed(freshMethods,method))throw new CheckoutError(copy.thisPaymentMethodIsNoLongerAvailable)
      if(import.meta.env.MODE==='dev' && !freshMethods.isSandbox)throw new CheckoutError(copy.onlySandboxGatewaysCanBeUsedIn)
      if(!freshCatalog)throw new CheckoutError(copy.weCouldnTVerifyTheCatalog)
      const fresh=currentCatalogDifferences(items,freshCatalog,copy)
      if(fresh.changes.length || fresh.problems.length)throw new CheckoutError(copy.pricingOrAvailabilityChangedReviewTheChanges)
      if(voucher){
        const preview=await previewCheckoutVoucher({code:voucher.code,items,phone:phoneNormalized,email:verifiedCustomer?.email})
        if(Number(preview?.discountAmount)!==voucher.discountAmount){
          setVoucherState('error')
          setVoucher(null)
          throw new CheckoutError(copy.theVoucherAmountChangedApplyItAgain)
        }
      }
      if(!valid)throw new CheckoutError(copy.completeAllOrderDetailsFirst)
      const payload={
        customerName:verifiedCustomer?.name || null,
        customerEmail:verifiedCustomer?.email || null,
        customerPhone:phoneNormalized,
        voucherCode:voucher?.code || null,
        items:items.map(item=>{
          const data={productVariantId:item.variantId,quantity:Number(item.quantity||1),expectedUnitPrice:Number(item.unitPrice)}
          if(item.fulfillmentMethod==='AUTO_ID')
            data.gameAccountValidationId=idValidations[item.cartKey]?.validationId
          if(item.fulfillmentMethod==='MANUAL_LOGIN'){
            const key=matchingAccountSource(items,item,sharing)
            data.loginCredentials=Object.fromEntries(
              checkoutFields(freshCatalog[item.productSlug],'LoginCredential')
                .map(f=>[f.key,String(values[key]?.[f.slot]||'').trim()]))
          }
          return data
        }),
      }
      // Retry the exact same body/key after an uncertain network failure.
      const fingerprint=JSON.stringify(payload)
      if(!attempt.current || attempt.current.fingerprint!==fingerprint){
        attempt.current={fingerprint,key:window.crypto.randomUUID(),body:payload}
      }
      if(pendingAttempt && pendingAttempt.key!==attempt.current.key)
        throw new CheckoutError(copy.recoverYourPreviousOrderBeforePlacingA)
      // Persist only opaque UUID and selected method, never credentials or body.
      setPendingAttempt(preserveCheckoutAttempt(attempt.current.key, method))
      const created=order || await createVerifiedCheckoutOrder(attempt.current.body,token,attempt.current.key)
      setOrder(created)
      // Preserve only backend-issued order metadata and its short-lived access token.
      // No game credentials, login password, or checkout payload in browser storage.
      // Persist BEFORE contacting the payment provider so an uncertain network
      // response can be recovered using GET without issuing another payment.
      storePaymentContext(created, method)
      clearCheckoutAttempt();setPendingAttempt(null)
      setPaymentState('starting')
      try {
        const session=await startOrderPayment(created,method)
        setPayment(session)
        setPaymentState('pending') // Only backend reconciliation can confirm Paid.
      } catch {
        // Payment may have been created before the network error. The Payment
        // page performs a read-only status lookup and offers explicit retry.
      }
      window.location.assign('/payment')
    }catch(e){
      if(e.code==='PRICE_CHANGED' && Array.isArray(e.priceChanges)){
        const updates=e.priceChanges.map(change=>{
          const item=items.find(x=>x.variantId===change.productVariantId)
          return item && {key:item.cartKey,variantName:item.variantName,oldPrice:change.expectedUnitPrice,newPrice:change.currentUnitPrice,regularPrice:item.regularPrice}
        }).filter(Boolean)
        // Server price is authoritative. Never silently accept it or reuse an old order quote.
        await refreshCatalog()
        setError(updates.length
          ? `${priceChangeExplanation(updates[0], copy)} ${copy.reviewTheChangesAndAcceptTheLatest}`
          : copy.pricingChangedReviewAndAcceptTheNew)
      } else setError(e instanceof CheckoutError ? e.message : copy.weCouldnTStartThePaymentPlease)
      if([400,409,422].includes(e.status)&&!order){clearCheckoutAttempt();setPendingAttempt(null)}
      setPaymentState('error')
    }finally{processingRef.current=false;setProcessing(false)}
  }
  const handlePay=()=>{
    if(pendingAttempt && (!attempt.current || pendingAttempt.key!==attempt.current.key)){
      setError(copy.thePreviousCheckoutHasnTBeenConfirmed);return
    }
    setFormTouched(true)
    if(!valid||processingRef.current)return
    if(!customer?.accessToken){setAuthPurpose('pay');setAuthDialog(true);return}
    performPay(customer.accessToken,customer.customer)
  }
  const recoverInterruptedOrder=async(token)=>{
    const saved=readCheckoutAttempt()
    if(!saved){setPendingAttempt(null);return}
    setProcessing(true);setError('')
    try{
      const existing=await recoverVerifiedCheckoutOrder(token,saved.key)
      storePaymentContext(existing,saved.methodCode)
      clearCheckoutAttempt();setPendingAttempt(null)
      window.location.assign('/payment')
    }catch(e){
      if(e.status===404){
        setError(copy.theOrderWasnTFoundOrIs)
      }else setError(copy.weCouldnTConfirmThePreviousOrder)
    }finally{setProcessing(false)}
  }
  const checkPayment=async()=>{
    if(!order)return
    setProcessing(true);setError('')
    try{
      const state=await getOrderPaymentStatus(order)
      setPayment(state)
      setPaymentState(String(state.state||'pending').toLowerCase())
    }catch(e){setError(copy.weCouldnTCheckThePaymentStatus)}
    finally{setProcessing(false)}
  }

  return <div className="digital-shell">
    <Navbar variant="default"/>
    <main className="digital-checkout-page digital-container">
      <header className="digital-checkout-heading">
        <h1>{copy.digitalCheckout}</h1><p>{copy.reviewTheDestinationAccountPaymentMethodAnd}</p>
      </header>
      {pendingAttempt && <section role="alert" className="checkout-price-change" style={{marginBottom:20}}>
        <AlertCircle size={20}/><div><strong>{copy.previousCheckoutIsUnconfirmed}</strong>
          <p>{copy.thePageMayHaveReloadedBeforeThe}</p>
          <button type="button" disabled={processing} onClick={()=>{
            if(customer?.accessToken)recoverInterruptedOrder(customer.accessToken)
            else {setAuthPurpose('recover');setAuthDialog(true)}
          }}>{processing?'Memeriksa...':copy.recoverPreviousOrder}</button>
          <a href="/order-status">{copy.checkOrderOrContactSupport}</a>
        </div></section>}
      <div className="digital-checkout-layout">
        <section className="digital-checkout-order">
          <h2>{copy.orderSummary}</h2>
          <div className="digital-checkout-items">
            {items.length ? items.map(item=>{
              const earlier=allCreds.filter(other=>other.productId===item.productId &&
                items.findIndex(x=>x.cartKey===other.cartKey)<items.findIndex(x=>x.cartKey===item.cartKey))
              const key=matchingAccountSource(items,item,sharing)
              const issue=problems.find(p=>p.key===item.cartKey)?.message
              const price=changes.find(c=>c.key===item.cartKey)
              return <CheckoutProduct key={item.cartKey} item={item} product={catalog[item.productSlug]}
                values={values[key]} onValue={(cartKey,field,value)=>setValues(old=>({...old,[cartKey]:{...old[cartKey],[field]:value}}))}
                sharingWith={sharing[item.cartKey]} options={earlier} onShare={(cartKey,source)=>setSharing(old=>({...old,[cartKey]:source}))}
                onIdSave={saveId} credentialAllowed={allowedCredentials} showErrors={formTouched}
                onVerifyId={verifyId} verifyingId={verifyingId===item.cartKey}
                idValidation={idValidations[item.cartKey]}
                serviceStatus={viaLoginServiceStatus(catalog[item.productSlug],item,serviceReadiness[item.productSlug])} onRemove={removeBlockedItem}
                productProblem={issue} priceProblem={price ? priceChangeExplanation(price, copy) : ''}/>
            }) : <div className="digital-checkout-empty">{copy.yourCartIsEmpty2} <a href="/search">{copy.chooseAProduct}</a></div>}
          </div>
          {changes.length>0 && <div className="checkout-price-change" role="alert">
            <AlertCircle size={17} aria-hidden="true"/>
            <div><strong>{copy.priceChangesNeedApproval}</strong>{changes.map((change) => <p key={change.key}>{priceChangeExplanation(change, copy)}</p>)}<p>{copy.theNewPricesHavenTBeenApplied}</p>
              <button type="button" onClick={confirmPriceChange}>{copy.acceptNewPrices}</button>
            </div>
          </div>}
          <div className="digital-contact-block">
            <h3>{copy.contactInformation}</h3>
            <label htmlFor="checkout-phone">{copy.whatsappNumber}
              <input id="checkout-phone" type="tel" autoComplete="tel" inputMode="tel"
                placeholder={copy.label08xxxxxxxxxxOr62xxxxxxxxxx} value={phone}
                aria-invalid={phoneTouched && !phoneNormalized}
                onBlur={()=>setPhoneTouched(true)}
                onChange={e=>{setPhone(e.target.value);setVoucher(null);setVoucherState('idle')}}/>
            </label>
            {(phoneTouched || formTouched) && !phoneNormalized
              ? <small className="checkout-field-error">{copy.useAValidIndonesianPhoneNumberFor}</small>
              : <small>{copy.weLlUseThisNumberForOrder} {phoneNormalized && `Format: ${phoneNormalized}`}</small>}
          </div>
          <div className="digital-voucher">
            <label htmlFor="checkout-voucher">{copy.voucherCode}</label>
            <div><input id="checkout-voucher" value={voucherInput} maxLength={32}
              placeholder={copy.enterVoucherCode}
              onChange={e=>{setVoucherInput(e.target.value);setVoucher(null);setVoucherState('idle');setVoucherMessage('')}}/>
              <button type="button" disabled={!voucherInput.trim()||voucherState==='checking'||!items.length}
                onClick={applyVoucher}>{voucherState==='checking'?copy.checking:copy.apply}</button></div>
            {voucherState==='applied' ?
              <p className="checkout-voucher-applied" role="status"><CheckCircle2 size={15}/>{voucherMessage}
                <button type="button" onClick={()=>{setVoucher(null);setVoucherInput('');setVoucherState('idle')}}>{copy.remove}</button></p>
              : <small className={['invalid','expired','not-applicable','error'].includes(voucherState)?'checkout-field-error':''} role="status">
                {voucherMessage||copy.checkTheVoucherCodeBeforeStartingPayment}</small>}
          </div>
        </section>
        <aside className="digital-payment-panel">
          <h2>{copy.paymentMethod}</h2>
          {methodsState==='loading' && <p className="checkout-gateway-state"><LoaderCircle className="checkout-spinner" size={16}/>{copy.checkingPaymentMethods}</p>}
          <div className="digital-payment-methods">
            {(showLiveMethods ? readiness.availableMethods.map(m=>({
              ...displayMethods.find(x=>x.code===m.code),...m,
              name:displayMethods.find(x=>x.code===m.code)?.name||m.name||m.code,
              description:displayMethods.find(x=>x.code===m.code)?.description||m.description,
              icon:displayMethods.find(x=>x.code===m.code)?.icon||checkoutAssets.qris,
            })) : displayMethods).map(m=>{
              const enabled=paymentSelectionAllowed(readiness,m.code)
              return <button key={m.code} type="button" disabled={!enabled}
                className={method===m.code?'is-active':''} aria-pressed={method===m.code}
                onClick={()=>{setMethod(m.code);setError('')}}>
                <i><img src={m.icon} alt=""/></i>
                <span><strong>{m.name}</strong><small>{enabled?m.description||copy.paymentMethodAvailable:copy.currentlyUnavailable}</small></span>
                <b aria-hidden="true"/>
              </button>
            })}
          </div>
          {readiness?.isSandbox && <p className="checkout-gateway-state" role="status">
            <Info size={16}/>{copy.testModeThisTransactionUsesNoReal}
          </p>}
          {methodsState==='error'?<p className="checkout-gateway-state checkout-gateway-state--error">{copy.weCouldnTLoadPaymentMethods} <button type="button" onClick={refreshMethods}>{copy.tryAgain3}</button></p>
            : methodsState==='ready' && !readiness?.canAcceptLivePayments?
              <p className="checkout-gateway-state" role="status"><Info size={16}/>{copy.paymentMethodsAreUnavailablePleaseTryAgain}</p>:null}
          <div className="digital-checkout-prices">
            <div><span>{copy.productSubtotal}</span><strong>{rupiah(linePricing.subtotal)}</strong></div>
            <div><span>{copy.productDiscount}</span><strong>−{rupiah(linePricing.discount)}</strong></div>
            {voucher && <div className="is-discount"><span>{copy.voucher} {voucher.code}</span><strong>−{rupiah(voucherDiscount)}</strong></div>}
            <div><span>{copy.serviceFee} <Info size={13} title={copy.theServiceFeeWillAppearWhenAvailable}/></span><strong>—</strong></div>
            <div><span>{copy.paymentFee} <Info size={13} title={copy.theFeeDependsOnThePaymentMethod}/></span>
              <strong>{paymentFee==null?'—':rupiah(paymentFee)}</strong></div>
          </div>
          <hr/>
          <div className="digital-checkout-total"><span>{copy.estimatedTotal}</span><strong>{rupiah(total)}</strong></div>
          <p className="checkout-fee-note">{copy.theFinalTotalWillAppearOnceA}</p>
          {error && <p role="alert" className="digital-checkout-error">{error}</p>}
          <button className="digital-pay-button" type="button" disabled={!valid||processing||Boolean(pendingAttempt && (!attempt.current || pendingAttempt.key!==attempt.current.key))}
            onClick={handlePay}>{processing?<><LoaderCircle className="checkout-spinner" size={16}/>{copy.processing2}</>:copy.payNow}</button>
          {!valid && guidance && <div className="checkout-blockers" role="status" aria-live="polite">
            <strong>{copy.unableToContinue}</strong>
            <span>{guidance.message}</span>
            {guidance.type==='service' && <div className="checkout-blockers__actions">
              <button type="button" onClick={()=>{
                const blocked=blockedLoginItems.find(item=>item.cartKey===guidance.cartKey)
                if(blocked)removeBlockedItem(blocked)
              }}>{copy.removeUnavailablePackages}</button>
              <a href="/search">{copy.browseOtherProducts2}</a>
            </div>}
            {['account','phone'].includes(guidance.type) &&
              <button type="button" className="checkout-blockers__jump" onClick={jumpToIssue}>
                {copy.correctDetails} <ArrowRight size={13} aria-hidden="true" />
              </button>}
            {guidance.type==='price' &&
              <button type="button" className="checkout-blockers__jump"
                onClick={()=>document.querySelector('.checkout-price-change')?.scrollIntoView({behavior:'smooth',block:'center'})}>
                {copy.reviewPriceChanges} <ArrowRight size={13} aria-hidden="true" />
              </button>}
          </div>}
          {order && paymentState!=='idle' && <div className="checkout-payment-status" role="status">
            <strong>{copy.status} {paymentState==='paid'?copy.paymentConfirmed:paymentState==='pending'?copy.awaitingPayment:paymentState==='starting'?copy.contactingThePaymentProvider:paymentState}</strong>
            <p>{copy.orderNumber2} {order.orderNumber}{copy.checkTheStatusBeforePayingAgain}</p>
            {payment?.paymentUrl && paymentState==='pending' && <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">{copy.openPaymentInstructions} <ArrowRight size={14}/></a>}
            <button type="button" disabled={processing} onClick={checkPayment}><RefreshCw size={14}/> {copy.checkStatus}</button>
          </div>}
        </aside>
      </div>
    </main>
    {authDialog && <CustomerLoginDialog onClose={()=>setAuthDialog(false)}
      onSuccess={result=>{
        setCustomerSession(result)
        setCustomer({accessToken:result.accessToken,customer:result.customer})
        setAuthDialog(false)
        // Server cart must be refreshed before a new checkout mutation.
        // No automatic payment on login; the user reconfirms pricing/targets.
        if(authPurpose==='recover')recoverInterruptedOrder(result.accessToken)
        else {
          setError(copy.youReLoggedInOnceYourCart)
          activateCustomerCart().catch(()=>{})
        }
      }}/>}
  </div>
}
