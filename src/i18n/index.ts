import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from '../locales/ar.json'
import en from '../locales/en.json'
import { syncDocumentLanguage } from './syncDocumentLanguage'

export const DEFAULT_LOCALE = 'ar'
export const FALLBACK_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['ar', 'en'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'flowfin.locale'

export function readStoredLocale(): AppLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ar' || stored === 'en') return stored
  } catch {
    /* private mode / blocked storage */
  }
  return null
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: readStoredLocale() ?? DEFAULT_LOCALE,
  fallbackLng: FALLBACK_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
})

syncDocumentLanguage(i18n.language)
i18n.on('languageChanged', syncDocumentLanguage)

export { i18n }
export default i18n
