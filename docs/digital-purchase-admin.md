# Admin digital purchase wiring

Reference: https://www.figma.com/design/HVAurT3YUzZfZb7b5yUBla/Zetruv---Redesign--Web-Phase-1-?node-id=3064-8

- CMS Product > Variants: configure optional package group labels, e.g. Diamonds / Starlight. This requires backend PR `feat/digital-purchase-cms-contract` migration/API.
- CMS Orders: show backend-derived order/payment status, genuine transaction history, per-item fulfillment transitions, and pending transaction provider reconciliation; no simulated Paid button.
- Read-only operational references and notes; sensitive MANUAL_LOGIN values do not enter admin form.
- No customer storefront pages changed. Figma node is a customer purchase flow and does not contain a CMS-specific visual spec. The CMS uses existing admin design conventions; customer-screen pixel parity is not claimed.
- The reference includes voucher code validation, payment-method selection, prepaid voucher-code issuance, multi-destination cart, and order create idempotency that remain separate backend work, **not** silently treated as implemented.
