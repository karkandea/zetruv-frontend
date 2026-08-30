import { assets } from './assets'

export const homepageMock = {
  registeredUsers: 100000,
  flashSaleEndsAt: '01:04:35',
  flashSale: [
    { id: 'ml-flash', name: 'Mobile Legend', image: assets.flashMobileLegends, price: 10000, originalPrice: 50000, item: '100 Diamond' },
    { id: 'pubg-flash', name: 'PUBG Mobile', image: assets.flashPubg, price: 10000, originalPrice: 50000, item: '100 Diamond' },
    { id: 'valorant-flash', name: 'Valorant', image: assets.flashValorant, price: 10000, originalPrice: 50000, item: '100 Diamond' },
  ],
  trending: [
    { id: 'ml', name: 'Mobile Legend', publisher: 'Moonton', image: assets.mobileLegends, category: 'topup' },
    { id: 'pubg', name: 'PUBG Mobile', publisher: 'Tencent', image: assets.pubg, category: 'topup' },
    { id: 'valorant', name: 'Valorant', publisher: 'RIOT', image: assets.valorant, category: 'topup' },
    { id: 'codm', name: 'Call of Duty Mobile', publisher: 'Treyarch', image: assets.codm, category: 'topup' },
    { id: 'codm-2', name: 'Call of Duty Mobile', publisher: 'Treyarch', image: assets.codm, category: 'topup' },
    { id: 'ff', name: 'Free Fire', publisher: 'Garena', image: assets.freeFire, category: 'login' },
    { id: 'genshin', name: 'Genshin Impact', publisher: 'HoYoverse', image: assets.genshin, category: 'login' },
    { id: 'fc', name: 'FC Mobile', publisher: 'EA Sports', image: assets.fcMobile, category: 'topup' },
    { id: 'hsr', name: 'Star Rail', publisher: 'HoYoverse', image: assets.starRail, category: 'jockey' },
    { id: 'undawn', name: 'Undawn', publisher: 'Level Infinite', image: assets.undawn, category: 'jockey' },
  ],
}
