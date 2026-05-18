import { NavLink, useNavigate } from 'react-router-dom'
import { SCENARIOS } from '../fdl/scenarios'
import { useGraphStore } from '../stores/useGraphStore'

function domainLabel(domain: unknown): string {
  if (typeof domain === 'string' && domain.length) return domain
  return 'general'
}

/** Left rail: example flow catalog only. */
export function PlaygroundScenarioSidebar() {
  const navigate = useNavigate()
  const setScenarioId = useGraphStore((s) => s.setScenarioId)

  return (
    <aside className="ff-playground-nav" aria-label="Example flows">
      <header className="ff-playground-nav__header">
        <span className="ff-playground-nav__step" aria-hidden>
          1
        </span>
        <div className="ff-playground-nav__heading">
          <h2 className="ff-playground-nav__title">Example flows</h2>
          <p className="ff-playground-nav__lead">
            Choose a topology. Pick an outcome on the canvas, then press Play.
          </p>
        </div>
      </header>

      <section className="ff-playground-nav__section" aria-labelledby="playground-flows-heading">
        <h3 id="playground-flows-heading" className="visually-hidden">
          Available flows
        </h3>
        <ul className="ff-playground-flow-list">
          {SCENARIOS.map((s, index) => (
            <li key={s.id}>
              <NavLink
                to={`/playground/${s.id}`}
                className={({ isActive }) =>
                  `ff-playground-flow${isActive ? ' ff-playground-flow--active' : ''}`
                }
                onClick={() => {
                  setScenarioId(s.id)
                }}
                end
              >
                <span className="ff-playground-flow__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="ff-playground-flow__domain">
                  {domainLabel(s.flow.metadata?.domain)}
                </span>
                <span className="ff-playground-flow__name">{s.title}</span>
                <span className="ff-playground-flow__desc">{s.subtitle}</span>
                <span className="ff-playground-flow__meta">
                  {s.flow.nodes.length} nodes · {s.flow.edges.length} edges
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </section>

      <footer className="ff-playground-nav__footer">
        <button
          type="button"
          className="ff-btn ff-btn--ghost ff-playground-nav__home"
          onClick={() => navigate('/')}
        >
          ← All scenarios
        </button>
      </footer>
    </aside>
  )
}
