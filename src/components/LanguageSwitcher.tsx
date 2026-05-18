import { useTranslation } from 'react-i18next'
import { persistLocale, type AppLocale } from '../i18n'

const OPTIONS: { id: AppLocale; labelKey: string }[] = [
  { id: 'ar', labelKey: 'language.ar' },
  { id: 'en', labelKey: 'language.en' },
]

type LanguageSwitcherProps = {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language === 'en' ? 'en' : 'ar') as AppLocale

  const onChange = (next: AppLocale) => {
    if (next === locale) return
    persistLocale(next)
    void i18n.changeLanguage(next)
  }

  return (
    <div className={className ? `ff-lang-switch ${className}` : 'ff-lang-switch'} role="group" aria-label={t('language.label')}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`ff-lang-switch__btn${locale === opt.id ? ' ff-lang-switch__btn--active' : ''}`}
          onClick={() => onChange(opt.id)}
          aria-pressed={locale === opt.id}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  )
}
