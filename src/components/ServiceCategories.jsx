export default function ServiceCategories({ items = [] }) {
  return (
    <section className="service-categories" id="product" aria-label="Product categories">
      <div className="service-categories__inner">
        {items.map((item) => (
          <a className="service-category" href={`#${item.id}`} key={item.id}>
            <span className="service-category__icon">
              <img className="service-category__ring" src={item.ring} alt="" />
              <img className="service-category__image" src={item.image} alt="" />
            </span>
            <strong>{item.label}</strong>
          </a>
        ))}
      </div>
    </section>
  )
}
