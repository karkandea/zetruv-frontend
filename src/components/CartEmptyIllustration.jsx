// Shared empty-cart artwork for digital and merchandise, so their layouts never diverge.
// Source: CC0 basket illustration (freesvg.org/img/cesta.png).
export default function CartEmptyIllustration() {
  return <div className="digital-empty-cart__art" aria-hidden="true">
    <img src="https://freesvg.org/img/cesta.png" alt="" loading="lazy" decoding="async"
      onError={(event) => { event.currentTarget.hidden = true }} />
  </div>
}
