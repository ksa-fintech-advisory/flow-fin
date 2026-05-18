import { useEffect, useRef } from 'react'
import { NavLink, Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SCENARIOS } from '../fdl/scenarios'
import { useScenarioDisplay } from '../hooks/useScenarioDisplay'
import { useGraphStore } from '../stores/useGraphStore'

function domainSlug(domain: unknown): string {
  if (typeof domain === 'string' && domain.length) return domain
  return 'general'
}

function ScenarioChip({ scenario }: { scenario: (typeof SCENARIOS)[number] }) {
  const { title, subtitle } = useScenarioDisplay(scenario)
  const setScenarioId = useGraphStore((s) => s.setScenarioId)

  return (
    <li>
      <NavLink
        to={`/playground/${scenario.id}`}
        className={({ isActive }) =>
          `ff-scenario-chip${isActive ? ' ff-scenario-chip--active' : ''}`
        }
        title={subtitle}
        onClick={() => setScenarioId(scenario.id)}
        end
      >
        <span
          className={`ff-scenario-chip__dot ff-scenario-chip__dot--${domainSlug(scenario.flow.metadata?.domain)}`}
          aria-hidden
        />
        <span className="ff-scenario-chip__title">{title}</span>
      </NavLink>
    </li>
  )
}

/** Compact horizontal flow picker — sits under the orchestration bar. */
export function PlaygroundScenarioStrip() {
  const { t } = useTranslation()
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list || !scenarioId) return
    const active = list.querySelector('.ff-scenario-chip--active')
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [scenarioId])

  return (
    <nav className="ff-scenario-strip" aria-label={t('aria.exampleFlows')}>
      <span className="ff-scenario-strip__label">{t('common.flows')}</span>
      <ul ref={listRef} className="ff-scenario-strip__list">
        {SCENARIOS.map((s) => (
          <ScenarioChip key={s.id} scenario={s} />
        ))}
      </ul>
      <Link to="/" className="ff-scenario-strip__catalog" title={t('aria.allScenarios')}>
        {t('common.all')}
      </Link>
    </nav>
  )
}
