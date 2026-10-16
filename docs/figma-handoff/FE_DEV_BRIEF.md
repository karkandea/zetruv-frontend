# DEV BRIEF — Zetruv FE Fidelity vs Screenshot Reference
Tanggal: 16 Oktober 2026 · Target: Frontend DEV only · Status: handoff, **bukan** konfirmasi UI 1:1

## Tujuan
Cocokkan UI FE yang **sekarang live di DEV** terhadap PNG referensi desain yang sudah diekspor. Jangan membuat desain baru, jangan mengubah backend tanpa koordinasi, jangan menganggap Playwright PASS = visual 1:1. Sumber referensi hanya screenshot dalam folder **[screenshots/](./screenshots/)**; dev tidak perlu membuka Figma. Baca [README](./README.md) untuk seluruh indeks.

**PENTING:** Kerjakan via branch FE baru yang diturunkan dari branch dokumentasi ini (berbasis DEV), audit dulu seluruh routes/states, lalu ajukan PR *review-only*. Jangan langsung commit/merge ke dev atau production. Jangan menghidupkan demo order, stok/review palsu, invoice/QR fake, pembayaran palsu, atau email reset "berhasil" tanpa respons backend asli. Mock hanya boleh ada di environment test Playwright yang terisolasi.

## Hierarki desain (jika screenshot berbeda)
1. **Homepage Final Source of Truth** = \`01-homepage-final.png\`; jangan gunakan Homepage V1/Archive sebagai sumber visual final.
2. **Customer canonical flows** = Digital Purchase, Physical Purchase, Akun Saya, Status Order, Article, Auth; urutan screen/state mengikuti nama file PNG.
3. **Responsive overrides** = \`27/28\` physical mobile, \`44–46\` marketplace mobile; cocokkan pada viewport 390px dan 768px bila tersedia.
4. **Admin CMS** = \`50–53\`, modul TERPISAH; jangan campur scope storefront. Arsip/exploration hanya konteks, bukan acuan implementasi.

## Urutan kerja dan expected output
### P0 — Kejujuran transaksi / flow user (blocker rilis)
| FE area/route | Screenshot | Kondisi saat audit | Yang harus dikerjakan / aturan |
| --- | --- | --- | --- |
| \`/game-accounts\`, \`/cart?flow=account\`, \`/checkout?flow=account\`, \`/payment?flow=account\` | 19, 29–34 | Masih ada route data preview dan session-generated invoice/order pada \`GameAccountPages.jsx\` | **Jangan buat order/payment palsu.** Tutup atau beri unavailable-state bila backend belum siap; untuk tampilan final implementasikan contract-backed states, test mock hanya di test harness. |
| \`/order-status\` | 29–34, 49 | PR #29 sudah memakai \`POST /api/v1/orders/lookup\` berbasis nomor order+email/nomor HP; form live bukan dummy | Pertahankan verifikasi kontak dan error 404. Implementasikan semantic UI detail/status berdasar *response asli*, jangan tampilkan 16 screenshot hasil mock sebagai data nyata. |
| \`/merchandise/:slug\` | 21, 28 | PDP ada gallery/size/qty; **Custom Name (opsional, gratis, <=12 chars) hilang**; tab Details & Care berbeda; stok/rating angka masih statis | Tambah UI input nama personalisasi dengan counter, batas 12, invalid state; sesuaikan tabs. Jangan simpan ke order final jika backend belum menerima atribut personalisasi. Harga, stock, reviews tidak boleh diklaim real tanpa API. |
| \`/checkout?flow=physical\`, \`/payment?flow=physical\` | 20–26 | FE sengaja menolak checkout fisik karena backend ongkir/alamat/payment belum end-to-end | Pertahankan gate yang jujur; bangun UI/state sesuai PNG hanya bila setiap operasi terhubung kontrak sah. **Tidak boleh menciptakan invoice, QRIS atau status Paid di FE.** |
| \`/checkout\`, \`/payment\` | 08–14, 15, 17–19 | FE digital punya contract checkout; payment-options DEV aktual = \`DemoOnly\` / metode kosong | Tampilkan unavailable state yang jelas. Isi metode pembayaran HANYA dari API. Status Paid HANYA dari backend. Jangan bypass readiness untuk mengejar visual screenshot. |
| \`/account/orders\`, \`/account/orders/:id\`, \`/account/addresses\` | 35–39 | Read-only unavailable/login state masih ada, belum ada daftar order/alamat dan detail sesuai desain | Pisahkan FE layout dan backend blocker; tampilkan empty/login/error yang benar, bukan fake data pengguna. Siapkan kontrak FE state untuk integrasi bila API tersedia. |
| Homepage \`/\`, \`/merchandise\` | 01, 20, 44 | Home visual punya enam kategori, tetapi Flash Sale tidak tampil saat kosong; delapan kartu merchandise berulang (jersey) | Bandingkan hierarchy/spacing/cards, pastikan \`Flash Sale 0 item => hide\` tetap benar; bila data tersedia tampil sesuai desain. **Jangan duplikasi data atau hardcode jersey untuk mengisi grid.** Cek katalog/stock/price aslinya. |

### P1 — Fidelity layar, responsif, dan detail interaksi
| Screen group | Screenshot | Acceptance |
| --- | --- | --- |
| Homepage | 01, 44 | Sections, hero, category cards, game populer, akun game, merchandise, trust strip, artikel dan footer sesuai urutan & jarak desain final; desktop 1280, mobile 390. |
| Login/Register/Forgot/Verify | 02–07, 47–48 | Modal desktop, layar mobile, text hierarchy, input/validation/loading/expired/success mengikuti referensi. Reset sukses hanya setelah API; tidak menyimpan token/password. |
| Top Up Via ID | 08–12 | Product detail→cart→checkout→payment→order state; field User ID/Zone, CTA, panel ringkasan dan visual no-overlap. |
| Top Up Via Login | 13–14 dan state pembayaran bersama | Form dinamis, credential hanya saat checkout, jangan simpan password/OTP di cart, validasi & state processing. |
| Voucher / Joki | 15, 17–18 dan shared cart/checkout | Produk, cart, delivery voucher, progress Joki, error/processing tanpa placeholder yang menyesatkan. Catatan: screenshot khusus Voucher Checkout **belum masuk paket** karena ekspor sumber terblokir; gunakan shared checkout screenshot 10 sebagai acuan layout sementara, catat sebagai unverified. |
| Game Accounts | 19, 45–46 | Listing/filter/detail, desktop dan mobile, login gate; hindari pengalihan produk merchandise ke listing Akun Game. |
| Physical Purchase | 20–28 | Desktop list/PDP/cart/checkout/payment/tracking/review, mobile list/PDP 390px; 768px tablet ikuti prinsip satu kolom pada desain. |
| Status Order | 29–34, 49 | Payment pending/paid/failed/expired/processing, invoice, tracking, service-specific updates; tampil sesuai sumber response backend, bukan query \`state=\` palsu. |
| Akun Saya | 35–41 | Profile, orders filled/empty, address list/add-edit, favorites filled/empty; visual mock **hanya** dalam test harness bila API tak tersedia. |
| Artikel | 42–43 | Featured vs latest, search/category chips, detail article & footer. Newsletter saat ini punya \`preventDefault\` saja: jangan tampilkan Subscribe seolah tersimpan; hubungkan API atau nyatakan belum tersedia. |
| Admin CMS (scope terpisah) | 50–53 | Dashboard, katalog list, digital orders, physical fulfillment; beda PR/tahap dari customer storefront. |

### P2 — QA fidelity
1. Buat route/state matrix (Desktop 1280, tablet 768 bila relevan, Mobile 390), tandai **MATCH / PARTIAL / MISSING / BLOCKED_BY_BE**. Jangan samakan BLOCKED_BY_BE dengan layout MATCH.
2. Screenshot FE BEFORE/AFTER pada *viewport sama* dengan referensi: ukuran, spacing, responsive stack, visual typography, CTA dan content order. Lampirkan ke PR, bukan hanya “build PASS”.
3. Uji dropdown/menu, ukuran/warna/personalization, cart merge guest→login, forced refresh, 409 conflict, field validation, spinner, 401/403/404/5xx, keyboard tab/escape, no horizontal overflow.
4. Jaga integrasi checkout digital yang sudah ada; jangan mengubah checkout semantics, amount, headers, order token, atau payment readiness hanya karena screenshot.
5. Smoke test semua route setelah perubahan; test synthetic Playwright = FE-only, real DEV backend E2E diberi label TERPISAH.
6. Submit PR beserta checklist per screenshot, daftar blocker FE vs BE, video/screenshot AFTER. **Tunggu review sebelum merge/deploy DEV; production dilarang disentuh.**

## Bukti dasar (16 Okt)
- FE DEV HEAD pada saat brief: \`3dd3991d\` (PR #30, checkout/reset E2E synthetic PASS).
- DEV payment readiness (read-only): \`canAcceptLivePayments=false\`, \`status=DemoOnly\`, \`availableMethods=[]\`, \`isSandbox=false\`.
- Beberapa kartu akun game berlabel DEMO, dan merchandise home terobservasi repetitif; ini *findings*, bukan izin untuk membuat produk palsu demi screenshot.
- Order lookup PR #29 asli dipertahankan: order number + email/phone, bukan nama pesanan.

**Definisi Done:** tidak ada desain kritis terlewat tanpa alasan; UI dan state sesuai referensi **dan** perilaku tidak menipu pengguna. FE-belonging fixes jelas; BE dependencies didokumentasikan. Tidak boleh klaim “Figma 1:1” hanya dari E2E smoke PASS.
