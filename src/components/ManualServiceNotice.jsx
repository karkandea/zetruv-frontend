import { Clock3 } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/manual-service-notice.css'

export default function ManualServiceNotice({ compact = false }) {
  const copy = useStorefrontCopy()
  return <div className={`manual-service-notice${compact ? ' manual-service-notice--compact' : ''}`} role="note">
    <Clock3 size={compact ? 16 : 20} strokeWidth={1.8} aria-hidden="true" />
    <div>
      {!compact && <strong>{copy.manualServiceNoticeTitle}</strong>}
      <p>{compact ? copy.manualServiceAfterPayment : copy.manualServiceNoticeBody}</p>
    </div>
  </div>
}
