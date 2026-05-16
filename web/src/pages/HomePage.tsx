import { Link } from 'react-router-dom'
import { SCENARIOS } from '../fdl/scenarios'

function domainLabel(domain: unknown): string {
  if (typeof domain === 'string' && domain.length) return domain
  return 'general'
}

export function HomePage() {
  return (
    <div className="ff-home">
      <header className="ff-home__hero">
        <p className="ff-home__eyebrow">FlowFin · Phase 1</p>
        <h1>Financial flow scenarios</h1>
        <p className="ff-home__lead">
          Pick a topology to open the playground — simulate propagation, inspect
          nodes, and replay operational traces.
        </p>
        <p className="ff-home__count">{SCENARIOS.length} scenarios</p>
      </header>

      <ul className="ff-home__grid">
        {SCENARIOS.map((scenario, index) => (
          <li key={scenario.id}>
            <Link
              to={`/playground/${scenario.id}`}
              className="ff-scenario-card"
            >
              <span className="ff-scenario-card__index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="ff-scenario-card__domain">
                {domainLabel(scenario.flow.metadata?.domain)}
              </span>
              <h2 className="ff-scenario-card__title">{scenario.title}</h2>
              <p className="ff-scenario-card__subtitle">{scenario.subtitle}</p>
              <span className="ff-scenario-card__cta">Open playground →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
