# FE vs visual source — audit findings (16 Oktober 2026)

This is a **read-only audit snapshot**, not a complete frame-by-frame / pixel-perfect certification. Source screenshots are stored in sibling directory \`screenshots/\` and indexed in \`README.md\`.

## What was inspected
- Design file inventory: 21 pages including canonical Homepage V2, auth, Digital Purchase Flow (Via ID, Via Login, Voucher, Joki, Game Account), Physical Purchase Flow, Status Order, Akun Saya, Article, Desktop/Mobile, Admin CMS, review, and archives.
- Live DEV storefront (read-only): homepage, product/listing, accounts, article, order lookup, checkout landing pages; source FE on \`dev\` at \`3dd3991d\`.
- Findings must distinguish **visual mismatch** from **unavailable because BE integration is missing**.

## Verified gaps
| Surface | Observed mismatch | Next owner |
| --- | --- | --- |
| Homepage | Figma final shows three different merchandise products (jersey, deskmat, keycaps), live DEV had a repeating jersey carousel. Flash Sale not shown: may be **correct** if current API returns 0 active items. | FE/CMS data |
| Merchandise PDP | Custom printed name (optional, free, max 12 chars) missing, Details & Care tab missing/replaced; stock/reviews/sold counts hardcoded in source. | FE + BE contract for eventual order |
| Merchandise checkout/payment | Fully illustrated in Figma, but DEV intentionally blocks transactions. **Do not make fake payments** to replicate mock. | BE blocker, FE layout later |
| Game Account checkout/payment | Source code still contains \`ORDER_KEY='zetruv-order-preview-v1'\`, \`AUTH_PREVIEW_KEY='zetruv-auth-preview'\`, and session-generated preview order. This must not be treated as actual E2E payment. | P0 FE |
| Account order history/detail | Figma has populated/empty, progress, failures. FE real data list/detail not wired; some screens explicitly say not available. | BE endpoints + FE |
| Account address book | Figma has address list and add/edit. FE refuses to save, correctly avoiding bogus saved personal data. | BE endpoints + FE |
| Order status | User-provided number+email/phone lookup is real API; Figma has multiple fulfillment states beyond current UI. Need backend fields & service-specific UI mapping, not fake records. | FE + BE + QA |
| Articles | Figma includes featured/filters/cards/newsletter. Source \`ArticlePages.jsx\` still uses local content; Subscribe form uses only \`preventDefault()\`. | FE/CMS + newsletter backend |
| Mobile | Physical 390px list/PDP layouts and Game Account responsive states exist in PNG pack. Interactive side-by-side visual QA not yet fully completed. | FE/QA |
| Admin CMS | Canonical visual source exists; current admin FE has its own modules. Do not mix this scope into storefront PR. | Separate FE/CMS review |

## Already implemented: do not regress
- PR #28 UX polish, PR #29 real contact-verified order lookup, PR #30 synthetic checkout/reset tests.
- Digital checkout readiness gate, server-owned payment status, duplicate-order protections, guest cart merge/409 conflict logic.
- DEV \`checkout/payment-options\` returned DemoOnly/empty when audited; no live payment E2E can be claimed.

## Honest limits
- Authenticated account populated states not live-tested with user credentials.
- Many screenshots capture design *sample records*; samples are for visual fidelity only and must never be seeded in DEV as orders/payment statuses.
- 52 visual assets are selected key frame exports, **not every frame**. Specific Voucher Checkout export could not be obtained; marked unverified.
- No FE commits, deploy or backend changes are part of this screenshot handoff branch.

## Handoff flow
Screenshot index → implement on feature branch → PR BEFORE/AFTER visual evidence → isolated synthetic tests + real DEV API checks → review → deploy DEV only on approval.
