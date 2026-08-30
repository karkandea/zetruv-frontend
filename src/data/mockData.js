import { assets } from './assets'

export const homepageMock = {
  flashSaleEndsAt: '01:04:35',
  serviceCategories: [
    { id: 'topup', label: 'Top Up Games', image: assets.categoryTopUp, ring: assets.categoryRingBlue },
    { id: 'voucher', label: 'Voucher Game', image: assets.categoryVoucher, ring: assets.categoryRingPink },
    { id: 'jockey', label: 'Joki Game', image: assets.categoryJockey, ring: assets.categoryRingBlue },
    { id: 'merch', label: 'Merchandise', image: assets.categoryMerch, ring: assets.categoryRingPink },
  ],
  popularGames: [
    { id: 'popular-ml', name: 'Mobile Legend', image: assets.popularMl },
    { id: 'popular-ff', name: 'Garena Free Fire', image: assets.popularFreeFire },
    { id: 'popular-val', name: 'Valorant', image: assets.popularValorant },
    { id: 'popular-pubg-1', name: 'PUBG Mobile', image: assets.popularPubg },
    { id: 'popular-pubg-2', name: 'PUBG Mobile', image: assets.popularPubgAlt },
    ...Array.from({ length: 5 }, (_, index) => ({ id: `popular-pubg-${index + 3}`, name: 'PUBG Mobile', image: assets.popularPubgAlt })),
  ],
  recentPurchases: [
    { id: 'recent-ml', name: '86 Diamonds MLBB', image: assets.recentMl },
    { id: 'recent-pubg', name: '300+ UC PUBG Mobile', image: assets.recentPubg },
    { id: 'recent-val', name: '100+ VP Valorant', image: assets.recentValorant },
  ],
  flashSale: [
    { id: 'ml-flash', name: 'Mobile Legend', image: assets.flashMobileLegends, price: 10000, originalPrice: 50000, item: '100 Diamond' },
    { id: 'pubg-flash', name: 'PUBG Mobile', image: assets.flashPubg, price: 10000, originalPrice: 50000, item: '100 Diamond' },
    { id: 'valorant-flash', name: 'Valorant', image: assets.flashValorant, price: 10000, originalPrice: 50000, item: '100 Diamond' },
  ],
  jockeyGames: [
    { id: 'ml', name: 'Mobile Legend', publisher: 'Moonton', image: assets.mobileLegends },
    { id: 'pubg', name: 'PUBG Mobile', publisher: 'Tencent', image: assets.pubg },
    { id: 'valorant', name: 'Valorant', publisher: 'RIOT', image: assets.valorant },
    { id: 'codm', name: 'Call of Duty Mobile', publisher: 'Treyarch', image: assets.codm },
    { id: 'codm-2', name: 'Call of Duty Mobile', publisher: 'Treyarch', image: assets.codm },
    { id: 'ff', name: 'Free Fire', publisher: 'Moonton', image: assets.freeFire },
    { id: 'genshin', name: 'Genshin Impact', publisher: 'Tencent', image: assets.genshin },
    { id: 'fc', name: 'FC Mobile', publisher: 'RIOT', image: assets.fcMobile },
    { id: 'hsr', name: 'Star Rail', publisher: 'Treyarch', image: assets.starRail },
    { id: 'undawn', name: 'Undawn', publisher: 'Treyarch', image: assets.undawn },
  ],
  merchandise: Array.from({ length: 5 }, (_, index) => ({
    id: `jersey-${index + 1}`,
    name: 'Zetruv Gaming Jersey',
    variant: 'Black · Size S–XL',
    price: 249000,
    sold: 128,
    rating: 4.9,
    image: assets.jersey,
  })),
}
