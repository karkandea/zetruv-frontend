import { useEffect, useState } from 'react'
import { NAVBAR_LANGUAGE_STORAGE_KEY, normalizeNavbarLanguage, readNavbarLanguage } from '../services/navbarLanguage'

const languageChangeEvent = 'zetruv:navbar-language-change'

export function setNavbarLanguage(code) {
  const language = normalizeNavbarLanguage(code)
  try {
    window.localStorage.setItem(NAVBAR_LANGUAGE_STORAGE_KEY, language)
  } catch {
    // The current page still gets the selection when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(languageChangeEvent, { detail: language }))
}

export function useNavbarLanguage() {
  const [language, setLanguage] = useState(readNavbarLanguage)

  useEffect(() => {
    function onLanguageChange(event) {
      setLanguage(event.detail)
    }

    function onStorage(event) {
      if (event.key === NAVBAR_LANGUAGE_STORAGE_KEY || event.key === null) {
        setLanguage(readNavbarLanguage())
      }
    }

    window.addEventListener(languageChangeEvent, onLanguageChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(languageChangeEvent, onLanguageChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return language
}
