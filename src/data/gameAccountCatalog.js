export const GAME_ACCOUNT_CART_KEY = 'zetruv-game-account-cart-v1'

export const gameAccountGames = [
  { slug: 'mobile-legends', name: 'Mobile Legends', publisher: 'Moonton', image: '/assets/search/mobile-legends.webp' },
  { slug: 'dota-2', name: 'Dota 2', publisher: 'Valve', image: '/assets/game-accounts/dota-2.png' },
  { slug: 'valorant', name: 'Valorant', publisher: 'Riot Games', image: '/assets/search/valorant.webp' },
  { slug: 'pubg-mobile', name: 'PUBG Mobile', publisher: 'Tencent', image: '/assets/search/pubg-mobile.webp' },
  { slug: 'genshin-impact', name: 'Genshin Impact', publisher: 'HoYoverse', image: '/assets/search/genshin-impact.webp' },
  { slug: 'call-of-duty-mobile', name: 'Call of Duty Mobile', publisher: 'Activision', image: '/assets/search/cod-mobile.webp' },
]

const dotaAccounts = [
  { slug: 'divine-5-126-heroes', title: 'Divine 5 · 126 Heroes', rank: 'Divine 5', region: 'SEA', level: 92, heroes: 126, tags: ['24 Arcana', 'Prime'], price: 1850000, available: true, email: 'Dapat diubah', warranty: '7 hari' },
  { slug: 'immortal-147-heroes', title: 'Immortal · 147 Heroes', rank: 'Immortal', region: 'SEA', level: 101, heroes: 147, tags: ['Collector', '42 Arcana'], price: 2750000, available: true, email: 'Dapat diubah', warranty: '7 hari' },
  { slug: 'ancient-4-118-heroes', title: 'Ancient 4 · 118 Heroes', rank: 'Ancient 4', region: 'SEA', level: 78, heroes: 118, tags: ['18 Arcana', 'Rare'], price: 1250000, available: false, email: 'Dapat diubah', warranty: '7 hari' },
  { slug: 'legend-3-103-heroes', title: 'Legend 3 · 103 Heroes', rank: 'Legend 3', region: 'SEA', level: 69, heroes: 103, tags: ['9 Arcana', 'Budget'], price: 875000, available: false, email: 'Dapat diubah', warranty: '7 hari' },
]

export function getGame(slug = 'dota-2') {
  return gameAccountGames.find((game) => game.slug === slug) || gameAccountGames[1]
}

export function getAccounts(gameSlug = 'dota-2') {
  const game = getGame(gameSlug)
  if (game.slug === 'dota-2') return dotaAccounts.map((item) => ({ ...item, game }))
  return dotaAccounts.map((item, index) => ({
    ...item,
    game,
    slug: `${game.slug}-${index + 1}`,
    title: `${item.rank} · ${game.slug === 'mobile-legends' ? `${48 - index * 5}★ · ${126 - index * 8} Skin` : item.title.split('·')[1].trim()}`,
  }))
}

export function getAccount(gameSlug, accountSlug) {
  return getAccounts(gameSlug).find((item) => item.slug === accountSlug) || getAccounts(gameSlug)[0]
}

export function saveGameAccountCart(account) {
  window.sessionStorage.setItem(GAME_ACCOUNT_CART_KEY, JSON.stringify(account))
}

export function readGameAccountCart() {
  try {
    return JSON.parse(window.sessionStorage.getItem(GAME_ACCOUNT_CART_KEY) || 'null') || getAccounts('dota-2')[0]
  } catch {
    return getAccounts('dota-2')[0]
  }
}

export const rupiahAccount = (value = 0) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`
