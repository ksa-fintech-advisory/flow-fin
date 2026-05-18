import { useTranslation } from 'react-i18next'

export function SkipLink() {
  const { t } = useTranslation()
  return (
    <a href="#main-content" className="ff-skip-link">
      {t('skipLink')}
    </a>
  )
}
