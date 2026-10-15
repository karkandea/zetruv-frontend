// Navbar localization only. Use standard BCP 47 language codes (ms for Malay).
export const NAVBAR_LANGUAGE_STORAGE_KEY = 'zetruv-navbar-language'

export const NAVBAR_LANGUAGES = Object.freeze([
  { code: 'en', badge: 'EN', name: 'English', flag: 'flagUs' },
  { code: 'id', badge: 'ID', name: 'Bahasa Indonesia', flag: 'flagId' },
  { code: 'ms', badge: 'MY', name: 'Bahasa Melayu', flag: 'flagMy' },
])

export function normalizeNavbarLanguage(value) {
  return NAVBAR_LANGUAGES.some((language) => language.code === value) ? value : 'en'
}

export function readNavbarLanguage() {
  if (typeof window === 'undefined') return 'en'
  try {
    return normalizeNavbarLanguage(window.localStorage.getItem(NAVBAR_LANGUAGE_STORAGE_KEY))
  } catch {
    return 'en'
  }
}

export const NAVBAR_COPY = {
  en: {
    search: 'Search game or voucher',
    searchCatalog: 'Search games, vouchers, or products',
    home: 'Home', product: 'Product', shop: 'Shop', article: 'Article', articles: 'Articles',
    transaction: 'Check Transaction', trackOrder: 'Track Order', leaderboard: 'Leaderboard',
    cart: 'Cart', digitalCart: 'Digital Cart', physicalCart: 'Physical Cart',
    login: 'Login', register: 'Register', logout: 'Logout', language: 'Change language',
    products: {},
  },
  id: {
    search: 'Cari game atau voucher',
    searchCatalog: 'Cari game, voucher, atau produk',
    home: 'Beranda', product: 'Produk', shop: 'Belanja', article: 'Artikel', articles: 'Artikel',
    transaction: 'Cek Transaksi', trackOrder: 'Lacak Pesanan', leaderboard: 'Peringkat',
    cart: 'Keranjang', digitalCart: 'Keranjang Digital', physicalCart: 'Keranjang Fisik',
    login: 'Masuk', register: 'Daftar', logout: 'Keluar', language: 'Pilih bahasa',
    products: {
      'Browse All Categories': 'Lihat Semua Kategori',
      'Top Up Via ID': 'Top Up via ID',
      'Top Up Login': 'Top Up via Login',
      'Voucher Game': 'Voucher Game',
      'Joki Game': 'Joki Game',
      'Merchandise': 'Merchandise',
      'Game Account': 'Akun Game',
    },
  },
  ms: {
    search: 'Cari permainan atau baucar',
    searchCatalog: 'Cari permainan, baucar atau produk',
    home: 'Utama', product: 'Produk', shop: 'Kedai', article: 'Artikel', articles: 'Artikel',
    transaction: 'Semak Transaksi', trackOrder: 'Jejak Pesanan', leaderboard: 'Kedudukan',
    cart: 'Troli', digitalCart: 'Troli Digital', physicalCart: 'Troli Fizikal',
    login: 'Log Masuk', register: 'Daftar', logout: 'Log Keluar', language: 'Pilih bahasa',
    products: {
      'Browse All Categories': 'Lihat Semua Kategori',
      'Top Up Via ID': 'Tambah Nilai melalui ID',
      'Top Up Login': 'Tambah Nilai melalui Log Masuk',
      'Voucher Game': 'Baucar Permainan',
      'Joki Game': 'Khidmat Joki',
      'Merchandise': 'Barangan',
      'Game Account': 'Akaun Permainan',
    },
  },
}
