import { stableIcons } from './stableIcons'
import { homepageLocalAssets } from './homepageLocalAssets'
import authHero from '../assets/auth/auth-hero.png'
import authEye from '../assets/auth/auth-eye.png'

// All runtime UI assets are local/Vite-bundled or stable inline SVG data.
// Do not reintroduce temporary figma.com/api/mcp/asset URLs: they expire.
export const assets = {
  ...homepageLocalAssets,
  ...stableIcons,

  authHero,
  authEye,
  authBackArrow: '/assets/auth/forgot-back.png',
  authMail: '/assets/auth/forgot-mail.png',
  authSuccess: '/assets/auth/forgot-success.png',
  authRegisterVerify: '/assets/auth/register-verify.png',
  authRegisterVerified: '/assets/auth/register-verified.png',
  authRegisterExpired: '/assets/auth/register-expired.png',

  // Legacy aliases still consumed by mock/fallback data.
  categoryTopUp: homepageLocalAssets.homepageCategoryTopUp,
  categoryVoucher: homepageLocalAssets.homepageCategoryVoucher,
  categoryJockey: homepageLocalAssets.homepageCategoryJockey,
  categoryMerch: homepageLocalAssets.homepageCategoryMerch,
  categoryRingBlue: stableIcons.homepageCategoryRing,
  categoryRingPink: stableIcons.homepageCategoryRing,
}
