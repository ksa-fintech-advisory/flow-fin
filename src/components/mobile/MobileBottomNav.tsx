import { useUiStore, type MobilePanel } from '../../stores/useUiStore'

const TABS: { id: MobilePanel; label: string; hint: string }[] = [
  { id: 'topology', label: 'Topology', hint: 'Graph & node focus' },
  { id: 'events', label: 'Events', hint: 'Operational trace' },
  { id: 'runtime', label: 'Runtime', hint: 'Playback & metrics' },
]

export function MobileBottomNav() {
  const panel = useUiStore((s) => s.mobilePanel)
  const setMobilePanel = useUiStore((s) => s.setMobilePanel)

  return (
    <nav className="ff-mobile-nav" aria-label="Companion views">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`ff-mobile-nav__btn${panel === tab.id ? ' ff-mobile-nav__btn--active' : ''}`}
          onClick={() => setMobilePanel(tab.id)}
          aria-current={panel === tab.id ? 'page' : undefined}
          title={tab.hint}
        >
          <span className={`ff-mobile-nav__icon ff-mobile-nav__icon--${tab.id}`} aria-hidden />
          <span className="ff-mobile-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
