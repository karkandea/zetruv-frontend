export const PAYMENT_LABELS = {
  Pending: 'Menunggu Pembayaran', Paid: 'Pembayaran Berhasil',
  Failed: 'Pembayaran Gagal', Refunded: 'Dana Dikembalikan',
}

export const PROCESS_LABELS = {
  Pending: 'Menunggu Proses', Processing: 'Sedang Diproses',
  Completed: 'Selesai', Failed: 'Gagal Diproses', Cancelled: 'Dibatalkan',
}

export const SHIPMENT_LABELS = {
  Pending: 'Menunggu', ReadyToShip: 'Siap Dikirim',
  Shipped: 'Dalam Pengiriman', Delivered: 'Terkirim', Cancelled: 'Dibatalkan',
}

export const TRANSACTION_LABELS = {
  Pending: 'Menunggu', Succeeded: 'Berhasil', Failed: 'Gagal',
}

export function needsProcessing(order) {
  return order?.paymentStatus === 'Paid'
    && !['Cancelled', 'Completed'].includes(order.status)
    && (order.status === 'Pending' || Boolean(order.hasFulfillmentIssue) || Boolean(order.hasPendingFulfillment)
      || (order.items || []).some((item) => item.fulfillmentStatus === 'Pending'))
}

export function hasOrderIssue(order) {
  return order?.paymentStatus === 'Failed' || Boolean(order?.hasFulfillmentIssue)
    || (order?.status === 'Cancelled' && order?.paymentStatus === 'Paid')
}

export function quickMatch(order, filter) {
  switch (filter) {
    case 'waiting': return order.paymentStatus === 'Pending' && order.status !== 'Cancelled'
    case 'attention': return needsProcessing(order)
    case 'complete': return order.status === 'Completed'
    case 'issues': return hasOrderIssue(order)
    default: return true
  }
}

export function processLabel(order) {
  if (order.status === 'Cancelled') return PROCESS_LABELS.Cancelled
  if (order.hasFulfillmentIssue) return PROCESS_LABELS.Failed
  if (order.status === 'Completed') return PROCESS_LABELS.Completed
  if (order.status === 'Processing') return PROCESS_LABELS.Processing
  if (order.paymentStatus === 'Paid' && order.hasPendingFulfillment) return 'Sebagian Menunggu Proses'
  if (order.paymentStatus === 'Pending') return 'Belum Dimulai'
  if (order.paymentStatus === 'Failed') return 'Tertahan'
  return PROCESS_LABELS.Pending
}

export function orderAdvice(order) {
  if (order.status === 'Cancelled') {
    return order.paymentStatus === 'Paid'
      ? { tone: 'warning', title: 'Pesanan Dibatalkan · Pembayaran Tercatat', detail: 'Pembatalan tidak otomatis mengembalikan dana. Periksa pengembalian dana melalui proses terpisah.' }
      : { tone: 'neutral', title: 'Pesanan Dibatalkan', detail: 'Pesanan ini tidak akan diproses. Tindakan pembatalan tidak bisa dibatalkan dari CMS.' }
  }
  if (order.paymentStatus === 'Pending') return { tone: 'warning', title: 'Menunggu Pembayaran', detail: 'Pembayaran belum terkonfirmasi. Pesanan tidak boleh diproses sampai pembayaran berhasil.' }
  if (order.paymentStatus === 'Failed') return { tone: 'danger', title: 'Pembayaran Gagal', detail: 'Belum ada pembayaran berhasil. Periksa transaksi dan tunggu konfirmasi resmi sebelum memproses.' }
  if (order.paymentStatus === 'Refunded') return { tone: 'neutral', title: 'Dana Dikembalikan', detail: 'Lihat riwayat transaksi untuk memastikan rincian pengembalian dana yang tercatat.' }
  if (order.hasFulfillmentIssue) return { tone: 'danger', title: 'Proses Pesanan Bermasalah', detail: 'Pembayaran berhasil, tetapi setidaknya satu item gagal diproses. Periksa item yang bermasalah.' }
  if (order.status === 'Pending') return { tone: 'attention', title: 'Pembayaran Berhasil · Perlu Diproses', detail: 'Ada item yang masih menunggu proses. Periksa dan lanjutkan sesuai jenis produknya.' }
  if (order.status === 'Processing') return { tone: 'info', title: 'Sedang Diproses', detail: 'Pembayaran sudah berhasil dan proses pesanan sedang berlangsung.' }
  if ((order.items || []).some((item) => item.fulfillmentStatus === 'Pending')) return { tone: 'attention', title: 'Pembayaran Berhasil · Ada Item Menunggu', detail: 'Sebagian item masih menunggu proses. Periksa setiap item sebelum menyelesaikan pesanan.' }
  return { tone: 'success', title: 'Pesanan Selesai', detail: 'Semua item pesanan telah selesai diproses.' }
}

export function canCancelOrder(order) {
  return Boolean(order)
    && !['Cancelled', 'Completed'].includes(order.status)
    && !(order.items || []).some((item) => item.fulfillmentStatus === 'Completed')
    && !['Shipped', 'Delivered'].includes(order.shipment?.status)
}

export function inDateRange(value, start, end) {
  if (!value || Number.isNaN(new Date(value).getTime())) return false
  const day = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
  return (!start || day >= start) && (!end || day <= end)
}

export function orderTimeline(order) {
  const entries = [{ kind: 'created', label: 'Pesanan dibuat', at: order.createdAt }]
  if (order.paidAt) entries.push({ kind: 'paid', label: 'Pembayaran dikonfirmasi', at: order.paidAt })
  if (order.completedAt) entries.push({ kind: 'completed', label: 'Pesanan selesai', at: order.completedAt })
  for (const transaction of order.transactions || []) {
    entries.push({
      kind: 'transaction',
      label: transaction.type === 'Refund' ? 'Transaksi pengembalian dana tercatat' : 'Transaksi pembayaran tercatat',
      at: transaction.processedAt || transaction.createdAt,
      transaction,
    })
  }
  return entries.filter((entry) => entry.at).sort((a, b) => new Date(a.at) - new Date(b.at))
}
