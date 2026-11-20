import { useEffect, useState } from 'react'
import { Bookmark, ImageOff, Star } from 'lucide-react'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { isFavorite, subscribeFavorites, toggleFavorite } from '../services/favoritesService'
import { formatCopy } from '../services/storefrontCopy'
import { Bone, SkeletonItems, SkeletonLines } from './Skeleton'
import '../styles/merchandise-card.css'

export function MerchandiseCardSkeletons({ count }) {
  return <SkeletonItems className="merch-card" count={count}>
    <div className="merch-card__image"><Bone variant="media" /></div>
    <div className="merch-card__body"><SkeletonLines /></div>
  </SkeletonItems>
}

export default function MerchandiseCard({ product }) {
  const copy = useStorefrontCopy()
  const href = `/merchandise/${encodeURIComponent(product.slug)}`
  const favoriteId = `merchandise:${product.slug}`
  const [saved, setSaved] = useState(() => isFavorite(favoriteId))
  const [brokenImage, setBrokenImage] = useState(null)
  useEffect(() => subscribeFavorites((items) => setSaved(items.some(({ id }) => id === favoriteId))), [favoriteId])

  const thumbnail = product.thumbnailUrl || product.image
  const price = product.minPrice ?? product.price ?? product.maxPrice
  const priceText = price != null ? `Rp${new Intl.NumberFormat('id-ID').format(price)}` : copy.priceUnavailable
  const sold = product.soldQuantity ?? product.sold
  const hasRating = product.rating > 0
  const unavailable = product.isAvailable === false

  return <article className="merch-card">
    <a className="merch-card__link" href={href}>
      <div className="merch-card__image">
        {thumbnail && brokenImage !== thumbnail ? (
          <img src={thumbnail} alt="" loading="lazy" decoding="async" onError={() => setBrokenImage(thumbnail)} />
        ) : <ImageOff size={22} role="img" aria-label={copy.photoUnavailable} />}
        <span className="merch-card__chip">{copy.merchandise2}</span>
      </div>
      <div className="merch-card__body">
        <h3 title={product.name}>{product.name}</h3>
        <strong>{priceText}</strong>
        {(sold > 0 || hasRating || unavailable) && <div className="merch-card__meta">
          {unavailable && <span>{copy.unavailable2}</span>}
          {sold > 0 && <span>{new Intl.NumberFormat('id-ID').format(sold)} {copy.sold}</span>}
          {hasRating && <span className="merch-card__rating">
            <Star size={13} fill="currentColor" aria-hidden="true" />{product.rating}
          </span>}
        </div>}
      </div>
    </a>
    <button type="button" className="merch-card__bookmark"
      aria-label={formatCopy(saved ? copy.removeBookmark : copy.addBookmark, { product: product.name })}
      aria-pressed={saved}
      onClick={() => setSaved(toggleFavorite({
        id: favoriteId, name: product.name, type: 'Merchandise',
        href, image: thumbnail, price: priceText,
      }))}>
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  </article>
}
