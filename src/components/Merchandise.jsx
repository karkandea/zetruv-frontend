import { assets } from '../data/assets'

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`

export default function Merchandise({ items = [] }) {
  return (
    <section className="merchandise" id="merch" style={{ '--merch-bg': `url(${assets.merchandiseBg})` }} aria-labelledby="merchandise-title">
      <div className="merchandise__header">
        <div>
          <h2 id="merchandise-title">Merchandise</h2>
          <p>Merchandise dan gaming gear untuk lengkapi setup kamu.</p>
        </div>
        <button type="button">Lihat Semua</button>
      </div>

      <div className="merchandise__panel">
        <div className="merchandise__track">
          {items.map((item) => (
            <article className="merch-card" key={item.id}>
              <div className="merch-card__image"><img src={item.image} alt={item.name} /></div>
              <div className="merch-card__body">
                <div className="merch-card__copy">
                  <h3>{item.name}</h3>
                  {item.variant && <p>{item.variant}</p>}
                  <strong>{rupiah(item.price)}</strong>
                </div>
                {(item.sold != null || item.rating != null) && (
                  <div className="merch-card__meta">
                    {item.sold != null && <span>{item.sold} terjual</span>}
                    {item.rating != null && <span className="merch-rating">{item.rating}<img src={assets.star} alt="" /></span>}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
