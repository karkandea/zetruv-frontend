import './skeleton.css'

export function LoadingRegion({ label, className, children }) {
  return <div className={className} role="status">
    <span className="skeleton-status">{label}</span>
    <div className="skeleton-content" inert aria-hidden="true">{children}</div>
  </div>
}

export function Bone({ className = '', width, height, variant = 'line' }) {
  return <span aria-hidden="true" className={`skeleton-bone skeleton-bone--${variant} ${className}`} style={{ '--bone-width': width, '--bone-height': height }} />
}

export function SkeletonItems({ className, count = 3, children }) {
  return Array.from({ length: count }, (_, index) => (
    <div className={className} key={index}>{children}</div>
  ))
}

export function SkeletonLines() {
  return <div className="skeleton-lines"><Bone width="72%" /><Bone width="48%" /></div>
}

export function SkeletonRows({ count = 4 }) {
  return <SkeletonItems className="skeleton-row" count={count}>
    <Bone variant="thumb" /><SkeletonLines />
  </SkeletonItems>
}

export function SkeletonPanel() {
  return <div className="skeleton-panel">
    <Bone width="45%" height="20px" />
    <Bone variant="control" />
    <SkeletonLines />
    <Bone variant="control" />
  </div>
}

export function ProductSkeleton({ label, hero, container, heroContent, cover, heroCopy, heroBenefits, body, layout, panel, grid, card, aside }) {
  return <LoadingRegion label={label}>
    <section className={hero}>
      <div className={heroContent}>
        <Bone className={cover} variant="thumb" />
        <div className={heroCopy}><SkeletonLines /></div>
        {heroBenefits}
      </div>
    </section>
    <div className={body}>
      <div className={[container, layout].filter(Boolean).join(' ')}>
        <section className={panel}>
          <Bone width="44%" height="22px" />
          {grid ? <div className={grid}>
            <SkeletonItems className={card} count={6}><Bone variant="thumb" /><SkeletonLines /></SkeletonItems>
          </div> : <SkeletonPanel />}
        </section>
        <aside className={aside}><SkeletonPanel /></aside>
      </div>
    </div>
  </LoadingRegion>
}
