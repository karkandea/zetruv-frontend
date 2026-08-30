const rupiah = (value) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`

export default function FlashSale({ items = [], countdown = '01:04:35' }) {
  return (
    <section className="flash-wrap" aria-labelledby="flash-title">
      <div className="container flash-shell">
        <div className="flash-card">
          <div className="section-heading section-heading--compact">
            <h2 id="flash-title"><span>🔥</span> Flash Sale</h2>
            <div className="countdown-line"><span>Will be end at</span><strong>{countdown}</strong></div>
          </div>
          <div className="flash-grid">
            {items.map((item) => (
              <article className="sale-item" key={item.id}>
                <img className="sale-item__image" src={item.image} alt={item.name} />
                <div className="sale-item__body">
                  <div>
                    <h3>{item.name}</h3>
                    <div className="price-row"><strong>{rupiah(item.price)}</strong><del>{rupiah(item.originalPrice)}</del></div>
                  </div>
                  <span className="diamond-pill">◆ {item.item}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="carousel-dots"><b /><span /><span /><span /></div>
        </div>
      </div>
    </section>
  )
}
