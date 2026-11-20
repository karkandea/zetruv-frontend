export function isOrderRoute(pathname) {
  return /^\/(?:order-status|track-order)\/*$/.test(pathname) ||
    /^\/account\/orders(?:\/|$)/.test(pathname)
}
