# CMS discount vouchers

The admin console keeps its existing template. New Discount vouchers navigation controls the discount-voucher backend contract used by customer preview and checkout.

- Create/edit: code, fixed or percentage, optional cap, minimum eligible spend, product kind, usage limits, schedule and active state.
- Display: active/scheduled/expired/disabled, used claims, total limit, per-customer limit and amount.
- Immutable discount rules after a claim; editable publishing and total limits remain server-validated.
- Disable is a soft-disable; orders retain the discount they received.
- Order details display applied voucher code and voucher-specific discount separately from the combined discountAmount.
- Backing endpoints: /api/v1/cms/discount-vouchers, /api/v1/checkout/vouchers/preview, /api/v1/checkout/orders.
- Backend PR must deploy/migrate before this UI is deployed. There is no customer storefront implementation here and no pretend QRIS, bank transfer or provider-paid state.
