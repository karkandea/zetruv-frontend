import { MessageCircle } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { formatCopy } from '../services/storefrontCopy'

export default function GameItemAdminContact({ paid, phone, orderNumber }) {
  const copy = useStorefrontCopy()
  if (!paid || !/^\+[1-9]\d{7,14}$/.test(phone || '')) return null

  const message = formatCopy(copy.gameItemOrderMessage, { order: orderNumber })
  const href = `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`

  return (
    <div className="game-item-admin-contact">
      <div><strong>{copy.gameItemAdminPhone}</strong><span>{phone}</span></div>
      <a href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> {copy.gameItemChatAdmin}</a>
    </div>
  )
}
