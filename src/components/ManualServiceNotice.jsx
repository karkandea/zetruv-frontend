import { Clock3 } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import '../styles/manual-service-notice.css'

export default function ManualServiceNotice({ compact = false }) {
  const copy = useStorefrontCopy()
  if (compact) return <div className="manual-service-notice manual-service-notice--compact" role="note">
    <Clock3 size={15} strokeWidth={1.8} aria-hidden="true" />
    <div><strong>{copy.manualServiceNoticeTitle}</strong><p>{copy.manualServiceNoticeTiming}</p></div>
  </div>
  return <div className={`manual-service-notice${compact ? ' manual-service-notice--compact' : ''}`} role="note">
    <Clock3 size={20} strokeWidth={1.8} aria-hidden="true" />
    <div>
      <strong>{copy.manualServiceNoticeTitle}</strong>
      <p>{copy.manualServiceNoticeBody}</p>
    </div>
  </div>
}
