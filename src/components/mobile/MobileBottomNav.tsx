import { useTranslation } from 'react-i18next'
import { useUiStore, type MobilePanel } from '../../stores/useUiStore'

const TABS: { id: MobilePanel; labelKey: string; hintKey: string }[] = [
  { id: 'topology', labelKey: 'mobile.topology', hintKey: 'mobile.topologyHint' },
  { id: 'events', labelKey: 'mobile.events', hintKey: 'mobile.eventsHint' },
  { id: 'runtime', labelKey: 'mobile.runtime', hintKey: 'mobile.runtimeHint' },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const panel = useUiStore((s) => s.mobilePanel)
  const setMobilePanel = useUiStore((s) => s.setMobilePanel)

  return (
    <nav className="ff-mobile-nav" aria-label={t('aria.companionViews')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`ff-mobile-nav__btn${panel === tab.id ? ' ff-mobile-nav__btn--active' : ''}`}
          onClick={() => setMobilePanel(tab.id)}
          aria-current={panel === tab.id ? 'page' : undefined}
          title={t(tab.hintKey)}
        >
          <span className={`ff-mobile-nav__icon ff-mobile-nav__icon--${tab.id}`} aria-hidden />
          <span className="ff-mobile-nav__label">{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  )
}
