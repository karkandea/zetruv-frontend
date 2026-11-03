// Match only recognized game titles; unknown products keep their own thumbnails.
export function identifyHomepageGame(name) {
  const normalized = String(name ?? '').toLowerCase()
  if (/mobile legends|mlbb/.test(normalized)) return 'mlbb'
  if (/genshin/.test(normalized)) return 'genshin'
  if (/pubg|playerunknown/.test(normalized)) return 'pubg'
  if (/valorant/.test(normalized)) return 'valorant'
  if (/free fire/.test(normalized)) return 'freeFire'
  if (/call of duty|codm/.test(normalized)) return 'codm'
  return null
}
