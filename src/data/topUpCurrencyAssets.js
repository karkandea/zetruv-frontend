import mobile5 from '../assets/topup-currency/ml-diamond-5.png'
import mobile50 from '../assets/topup-currency/ml-diamond-50.png'
import mobile100 from '../assets/topup-currency/ml-diamond-100.png'
import mobile250 from '../assets/topup-currency/ml-diamond-250.png'
import mobile500 from '../assets/topup-currency/ml-diamond-500.png'
import pubgUC from '../assets/topup-currency/pubg-uc.svg'
import valorantVP from '../assets/topup-currency/valorant-vp.svg'
import genshinCrystals from '../assets/topup-currency/genshin-genesis.svg'
import codmCP from '../assets/topup-currency/codm-cp.svg'
import starRailShards from '../assets/topup-currency/honkai-oneiric.svg'

/**
 * SKU images are currency artwork, NOT the game's cover/thumbnail.
 * Mobile Legends uses the exact five 36px item assets from Figma 3870:10508.
 * The other game currencies have distinct locally bundled artwork.
 */
const currencyArt = Object.freeze({
  'pubg-mobile': { image: pubgUC, label: 'PUBG Mobile UC' },
  valorant: { image: valorantVP, label: 'Valorant Points' },
  'genshin-impact': { image: genshinCrystals, label: 'Genesis Crystals' },
  'call-of-duty-mobile': { image: codmCP, label: 'Call of Duty Points' },
  'honkai-star-rail': { image: starRailShards, label: 'Oneiric Shards' },
})

const mlArt = [mobile5, mobile50, mobile100, mobile250, mobile500]

export function getTopUpCurrencyArt(slug, variant, index = 0) {
  if (slug === 'mobile-legends') {
    const amount = Number(String(variant?.name || '').match(/\d+/)?.[0])
    const variantIndex = [5, 50, 100, 250, 500].indexOf(amount)
    const position = variantIndex === -1 ? Math.min(index, mlArt.length - 1) : variantIndex
    return { image: mlArt[position], label: 'Mobile Legends Diamonds' }
  }
  return currencyArt[slug] || null
}
