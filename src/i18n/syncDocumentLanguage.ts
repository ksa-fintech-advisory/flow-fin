export function syncDocumentLanguage(lng: string): void {
  const locale = lng === 'en' ? 'en' : 'ar'
  const root = document.documentElement
  root.lang = locale
  root.dir = locale === 'ar' ? 'rtl' : 'ltr'
}
