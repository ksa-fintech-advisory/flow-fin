import { useTranslation } from 'react-i18next'
import { useUiStore, type TopologyTheme } from '../stores/useUiStore'

const THEMES: { id: TopologyTheme; labelKey: string }[] = [
  { id: 'dark-ops', labelKey: 'themes.darkOps' },
  { id: 'fintech-neon', labelKey: 'themes.fintechNeon' },
  { id: 'enterprise-infra', labelKey: 'themes.enterpriseInfra' },
  { id: 'runtime-terminal', labelKey: 'themes.runtimeTerminal' },
]

export function TopologyThemePicker() {
  const { t } = useTranslation()
  const theme = useUiStore((s) => s.topologyTheme)
  const setTheme = useUiStore((s) => s.setTopologyTheme)

  return (
    <label className="ff-theme-picker">
      <span className="ff-theme-picker__label">{t('common.theme')}</span>
      <select
        className="ff-theme-picker__select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as TopologyTheme)}
        aria-label={t('aria.topologyTheme')}
      >
        {THEMES.map((item) => (
          <option key={item.id} value={item.id}>
            {t(item.labelKey)}
          </option>
        ))}
      </select>
    </label>
  )
}
