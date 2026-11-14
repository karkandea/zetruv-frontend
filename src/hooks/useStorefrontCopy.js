import { useNavbarLanguage } from './useNavbarLanguage'
import { storefrontCopy } from '../services/storefrontCopy'

export function useStorefrontCopy() {
  return storefrontCopy[useNavbarLanguage()]
}
