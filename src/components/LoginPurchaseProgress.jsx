import { Check, Info } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/login-purchase-flow.css'

export function LoginPurchaseProgress({ current, chooseHref }) {
  const copy = useStorefrontCopy()
  const labels = [copy.loginPurchaseChoose, copy.loginPurchaseReviewStep, copy.loginPurchasePayStep]
  return <nav className="login-purchase-progress" aria-label={copy.loginPurchaseProgress}>
    <ol>{labels.map((label,index)=><li key={index} aria-current={index===current?'step':undefined} className={index<current?'is-done':index===current?'is-current':''}>
      <span className="login-purchase-progress__number">{index<current?<Check size={13} aria-hidden="true"/>:index+1}</span>
      {index===0 && chooseHref && current>0 ? <a href={chooseHref}>{label}</a>:<span>{label}</span>}
    </li>)}</ol>
  </nav>
}
export function LoginPurchaseNotice({ children }) {
  const copy = useStorefrontCopy()
  return <div className="login-purchase-notice" role="note"><Info size={17} aria-hidden="true"/><div>{children || copy.loginPurchaseTestNotice}</div></div>
}
