import { searchAssets } from './searchAssets'

// Demo-only catalog while these SKUs are absent from the public API.
// Never reuse Mobile Legends details for a different slug.
const variants = (slug, unit, amounts, priceStep) => amounts.map((amount, index) => ({
  id: `${slug}-${index + 1}`,
  name: `${amount} ${unit}`,
  price: priceStep * (index + 1),
  effectivePrice: priceStep * (index + 1),
  isAvailable: true,
}))

const idGame = (slug, name, publisher, cover, category, accountLabels, skuItems) => ({
  id: `demo-topup-${slug}`,
  slug,
  name,
  kind: 'TopUpGame',
  fulfillmentMethod: 'AUTO_ID',
  game: { name, publisher, imageUrl: cover },
  thumbnailUrl: cover,
  category: { name: category },
  accountLabels,
  variants: skuItems,
  isDemo: true,
})

export const demoTopUpProducts = {
  'mobile-legends': idGame(
    'mobile-legends','Mobile Legends: Bang Bang','Moonton',
    searchAssets.mobileLegends,'Diamonds',
    { first: 'User ID', second: 'Zona', needsSecond: true },
    variants('ml','Diamond',[5,50,100,250,500],12000),
  ),
  'pubg-mobile': idGame(
    'pubg-mobile','PUBG Mobile','Tencent',searchAssets.pubgMobile,
    'UC',{ first: 'Character ID', second: '', needsSecond: false },
    variants('pubg','UC',[60,325,660,1800,3850],15000),
  ),
  'valorant': idGame(
    'valorant','Valorant','Riot Games',searchAssets.valorant,
    'Valorant Points',{ first: 'Riot ID', second: 'Tagline', needsSecond: true },
    variants('valorant','VP',[125,420,700,1375,2400],22000),
  ),
  'genshin-impact': idGame(
    'genshin-impact','Genshin Impact','HoYoverse',searchAssets.genshinImpact,
    'Genesis Crystals',{ first: 'UID', second: '', needsSecond: false },
    variants('genshin','Genesis Crystals',[60,300,980,1980,3280],16500),
  ),
  'call-of-duty-mobile': idGame(
    'call-of-duty-mobile','Call of Duty Mobile','Activision',searchAssets.callOfDutyMobile,
    'CP',{ first: 'Player UID', second: '', needsSecond: false },
    variants('codm','CP',[80,400,800,2000,4000],18000),
  ),
  'honkai-star-rail': idGame(
    'honkai-star-rail','Honkai: Star Rail','HoYoverse',searchAssets.starRail,
    'Oneiric Shards',{ first: 'UID', second: '', needsSecond: false },
    variants('star-rail','Oneiric Shards',[60,300,980,1980,3280],16500),
  ),
}

export function getDemoTopUp(slug) {
  return demoTopUpProducts[slug] || null
}
