import { useState } from 'react'
import { AlertTriangle, ChevronDown, Image, MoreHorizontal } from 'lucide-react'
import { variantPriceWarning } from './variantPriceWarnings'

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0))

export default function VariantPricingTable({ variants = [], kind, onEdit, onDisable, onVoucher }) {
  const [expanded, setExpanded] = useState({})
  if (!variants.length) return <div className="catalog-editor-empty"><strong>Belum ada varian</strong><p>Tambahkan nominal pertama untuk mulai menjual produk ini.</p></div>
  return <div className="catalog-variant-table-wrap"><table className="catalog-variant-table">
    <thead><tr><th>Varian</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>{variants.map((item) => {
      const warning = variantPriceWarning(item, variants)
      return <tr key={item.id}>
        <td><div className="catalog-variant-name"><button type="button" className="catalog-variant-expand" aria-label={'Detail ' + item.name} aria-expanded={Boolean(expanded[item.id])} onClick={() => setExpanded((old) => ({ ...old, [item.id]: !old[item.id] }))}><ChevronDown size={16} /></button><span className="catalog-variant-list-icon">{item.iconUrl ? <img src={item.iconUrl} alt="" loading="lazy" /> : <Image size={17} />}</span><div><strong>{item.name}</strong>{item.groupName && <small>{item.groupName}</small>}{warning && <span className="catalog-price-flag" title={warning}><AlertTriangle size={13} /> Periksa harga</span>}</div></div>{expanded[item.id] && <div className="catalog-variant-details"><span>SKU: <code>{item.sku}</code></span>{item.compareAtPrice != null && <span>Harga coret: {money(item.compareAtPrice)}</span>}{warning && <p role="status">{warning}</p>}</div>}</td>
        <td className="catalog-variant-price">{money(item.price)}</td>
        <td>{item.stockQuantity == null ? 'Tanpa batas' : new Intl.NumberFormat('id-ID').format(item.stockQuantity)}</td>
        <td><span className={'catalog-state ' + (item.isActive ? 'is-active' : 'is-inactive')}>{item.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
        <td><div className="catalog-variant-actions"><button className="catalog-inline-action" type="button" onClick={() => onEdit(item)}>Ubah</button><details className="catalog-more"><summary aria-label={'Aksi tambahan untuk ' + item.name}><MoreHorizontal size={18} /></summary><div>{kind === 'GameVoucher' && <button type="button" onClick={() => onVoucher(item)}>Kode Voucher</button>}{item.isActive && <button type="button" onClick={() => onDisable(item)}>Nonaktifkan</button>}</div></details></div></td>
      </tr>
    })}</tbody>
  </table></div>
}
