// Mirrors OrderFulfillmentService.IsAllowedTransition; the backend remains authoritative.
export function nextFulfillmentStatuses(current, paymentStatus) {
  if (paymentStatus !== 'Paid') return []
  switch (current) {
    case 'Pending': return ['Processing']
    case 'Processing': return ['Completed', 'Failed']
    case 'Failed': return ['Processing']
    default: return []
  }
}
