export const LOGIN_LIMITS = { productName: 80, shortDescription: 160, description: 2000, variantName: 60, sku: 100, groupName: 80, price: 9999999999999999 }
const text = value => String(value ?? '').trim()
const empty = value => value == null || String(value).trim() === ''
const whole = value => !empty(value) && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value))
export function productLoginErrors(form, categories, games) {
  const errors = {}
  if (text(form.name).length < 2) errors.name = 'Nama produk minimal 2 karakter.'
  else if (text(form.name).length > LOGIN_LIMITS.productName) errors.name = 'Nama produk maksimal 80 karakter.'
  else if (!/[a-z0-9]/i.test(text(form.name))) errors.name = 'Nama produk harus mengandung huruf atau angka Latin untuk alamat produk.'
  if (!categories.some(x => x.id === form.categoryId && x.kind === form.kind)) errors.categoryId = 'Pilih kategori Top Up via Login.'
  if (!games.some(x => x.id === form.gameId)) errors.gameId = 'Pilih game terkait.'
  if (text(form.shortDescription).length < 10) errors.shortDescription = 'Deskripsi singkat minimal 10 karakter.'
  else if (text(form.shortDescription).length > LOGIN_LIMITS.shortDescription) errors.shortDescription = 'Deskripsi singkat maksimal 160 karakter.'
  if (text(form.description).length > LOGIN_LIMITS.description) errors.description = 'Detail produk maksimal 2.000 karakter.'
  return errors
}
export function variantLoginErrors(form, siblings = [], id) {
  const errors = {}
  if (text(form.name).length < 2 || text(form.name).length > LOGIN_LIMITS.variantName) errors.name = 'Nama varian harus 2–60 karakter.'
  if (!/^[A-Z0-9][A-Z0-9_-]{1,99}$/i.test(text(form.sku))) errors.sku = 'SKU harus 2–100 karakter: huruf, angka, tanda hubung, atau underscore.'
  else if (siblings.some(x => x.id !== id && text(x.sku).toUpperCase() === text(form.sku).toUpperCase())) errors.sku = 'SKU ini sudah digunakan.'
  if (text(form.groupName).length > LOGIN_LIMITS.groupName) errors.groupName = 'Kelompok paket maksimal 80 karakter.'
  if (!whole(form.price) || Number(form.price) <= 0) errors.price = 'Masukkan harga jual rupiah berupa bilangan bulat lebih dari 0.'
  if (!empty(form.compareAtPrice) && (!whole(form.compareAtPrice) || Number(form.compareAtPrice) <= Number(form.price) || Number(form.compareAtPrice) <= 0)) errors.compareAtPrice = 'Harga coret harus berupa rupiah bulat dan lebih tinggi dari harga jual.'
  if (!empty(form.stockQuantity) && (!whole(form.stockQuantity) || Number(form.stockQuantity) > 2147483647)) errors.stockQuantity = 'Stok harus bilangan bulat 0–2.147.483.647, atau kosong untuk tanpa batas.'
  return errors
}
export function catalogServerField(message) {
  if (/sku/i.test(message)) return 'sku'
  if (/slug|nama produk/i.test(message)) return 'name'
  if (/category|kategori/i.test(message)) return 'categoryId'
  if (/select a game|game does not exist|pilih game/i.test(message)) return 'gameId'
  if (/compare-at|harga coret/i.test(message)) return 'compareAtPrice'
  if (/harga jual/i.test(message)) return 'price'
  if (/stock|stok/i.test(message)) return 'stockQuantity'
  if (/deskripsi singkat/i.test(message)) return 'shortDescription'
  if (/detail produk/i.test(message)) return 'description'
  if (/nama varian/i.test(message)) return 'name'
  return null
}
