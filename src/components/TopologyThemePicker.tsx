import { useUiStore, type TopologyTheme } from '../stores/useUiStore'

const THEMES: { id: TopologyTheme; label: string }[] = [
  { id: 'dark-ops', label: 'Dark Ops' },
  { id: 'fintech-neon', label: 'Fintech Neon' },
  { id: 'enterprise-infra', label: 'Enterprise Infra' },
  { id: 'runtime-terminal', label: 'Runtime Terminal' },
]

export function TopologyThemePicker() {
  const theme = useUiStore((s) => s.topologyTheme)
  const setTheme = useUiStore((s) => s.setTopologyTheme)

  return (
    <label className="ff-theme-picker">
      <span className="ff-theme-picker__label">Theme</span>
      <select
        className="ff-theme-picker__select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as TopologyTheme)}
        aria-label="Topology theme"
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  )
}
