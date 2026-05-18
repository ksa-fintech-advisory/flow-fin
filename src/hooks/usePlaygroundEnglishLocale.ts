import { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE, readStoredLocale } from '../i18n'

/** Playground UI is always English; restore the user's locale when leaving. */
export function usePlaygroundEnglishLocale(): void {
  const { i18n } = useTranslation()

  useLayoutEffect(() => {
    void i18n.changeLanguage('en')

    return () => {
      void i18n.changeLanguage(readStoredLocale() ?? DEFAULT_LOCALE)
    }
  }, [i18n])
}
