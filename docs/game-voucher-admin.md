# Game Voucher inventory in CMS

The CMS keeps the existing Zetruv admin template.
This page is operational wiring for the Digital Purchase customer flow; it is not a separate Figma redesign.

## Catalog > Game Voucher > Variant

Game Voucher stock is read-only.
Sellable stock is controlled by encrypted redeem-code inventory in the backend.

Each Game Voucher variant has a **Codes** action.
The inventory modal shows:
- sellable stock,
- unassigned code count,
- assigned code count,
- revoked code count,
- non-secret assignment/reveal metadata.

Admins can paste up to 500 codes per import, one code per line.
The browser sends raw values once to the authenticated CMS endpoint.
After import, CMS never displays those raw values again.
Duplicate codes are reported as skipped.

Available codes can be revoked only when they are not needed by an active payment reservation.
Assigned codes cannot be revoked.
## Orders

Game Voucher fulfillment is system-managed.
The regular manual fulfillment controls are hidden for Game Voucher order items.

When payment is Paid and encrypted inventory is available, backend automatically assigns code(s)
and changes the Game Voucher item to Completed.

CMS displays only non-secret fulfillment state/reference.
A completed item explicitly notes that raw redeem codes are visible only to the owning customer.

If allocation fails with an inventory shortage, a paid failed Game Voucher item gets
**Retry code allocation**.
The intended recovery flow is:
1. import legitimate replacement code(s) on the affected SKU,
2. return to the paid order,
3. retry code allocation.

Admin cannot paste a redeem code into fulfillment reference and mark the item complete.

## Deployment ordering

Deploy/migrate the backend Game Voucher inventory contract before deploying this CMS UI.
The customer storefront is not changed by this admin PR.
Real payment-provider channel integration remains separate.
