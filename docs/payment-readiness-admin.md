# CMS Payment Readiness

In Site settings, the existing CMS design template now displays a separate Payment readiness panel. CMS "Payment methods" fields below it continue to configure **display metadata only**; a logo, enabled toggle, or code does not make a payment channel operational.

The panel reads `GET /api/v1/cms/payments/readiness` and shows resolved provider, whether the backend reports a live operational payment channel, and how many configured CMS methods are actually supported.

A missing/unavailable readiness API fails closed in the UI: the message says the gateway cannot be verified, rather than assuming methods work. This supports staggered deployment: backend first, CMS second.

Does not change customer storefront, add fake payment statuses, or claim real QRIS/VA/e-wallet connectivity.
