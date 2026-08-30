import { assets } from '../data/assets'

const rupiah = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`

export default function FlashSale({ items = [], countdown = '01:04:35' }) {
  return (
    <section className="flash-section" aria-labelledby="flash-title">
      <div className="flash-card">
        <img className="flash-decor flash-decor--left" src={assets.flashDecor} alt="" />
        <img className="flash-decor flash-decor--right" src={assets.flashDecor} alt="" />

        <div className="flash-heading">
          <div className="flash-heading__title">
            <img src={assets.fire} alt="" />
            <h2 id="flash-title">Flash Sale</h2>
          </div>
          <div className="countdown-line"><span>Will be end at</span><strong>{countdown}</strong></div>
        </div>

        <div className="flash-carousel">
          <button className="carousel-arrow carousel-arrow--left" type="button" aria-label="Previous flash sale"><img src={assets.expandLeft} alt="" /></button>
          <div className="flash-grid">
            {items.slice(0, 3).map((item) => (
              <article className="sale-item" key={item.id}>
                <div className="sale-item__image"><img src={item.image} alt={item.name} /></div>
                <div className="sale-item__body">
                  <div className="sale-item__info">
                    <h3>{item.name}</h3>
                    <div className="price-row"><strong>{rupiah(item.price)}</strong><del>{rupiah(item.originalPrice)}</del></div>
                  </div>
                  <span className="diamond-pill"><img src={assets.diamond} alt="" />{item.item}</span>
                </div>
              </article>
            ))}
          </div>
          <button className="carousel-arrow carousel-arrow--right" type="button" aria-label="Next flash sale"><img src={assets.expandLeft} alt="" /></button>
        </div>

        <div className="carousel-dots"><b /><span /><span /><span /></div>
      </div>
    </section>
  )
}
