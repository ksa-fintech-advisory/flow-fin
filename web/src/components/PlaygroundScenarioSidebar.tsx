import { NavLink, useNavigate, useParams } from 'react-router-dom'
import type { SimulationCase } from '../fdl/types'
import { SCENARIOS } from '../fdl/scenarios'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'

type CaseOutcome = 'success' | 'failure' | 'retry' | 'warning' | 'neutral'

function domainLabel(domain: unknown): string {
  if (typeof domain === 'string' && domain.length) return domain
  return 'general'
}

function parseCaseLabel(label: string): { outcome: CaseOutcome; title: string } {
  const trimmed = label.trim()
  if (trimmed.startsWith('✓')) {
    return { outcome: 'success', title: trimmed.replace(/^✓\s*/, '') }
  }
  if (trimmed.startsWith('✗')) {
    return { outcome: 'failure', title: trimmed.replace(/^✗\s*/, '') }
  }
  if (trimmed.startsWith('⟲')) {
    return { outcome: 'retry', title: trimmed.replace(/^⟲\s*/, '') }
  }
  if (trimmed.startsWith('⚠')) {
    return { outcome: 'warning', title: trimmed.replace(/^⚠\s*/, '') }
  }
  return { outcome: 'neutral', title: trimmed }
}

const OUTCOME_LABEL: Record<CaseOutcome, string> = {
  success: 'Approved',
  failure: 'Declined',
  retry: 'Retry',
  warning: 'Review',
  neutral: 'Path',
}

function CaseCard({
  simCase,
  isActive,
  disabled,
  onSelect,
}: {
  simCase: SimulationCase
  isActive: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const { outcome, title } = parseCaseLabel(simCase.label)

  return (
    <li>
      <button
        type="button"
        className={`ff-playground-case${isActive ? ' ff-playground-case--active' : ''}`}
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={isActive}
      >
        <span className={`ff-playground-case__badge ff-playground-case__badge--${outcome}`}>
          {OUTCOME_LABEL[outcome]}
        </span>
        <span className="ff-playground-case__title">{title}</span>
        {simCase.context ? (
          <span className="ff-playground-case__context">{simCase.context}</span>
        ) : null}
      </button>
    </li>
  )
}

export function PlaygroundScenarioSidebar() {
  const navigate = useNavigate()
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const setScenarioId = useGraphStore((s) => s.setScenarioId)
  const flow = useGraphStore((s) => s.flow)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const selectCase = useRuntimeStore((s) => s.selectCase)
  const phase = useRuntimeStore((s) => s.phase)
  const isRunning = phase === 'running'

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)
  const cases = flow.simulation?.cases
  const hasCases = cases != null && cases.length > 0

  return (
    <aside className="ff-playground-nav" aria-label="Examples and simulation cases">
      <header className="ff-playground-nav__header">
        <h2 className="ff-playground-nav__title">Examples</h2>
        <p className="ff-playground-nav__lead">
          Choose a financial flow, pick what happens, then press Play on the canvas.
        </p>
      </header>

      <section className="ff-playground-nav__section" aria-labelledby="playground-flows-heading">
        <h3 id="playground-flows-heading" className="ff-playground-nav__section-title">
          Flows
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

      {hasCases ? (
        <section
          className="ff-playground-nav__section ff-playground-nav__section--cases"
          aria-labelledby="playground-cases-heading"
        >
          <h3 id="playground-cases-heading" className="ff-playground-nav__section-title">
            What happens
          </h3>
          <p className="ff-playground-nav__hint">
            {scenario?.title ?? 'This flow'} — select one path, then run the simulation.
          </p>
          <ul className="ff-playground-case-list">
            {cases!.map((c) => (
              <CaseCard
                key={c.id}
                simCase={c}
                isActive={c.id === (activeCaseId ?? cases![0]?.id)}
                disabled={isRunning}
                onSelect={() => selectCase(c.id)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="ff-playground-nav__footer">
        <button type="button" className="ff-btn ff-btn--ghost ff-playground-nav__home" onClick={() => navigate('/')}>
          ← All scenarios
        </button>
      </footer>
    </aside>
  )
}
