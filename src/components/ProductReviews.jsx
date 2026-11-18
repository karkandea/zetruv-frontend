import { useEffect, useId, useState } from 'react'
import { Star } from 'lucide-react'
import { useNavbarLanguage } from '../hooks/useNavbarLanguage'
import { useStorefrontCopy } from '../hooks/useStorefrontCopy'
import { getProductReviews } from '../services/catalogService'
import { formatCopy } from '../services/storefrontCopy'
import '../styles/product-reviews.css'

const ratings = [5, 4, 3, 2, 1]
const locales = { id: 'id-ID', ms: 'ms-MY', en: 'en' }

export function ProductRating({ product }) {
  const copy = useStorefrontCopy()
  const language = useNavbarLanguage()
  if (!(product.rating > 0 && product.reviewCount > 0)) return null
  const locale = locales[language] || 'id-ID'
  return <span className="pdp-reviewed-rating">
    <Star size={16} fill="currentColor" aria-hidden="true" />
    <strong>{product.rating.toLocaleString(locale, { maximumFractionDigits: 1 })}</strong>
    <span>({product.reviewCount.toLocaleString(locale)} {copy.reviews})</span>
  </span>
}

export default function ProductReviews({ product }) {
  const slug = product.slug
  if (!slug || product.reviewCount === 0) return null
  return <PublishedReviews key={slug} slug={slug} hasKnownReviews={product.reviewCount > 0} />
}

function PublishedReviews({ slug, hasKnownReviews }) {
  const copy = useStorefrontCopy()
  const language = useNavbarLanguage()
  const heading = useId()
  const [page, setPage] = useState(null)
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState('loading')
  const locale = locales[language] || 'id-ID'

  useEffect(() => {
    const controller = new AbortController()
    getProductReviews(slug, offset, controller.signal).then(result => {
      if (controller.signal.aborted) return
      setPage(result)
      setItems(previous => {
        if (!offset) return result.items
        const shown = new Set(previous.map(item => item.id))
        return [...previous, ...result.items.filter(item => !shown.has(item.id))]
      })
      setState('ready')
    }).catch(error => {
      if (!controller.signal.aborted) setState(error.status === 404 && !hasKnownReviews ? 'missing' : 'error')
    })
    return () => controller.abort()
  }, [slug, offset, retry, hasKnownReviews])

  if (!page?.reviewCount && !(hasKnownReviews && state === 'error')) return null

  return <section className="published-reviews" aria-labelledby={heading} aria-busy={state === 'loading'}>
    <h2 id={heading}>{copy.productReviews}</h2>
    {page?.reviewCount > 0 && <>
      <div className="published-reviews__summary">
        <div className="published-reviews__score">
          <strong><Star size={25} fill="currentColor" aria-hidden="true" /> {page.rating.toLocaleString(locale, { maximumFractionDigits: 1 })}<small>/5</small></strong>
          <span>{page.reviewCount.toLocaleString(locale)} {copy.verifiedReviews}</span>
        </div>
        <ul className="published-reviews__distribution">
          {ratings.map(rating => {
            const count = page.distribution.find(item => item.rating === rating)?.count ?? 0
            return <li key={rating}>
              <span>{rating} <Star size={13} fill="currentColor" aria-hidden="true" /></span>
              <progress max={page.reviewCount} value={count} aria-label={formatCopy(copy.reviewStarsOutOfFive, { rating })} />
              <span>{count.toLocaleString(locale)}</span>
            </li>
          })}
        </ul>
      </div>
      <ul className="published-reviews__items">
        {items.map(review => <li key={review.id}>
          <div className="published-reviews__meta">
            <strong>{copy.verifiedBuyer}</strong>
            <time dateTime={review.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(review.createdAt))}</time>
          </div>
          <span className="published-reviews__stars" role="img" aria-label={formatCopy(copy.reviewStarsOutOfFive, { rating: review.rating })}>
            {[...ratings].reverse().map(value => <Star key={value} size={15} fill={value <= review.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}
          </span>
          {review.comment && <p>{review.comment}</p>}
        </li>)}
      </ul>
    </>}
    {state === 'error' && <div className="published-reviews__feedback">
      <p role="alert">{copy.productReviewsLoadError}</p>
      <button type="button" onClick={() => { setState('loading'); setRetry(value => value + 1) }}>{copy.tryAgain}</button>
    </div>}
    {page?.hasMore && state !== 'error' && <button type="button" disabled={state === 'loading'}
      onClick={() => { setState('loading'); setOffset(offset + page.items.length) }}>{copy.moreProductReviews}</button>}
  </section>
}
