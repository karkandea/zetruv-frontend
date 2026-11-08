export const MAX_BANNER_BYTES = 3 * 1024 * 1024

export const bannerState = (item, now = Date.now()) => {
  if (!item.isActive) return 'Nonaktif'
  if (item.endsAt && Date.parse(item.endsAt) <= now) return 'Selesai'
  if (item.startsAt && Date.parse(item.startsAt) > now) return 'Terjadwal'
  return 'Aktif'
}

export const shiftItem = (items, from, to) => {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items
  const next = [...items]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

export const toLocalInput = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export const bannerPayload = (form, sortOrder) => ({
  title: form.title.trim(),
  subtitle: form.subtitle.trim(),
  imageUrl: form.imageUrl.trim(),
  primaryCtaLabel: form.primaryCtaLabel?.trim() || null,
  primaryCtaUrl: form.primaryCtaUrl || null,
  secondaryCtaLabel: form.secondaryCtaLabel?.trim() || null,
  secondaryCtaUrl: form.secondaryCtaUrl || null,
  isActive: Boolean(form.isActive),
  sortOrder,
  startsAt: form.scheduled && form.startsAt ? new Date(form.startsAt).toISOString() : null,
  endsAt: form.scheduled && form.endsAt ? new Date(form.endsAt).toISOString() : null,
})

export const validateBanner = (form, imageReady) => {
  if (!form.title.trim()) return 'Judul banner wajib diisi.'
  if (!form.subtitle.trim()) return 'Deskripsi banner wajib diisi.'
  if (!form.imageUrl) return 'Unggah gambar banner terlebih dahulu.'
  if (form.isActive && !imageReady) return 'Gambar tidak dapat dimuat. Ganti gambar sebelum menayangkan banner.'
  if (Boolean(form.primaryCtaLabel?.trim()) !== Boolean(form.primaryCtaUrl)) return 'Tulisan dan halaman tujuan tombol utama harus diisi bersama.'
  if (Boolean(form.secondaryCtaLabel?.trim()) !== Boolean(form.secondaryCtaUrl)) return 'Tulisan dan halaman tujuan tombol kedua harus diisi bersama.'
  if (form.scheduled) {
    if (!form.startsAt || !form.endsAt) return 'Isi tanggal mulai dan tanggal berakhir penayangan.'
    if (new Date(form.endsAt) <= new Date(form.startsAt)) return 'Tanggal berakhir harus setelah tanggal mulai.'
  }
  return ''
}
