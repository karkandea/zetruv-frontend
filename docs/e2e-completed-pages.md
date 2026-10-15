# Zetruv DEV — E2E acceptance of 11 Notion-Complete pages

**Target:** https://dev.zetruv.com and https://api-dev.zetruv.com (VPS DEV only). **Never client production.**

This first check runs headless Chromium on the existing self-hosted GitHub Actions runner, probes deployed DEV on desktop and mobile, blocks all API mutations, and records screenshots + JSON results. **A passing smoke test means a page renders, NOT that checkout, payments, orders or addresses are wired to backend.**

| Notion page | DEV route / test | Current integration status, inspected 2026-10-15 |
| --- | --- | --- |
| Login & Registrasi | Home → Login/Register modal | Login POST /auth/login and registration POST /auth/register exist; real verified login requires dedicated seeded DEV test customer. Forgot/reset modal currently includes local-only state transitions. |
| Homepage | / | Backend homepage fetch exists; live response and content must be verified per scenario. |
| Hasil Pencarian | /search?q=mobile | GET catalog/search integrated partially; static seed/fallback data exists in SearchPage. |
| Detail Produk Fisik | /merchandise/zetruv-gaming-jersey | PhysicalPurchasePages has a hardcoded four-product PRODUCTS array, prices/stock and local physical cart; **not yet backend authoritative**. |
| Favorit / Wishlist | Product toggle → /account/favorites | favoritesService persists locally. Cross-device and customer-owned API require backend endpoint, authentication, migration and tests. |
| Pesanan Berhasil | /order-status?view=via-id | SharedOrderStatusPage is hardcoded illustration with example order details; not a real completed order from backend. |
| Status Pembayaran | /payment?flow=physical&state=pending | PhysicalPaymentPage uses state query and example presentation; real order/token/payment status must be sourced server-side. |
| Riwayat Pesanan | /account/orders | AccountPages has hardcoded `orders` array. Backend only GET /me/orders/{orderId:guid}; **customer list endpoint missing**. |
| Detail Pesanan Fisik | /account/orders/ZTR-260817-0871?state=transit | OrderJourneyPages has static example IDs/states; backend detail endpoint requires real GUID + customer auth. |
| Alamat Saya | /account/addresses | Address fields/values are hardcoded. Save redirects without writing anything. Backend customer address CRUD not established. |
| Daftar Artikel | /articles → detail | ArticlePages article list/detail is static. Public GET /articles and /articles/{slug} backend endpoints exist; wire and test CMS publishing. |

## Acceptance policy

1. **Smoke**: all eleven page routes, Login/Register UI and safe local interactions work on desktop/mobile, with no uncaught JS errors, screenshots saved.
2. **Integrated**: replace fixtures with backend data and ownership protection; add real seeded DEV test customers/orders/catalog/articles, authenticated API contract and cross-device assertions.
3. **Payment**: use sandbox provider and explicit test order, never charge live accounts or mark a payment complete based on query parameters.
4. **Security**: unauthorized guests must not see private orders/addresses; session A cannot see customer B's data; fallback must never present sample orders as actual user orders.
5. **Promotion**: Notion Complete is UI status only. Mark E2E Ready only after integration suites pass and provenance is documented.

Run via GitHub Actions **Zetruv DEV completed pages E2E (VPS)**. This workflow does not push builds, edit DB records, or perform payment/checkout mutations. Output: action artifact `zetruv-dev-completed-pages-e2e`.
