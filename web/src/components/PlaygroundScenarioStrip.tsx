import { useEffect, useRef } from 'react'
import { NavLink, Link, useParams } from 'react-router-dom'
import { SCENARIOS } from '../fdl/scenarios'
import { useGraphStore } from '../stores/useGraphStore'

function domainSlug(domain: unknown): string {
  if (typeof domain === 'string' && domain.length) return domain
  return 'general'
}

/** Compact horizontal flow picker — sits under the orchestration bar. */
export function PlaygroundScenarioStrip() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const setScenarioId = useGraphStore((s) => s.setScenarioId)
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
    <nav className="ff-scenario-strip" aria-label="Example flows">
      <span className="ff-scenario-strip__label">Flows</span>
      <ul ref={listRef} className="ff-scenario-strip__list">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <NavLink
              to={`/playground/${s.id}`}
              className={({ isActive }) =>
                `ff-scenario-chip${isActive ? ' ff-scenario-chip--active' : ''}`
              }
              title={s.subtitle}
              onClick={() => setScenarioId(s.id)}
              end
            >
              <span
                className={`ff-scenario-chip__dot ff-scenario-chip__dot--${domainSlug(s.flow.metadata?.domain)}`}
                aria-hidden
              />
              <span className="ff-scenario-chip__title">{s.title}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <Link to="/" className="ff-scenario-strip__catalog" title="View all scenarios on home">
        All
      </Link>
    </nav>
  )
}
