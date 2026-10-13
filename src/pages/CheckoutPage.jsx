import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Info, LoaderCircle, Pencil, RefreshCw, ShieldAlert, ShoppingCart, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import { readCart, onCartChange, updateCartAccount, acceptCartPriceChanges } from '../services/cartService'
import { getCatalogProduct } from '../services/catalogService'
import { getDigitalPricing } from '../services/digitalCartPricing'
import {
  checkoutFields, normalizeIndonesianWhatsApp, validateCheckoutAccount,
  validateCheckoutField, matchingAccountSource, currentCatalogDifferences, paymentSelectionAllowed,
} from '../services/digitalCheckoutRules'
import {
  getCheckoutPaymentOptions, previewCheckoutVoucher, authenticateCheckoutCustomer,
  createVerifiedCheckoutOrder, startOrderPayment, getOrderPaymentStatus,
} from '../services/checkoutGatewayService'
import { checkoutAssets } from '../data/checkoutAssets'
import '../styles/digital-commerce.css'
import '../styles/digital-checkout-improvements.css'

const rupiah = (v = 0) => `Rp${new Intl.NumberFormat('id-ID').format(Number(v) || 0)}`
const supportsCredentialCollection = import.meta.env.VITE_GAME_CREDENTIAL_COLLECTION_APPROVED === 'true'
const paymentDisplay = [
  {code: 'QRIS', name:'QRIS', description:'Bayar dengan scan QR', icon:checkoutAssets.qris},
  {code: 'BCA_VA', name:'Virtual Account', description:'Transfer bank', icon:checkoutAssets.virtualAccount},
  {code: 'GOPAY', name:'E-Wallet', description:'Bayar lewat e-wallet', icon:checkoutAssets.ewallet},
]
const methodLabel = (item) => ({
  AUTO_ID:'Top Up Via ID', MANUAL_LOGIN:'Top Up Via Login',
  VOUCHER_CODE:'Voucher Game', JOKI_MANUAL:'Joki Game',
}[item.fulfillmentMethod] || item.productKind || 'Produk Digital')

const renderLoginField = (field, value, onChange, visible, toggle, disabled, error) => (
  <div className="checkout-account-field" key={field.key}>
    <label htmlFor={`checkout-${field.key}-${field.formId}`}>{field.label}{field.required ? ' *' : ' (opsional)'}</label>
    {field.type === 'Select' ? (
      <select id={`checkout-${field.key}-${field.formId}`} value={value || ''} disabled={disabled} onChange={e => onChange(e.target.value)}>
        <option value="">Pilih {field.label}</option>
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
          <button type="button" disabled={disabled} aria-label={visible ? 'Sembunyikan password' : 'Lihat password'} onClick={toggle}>
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
  productProblem, showErrors, credentialAllowed,
}) {
  const [edit, setEdit] = useState(false)
  const [idValues, setIdValues] = useState({userId:item.accountFields?.userId || '',zone:item.accountFields?.zone || ''})
  const [passwordVisible, setPasswordVisible] = useState({})
  const isLogin = item.fulfillmentMethod === 'MANUAL_LOGIN'
  const isId = item.fulfillmentMethod === 'AUTO_ID'
  const fields = checkoutFields(product, isLogin ? 'LoginCredential' : 'AccountValidation')
  const effectiveValues = values || {}
  const validation = validateCheckoutAccount(fields, isId ? idValues : effectiveValues)
  const sibling = options?.find(v => v.cartKey === sharingWith)
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const lineTotal = quantity * Number(item.unitPrice || 0)
  const fallback = '/assets/search/category-topup.webp'
  return (
    <article className="digital-checkout-item checkout-product" aria-label={`${item.productName} ${item.variantName}`}>
      <div className="checkout-product__row">
        <img className="digital-checkout-item__thumb" src={item.thumbnailUrl || fallback} alt=""
          onError={e => { if(e.currentTarget.dataset.fail !== '1'){e.currentTarget.dataset.fail='1';e.currentTarget.src=fallback} }} />
        <div className="checkout-product__identity">
          <span className="digital-product-method">{methodLabel(item)}</span>
          <strong>{item.gameName || item.productName}</strong>
          <span>{item.variantName}</span>
          <small>{rupiah(item.unitPrice)} / item {quantity > 1 ? `× ${quantity}` : ''}</small>
        </div>
        <strong className="checkout-product__price">{rupiah(lineTotal)}<small>Subtotal</small></strong>
      </div>

      {isId && (
        <div className="checkout-product__destination">
          <div className="checkout-product__destination-head">
            <strong>Akun tujuan top-up</strong>
            <button type="button" onClick={() => {setIdValues({userId:item.accountFields?.userId||'',zone:item.accountFields?.zone||''});setEdit(x=>!x)}}>
              <Pencil size={13} aria-hidden="true"/> {edit ? 'Batal' : 'Edit'}
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
                {(showErrors || idValues[f.slot]) && validateCheckoutField(f,idValues[f.slot]) &&
                  <small className="checkout-field-error">{validateCheckoutField(f,idValues[f.slot])}</small>}
              </div>)}
              <button type="button" className="checkout-product__save" disabled={Boolean(validation)}
                onClick={()=>{onIdSave(item,idValues,fields);setEdit(false)}}>Simpan Data Akun</button>
            </div>
          ) : (
            <p>{fields.map(f=>`${f.label}: ${item.accountFields?.[f.slot] || '—'}`).join(' · ')}</p>
          )}
        </div>
      )}

      {isLogin && (
        <div className="checkout-product__account">
          <div className="checkout-product__account-title">
            <strong>Akun game untuk paket ini</strong>
            <span>Berbeda dari login akun Zetruv</span>
          </div>
          {options?.length > 0 && (
            <label className="checkout-product__share">
              <input type="checkbox" checked={Boolean(sibling)}
                onChange={e => onShare(item.cartKey,e.target.checked ? options[0].cartKey : '')} />
              Gunakan akun game yang sama dengan {options[0].variantName}
            </label>
          )}
          {sibling ? (
            <p className="checkout-product__shared">Menggunakan form akun dari {sibling.variantName} di atas.</p>
          ) : <>
            {!credentialAllowed && (
              <p className="checkout-product__security"><ShieldAlert size={15} aria-hidden="true"/>
                Pengumpulan kredensial game belum diaktifkan karena persetujuan penyedia game belum terverifikasi. Jangan masukkan password atau OTP.
              </p>
            )}
            <div className="checkout-product__fields">
              {fields.length ? fields.map(f => {
                const error = (showErrors || Object.values(effectiveValues).some(v => String(v || '').length > 0)) ? validateCheckoutField(f,effectiveValues[f.slot]) : ''
                return renderLoginField({...f,formId:item.cartKey},effectiveValues[f.slot],
                  v=>onValue(item.cartKey,f.slot,v),Boolean(passwordVisible[f.key]),
                  ()=>setPasswordVisible(old=>({...old,[f.key]:!old[f.key]})),
                  !credentialAllowed,error)
              }) : <p className="checkout-field-error">Aturan pengisian akun belum tersedia.</p>}
            </div>
          </>}
        </div>
      )}
      {priceProblem && <p className="checkout-product__problem"><AlertCircle size={15}/>{priceProblem}</p>}
      {productProblem && <p className="checkout-product__problem"><AlertCircle size={15}/>{productProblem}</p>}
    </article>
  )
}

function CustomerLoginDialog({ onClose, onSuccess }) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  return <div className="checkout-auth-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <form className="checkout-auth-modal" role="dialog" aria-modal="true" aria-label="Masuk ke Zetruv"
      onSubmit={async e=>{
        e.preventDefault();if(busy)return;setBusy(true);setError('')
        try { const response=await authenticateCheckoutCustomer(email,password)
          if(!response?.accessToken)throw Error('Sesi login tidak diterima.')
          onSuccess(response)
        } catch(e){setError(e.message||'Login gagal.')} finally{setBusy(false);setPassword('')}
      }}>
      <div className="checkout-auth-modal__head"><strong>Login akun Zetruv</strong><button type="button" aria-label="Tutup" onClick={onClose}><X size={18}/></button></div>
      <p>Gunakan akun Zetruv yang sudah diverifikasi. Ini berbeda dari akun game untuk top-up.</p>
      <label>Email Zetruv<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Password Zetruv<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <p role="alert" className="checkout-field-error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Memverifikasi...' : 'Masuk & Lanjutkan'}</button>
    </form>
  </div>
}

export default function CheckoutPage() {
  const [items,setItems]=useState(readCart)
  const [catalog,setCatalog]=useState({})
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
  const [customer,setCustomer]=useState(null)
  const [processing,setProcessing]=useState(false)
  const attempt=useRef(null)
  const processingRef=useRef(false)

  useEffect(()=>onCartChange(newItems=>{
    setItems(newItems)
    attempt.current=null
    setVoucher(null)
    setVoucherState('idle')
    setOrder(null)
    setPayment(null)
  }),[])

  const slugs=useMemo(()=>[...new Set(items.map(i=>i.productSlug).filter(Boolean))].sort().join('|'),[items])
  const refreshCatalog=useCallback(async()=>{
    if(!slugs){setCatalog({});setCatalogState('ready');return {}}
    setCatalogState('loading')
    try{
      const rows=await Promise.all(slugs.split('|').map(async slug=>[slug,await getCatalogProduct(slug)]))
      const obj=Object.fromEntries(rows)
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
  const {changes,problems}=useMemo(()=>currentCatalogDifferences(items,catalog),[items,catalog])
  const linePricing=useMemo(()=>getDigitalPricing(items),[items])
  const voucherDiscount=Number(voucher?.discountAmount || 0)
  const total=Math.max(0,linePricing.total-voucherDiscount)
  const methodEnabled=paymentSelectionAllowed(readiness,method)
  const allowedCredentials=supportsCredentialCollection && window.isSecureContext

  const checkoutIssues=useMemo(()=>{
    const result=[]
    if(!items.length)result.push('Keranjang masih kosong.')
    if(!phoneNormalized)result.push('Masukkan nomor WhatsApp Indonesia yang valid.')
    if(catalogState!=='ready')result.push('Katalog produk belum berhasil diverifikasi.')
    if(problems.length)result.push(problems[0].message)
    if(changes.length)result.push('Harga produk berubah. Konfirmasi harga terbaru sebelum melanjutkan.')
    for(const item of items){
      const product=catalog[item.productSlug]
      if(item.fulfillmentMethod==='AUTO_ID'){
        const fields=checkoutFields(product,'AccountValidation')
        const message=validateCheckoutAccount(fields,item.accountFields)
        if(message)result.push(`${item.gameName||item.productName}: ${message}`)
        // Existing checkout API only accepts GameAccountValidationId, not the
        // destination User ID/Zone directly. Never silently lose that data.
        result.push(`${item.gameName||item.productName}: pengiriman User ID/Zona ke backend checkout belum tersedia.`)
      }
      if(item.fulfillmentMethod==='MANUAL_LOGIN'){
        const fields=checkoutFields(product,'LoginCredential')
        const key=matchingAccountSource(items,item,sharing)
        const message=validateCheckoutAccount(fields,values[key])
        if(message)result.push(`${item.gameName||item.productName}: ${message}`)
        if(!allowedCredentials)result.push('Pengumpulan kredensial game belum disetujui/diaktifkan.')
      }
      if(item.requiresGameAccountValidation)result.push(`${item.productName}: verifikasi akun server diperlukan.`)
    }
    if(voucherState==='checking')result.push('Voucher sedang diverifikasi.')
    if(methodsState!=='ready' || !readiness?.canAcceptLivePayments)result.push('Payment gateway DEV belum mendukung pembayaran live.')
    if(!methodEnabled)result.push('Pilih metode pembayaran yang tersedia.')
    // Payment-options currently declares channel availability but contains
    // no authoritative channel fee. Never enable a payable method with an
    // undisclosed potential surcharge.
    if(methodEnabled && readiness?.canAcceptLivePayments)
      result.push('Backend belum mengirim kutipan biaya pembayaran untuk metode ini.')
    if(total<=0)result.push('Total pembayaran harus lebih dari Rp0.')
    return [...new Set(result)]
  },[items,phoneNormalized,catalog,catalogState,problems,changes,sharing,values,allowedCredentials,
      voucherState,methodsState,readiness,methodEnabled,total])
  const valid=checkoutIssues.length===0
  const allCreds=items.filter(i=>i.fulfillmentMethod==='MANUAL_LOGIN')
  const showLiveMethods=readiness?.availableMethods?.length>0

  const applyVoucher=async()=>{
    const code=voucherInput.trim().toUpperCase()
    if(!code||voucherState==='checking')return
    setVoucherState('checking');setVoucherMessage('');setVoucher(null)
    try{
      const preview=await previewCheckoutVoucher({code,items,phone:phoneNormalized,email:customer?.email})
      if(!preview?.discountAmount || Number(preview.discountAmount)<=0)throw Error('Voucher tidak berlaku untuk produk ini.')
      setVoucher({code:preview.code || code,discountAmount:Number(preview.discountAmount)})
      setVoucherState('applied')
      setVoucherMessage(`Voucher diterapkan: −${rupiah(preview.discountAmount)}.`)
    }catch(e){
      const reason=String(e.message||'Voucher tidak berlaku atau sudah kedaluwarsa.')
      const lower=reason.toLowerCase()
      setVoucherState(lower.includes('expir')?'expired':
        lower.includes('eligib')||lower.includes('minimum')?'not-applicable':
        lower.includes('invalid')||lower.includes('inactive')?'invalid':'error')
      setVoucherMessage(reason)
    }
  }
  const confirmPriceChange=()=>{
    acceptCartPriceChanges(changes)
    setError('')
    setVoucher(null);setVoucherState('idle')
  }
  const saveId=(item,values,fields)=>{
    updateCartAccount(item.cartKey,values,{first:fields[0]?.label})
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
      if(!freshMethods || !paymentSelectionAllowed(freshMethods,method))throw Error('Metode pembayaran tidak tersedia lagi.')
      if(!freshCatalog)throw Error('Gagal memverifikasi katalog.')
      const fresh=currentCatalogDifferences(items,freshCatalog)
      if(fresh.changes.length || fresh.problems.length)throw Error('Harga atau ketersediaan berubah. Periksa perubahan sebelum membayar.')
      if(voucher){
        const preview=await previewCheckoutVoucher({code:voucher.code,items,phone:phoneNormalized,email:verifiedCustomer?.email})
        if(Number(preview?.discountAmount)!==voucher.discountAmount){
          setVoucherState('error')
          setVoucher(null)
          throw Error('Nilai voucher berubah. Terapkan ulang dan konfirmasi total.')
        }
      }
      if(!valid)throw Error('Lengkapi semua data pesanan terlebih dahulu.')
      const payload={
        customerName:verifiedCustomer?.name || null,
        customerEmail:verifiedCustomer?.email || null,
        customerPhone:phoneNormalized,
        voucherCode:voucher?.code || null,
        items:items.map(item=>{
          const data={productVariantId:item.variantId,quantity:Number(item.quantity||1),expectedUnitPrice:Number(item.unitPrice)}
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
      const created=order || await createVerifiedCheckoutOrder(attempt.current.body,token,attempt.current.key)
      setOrder(created)
      setPaymentState('starting')
      const session=await startOrderPayment(created,method)
      setPayment(session)
      setPaymentState('pending') // Only provider callback/status can confirm Paid.
    }catch(e){
      if(e.code==='PRICE_CHANGED' && Array.isArray(e.priceChanges)){
        const updates=e.priceChanges.map(change=>{
          const item=items.find(x=>x.variantId===change.productVariantId)
          return item && {key:item.cartKey,variantName:item.variantName,oldPrice:change.expectedUnitPrice,newPrice:change.currentUnitPrice,regularPrice:item.regularPrice}
        }).filter(Boolean)
        if(updates.length)setError('Harga berubah di server. Muat ulang katalog dan konfirmasi sebelum mencoba lagi.')
      } else setError(e.message||'Pembayaran belum bisa dimulai. Silakan coba lagi.')
      setPaymentState('error')
    }finally{processingRef.current=false;setProcessing(false)}
  }
  const handlePay=()=>{
    setFormTouched(true)
    if(!valid||processingRef.current)return
    if(!customer?.accessToken){setAuthDialog(true);return}
    performPay(customer.accessToken,customer.customer)
  }
  const checkPayment=async()=>{
    if(!order)return
    setProcessing(true);setError('')
    try{
      const state=await getOrderPaymentStatus(order)
      setPayment(state)
      setPaymentState(String(state.state||'pending').toLowerCase())
    }catch(e){setError(e.message||'Status pembayaran tidak dapat diperiksa.')}
    finally{setProcessing(false)}
  }

  return <div className="digital-shell">
    <Navbar variant="default"/>
    <main className="digital-checkout-page digital-container">
      <header className="digital-checkout-heading">
        <h1>Checkout Digital</h1><p>Periksa detail akun tujuan, metode pembayaran, dan harga.</p>
      </header>
      <div className="digital-checkout-layout">
        <section className="digital-checkout-order">
          <h2>Ringkasan Pesanan</h2>
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
                productProblem={issue} priceProblem={price?`Harga berubah: ${rupiah(price.oldPrice)} → ${rupiah(price.newPrice)}`:''}/>
            }) : <div className="digital-checkout-empty">Keranjang kosong. <a href="/search">Pilih produk</a></div>}
          </div>
          {changes.length>0 && <div className="checkout-price-change" role="alert">
            <AlertCircle size={17} aria-hidden="true"/>
            <div><strong>Harga produk berubah</strong><p>Konfirmasi harga terbaru sebelum melanjutkan pembayaran.</p>
              <button type="button" onClick={confirmPriceChange}>Setujui harga terbaru</button>
            </div>
          </div>}
          <div className="digital-contact-block">
            <h3>Informasi Kontak</h3>
            <label htmlFor="checkout-phone">Nomor WhatsApp *
              <input id="checkout-phone" type="tel" autoComplete="tel" inputMode="tel"
                placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx" value={phone}
                aria-invalid={phoneTouched && !phoneNormalized}
                onBlur={()=>setPhoneTouched(true)}
                onChange={e=>{setPhone(e.target.value);setVoucher(null);setVoucherState('idle')}}/>
            </label>
            {(phoneTouched || formTouched) && !phoneNormalized
              ? <small className="checkout-field-error">Gunakan nomor HP Indonesia valid, contoh 081234567890.</small>
              : <small>Nomor ini digunakan untuk informasi pesanan. {phoneNormalized && `Format: ${phoneNormalized}`}</small>}
          </div>
          <div className="digital-voucher">
            <label htmlFor="checkout-voucher">Kode Voucher</label>
            <div><input id="checkout-voucher" value={voucherInput} maxLength={32}
              placeholder="Masukkan kode voucher"
              onChange={e=>{setVoucherInput(e.target.value);setVoucher(null);setVoucherState('idle');setVoucherMessage('')}}/>
              <button type="button" disabled={!voucherInput.trim()||voucherState==='checking'||!items.length}
                onClick={applyVoucher}>{voucherState==='checking'?'Memeriksa...':'Gunakan'}</button></div>
            {voucherState==='applied' ?
              <p className="checkout-voucher-applied" role="status"><CheckCircle2 size={15}/>{voucherMessage}
                <button type="button" onClick={()=>{setVoucher(null);setVoucherInput('');setVoucherState('idle')}}>Hapus</button></p>
              : <small className={['invalid','expired','not-applicable','error'].includes(voucherState)?'checkout-field-error':''} role="status">
                {voucherMessage||'Kode diperiksa melalui aturan voucher backend; tidak langsung melakukan pembayaran.'}</small>}
          </div>
        </section>
        <aside className="digital-payment-panel">
          <h2>Metode Pembayaran</h2>
          {methodsState==='loading' && <p className="checkout-gateway-state"><LoaderCircle className="checkout-spinner" size={16}/>Memeriksa metode pembayaran...</p>}
          <div className="digital-payment-methods">
            {(showLiveMethods ? readiness.availableMethods.map(m=>({
              ...paymentDisplay.find(x=>x.code===m.code),...m,
              name:m.name||paymentDisplay.find(x=>x.code===m.code)?.name||m.code,
              icon:paymentDisplay.find(x=>x.code===m.code)?.icon||checkoutAssets.qris,
            })) : paymentDisplay).map(m=>{
              const enabled=paymentSelectionAllowed(readiness,m.code)
              return <button key={m.code} type="button" disabled={!enabled}
                className={method===m.code?'is-active':''} aria-pressed={method===m.code}
                onClick={()=>{setMethod(m.code);setError('')}}>
                <i><img src={m.icon} alt=""/></i>
                <span><strong>{m.name}</strong><small>{enabled?m.description||'Metode tersedia':'Belum tersedia dari gateway'}</small></span>
                <b aria-hidden="true"/>
              </button>
            })}
          </div>
          {methodsState==='error'?<p className="checkout-gateway-state checkout-gateway-state--error">Gagal memeriksa gateway. <button type="button" onClick={refreshMethods}>Coba lagi</button></p>
            : methodsState==='ready' && !readiness?.canAcceptLivePayments?
              <p className="checkout-gateway-state" role="status"><Info size={16}/>Pembayaran live belum tersedia di DEV. Metode di atas hanya referensi tampilan, bukan pembayaran aktif.</p>:null}
          <div className="digital-checkout-prices">
            <div><span>Subtotal produk</span><strong>{rupiah(linePricing.subtotal)}</strong></div>
            <div><span>Diskon produk</span><strong>−{rupiah(linePricing.discount)}</strong></div>
            {voucher && <div className="is-discount"><span>Voucher {voucher.code}</span><strong>−{rupiah(voucherDiscount)}</strong></div>}
            <div><span>Biaya layanan <Info size={13} title="API checkout saat ini belum menyediakan service fee digital."/></span><strong>—</strong></div>
            <div><span>Biaya pembayaran <Info size={13} title="Biaya channel belum dikirim oleh payment gateway."/></span><strong>—</strong></div>
          </div>
          <hr/>
          <div className="digital-checkout-total"><span>Estimasi total produk</span><strong>{rupiah(total)}</strong></div>
          <p className="checkout-fee-note">Total final dan biaya metode pembayaran harus dikonfirmasi oleh backend sebelum bayar.</p>
          {error && <p role="alert" className="digital-checkout-error">{error}</p>}
          <button className="digital-pay-button" type="button" disabled={!valid||processing}
            onClick={handlePay}>{processing?<><LoaderCircle className="checkout-spinner" size={16}/>Memproses...</>:'Bayar Sekarang'}</button>
          {!valid && <div className="checkout-blockers" role="status">
            <strong>Belum bisa melanjutkan:</strong><span>{checkoutIssues[0]}</span>
            {checkoutIssues.length>1 && <small>{checkoutIssues.length-1} hal lain perlu diperiksa.</small>}
          </div>}
          {order && paymentState!=='idle' && <div className="checkout-payment-status" role="status">
            <strong>Status: {paymentState==='paid'?'Pembayaran terkonfirmasi':paymentState==='pending'?'Menunggu pembayaran':paymentState==='starting'?'Menghubungi provider':paymentState}</strong>
            <p>Nomor pesanan: {order.orderNumber}. Jangan melakukan pembayaran ulang sebelum memeriksa status.</p>
            {payment?.paymentUrl && paymentState==='pending' && <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">Buka instruksi pembayaran <ArrowRight size={14}/></a>}
            <button type="button" disabled={processing} onClick={checkPayment}><RefreshCw size={14}/> Periksa status</button>
          </div>}
        </aside>
      </div>
    </main>
    {authDialog && <CustomerLoginDialog onClose={()=>setAuthDialog(false)}
      onSuccess={result=>{
        setCustomer({accessToken:result.accessToken,customer:result.customer})
        setAuthDialog(false)
        // Preserve cart/form input in memory, proceed using verified bearer only.
        performPay(result.accessToken,result.customer)
      }}/>}
  </div>
}
