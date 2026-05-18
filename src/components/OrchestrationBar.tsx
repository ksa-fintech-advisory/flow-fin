import { Link } from 'react-router-dom'
import { FlowFinLogo } from '../brand/FlowFinLogo'
import { PlaygroundTransportButton } from './PlaygroundTransportButton'
import { RuntimeTimelineControls } from './RuntimeTimelineControls'
import { SCENARIOS } from '../fdl/scenarios'
import { useGraphStore } from '../stores/useGraphStore'
import {
  useRuntimeStore,
  type SimulationPhase,
} from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'

function phaseLabel(phase: SimulationPhase): string {
  switch (phase) {
    case 'idle':
      return 'Idle'
    case 'running':
      return 'Running'
    case 'paused':
      return 'Paused'
    case 'completed':
      return 'Completed'
    default:
      return phase
  }
}

export function OrchestrationBar() {
  const flow = useGraphStore((s) => s.flow)
  const scenarioId = useGraphStore((s) => s.scenarioId)
  const scenarioSubtitle = SCENARIOS.find((s) => s.id === scenarioId)?.subtitle
  const phase = useRuntimeStore((s) => s.phase)
  const cursor = useRuntimeStore((s) => s.cursor)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const speedMultiplier = useUiStore((s) => s.speedMultiplier)
  const setSpeedMultiplier = useUiStore((s) => s.setSpeedMultiplier)

  const reset = useRuntimeStore((s) => s.reset)
  const stepForward = useRuntimeStore((s) => s.stepForward)

  const cases = flow.simulation?.cases
  const activeCase = cases?.find((c) => c.id === activeCaseId) ?? cases?.[0]
  const seqLen = activeCase?.sequence.length ?? flow.simulation?.sequence.length ?? 0

  const progress =
    phase === 'completed'
      ? 100
      : seqLen === 0
        ? 0
        : cursor < 0
          ? 0
          : Math.min(100, Math.round(((cursor + 1) / seqLen) * 100))

  return (
    <header className="ff-orchestration">
      <div className="ff-orchestration__brand">
        <Link to="/" className="ff-orchestration__logo" aria-label="FlowFin home">
          <FlowFinLogo size={22} wordmarkClassName="ff-orchestration__logo-text" />
        </Link>
        <span className="ff-orchestration__flow-name">{flow.name}</span>
        {scenarioSubtitle ? (
          <span className="ff-orchestration__subtitle">{scenarioSubtitle}</span>
        ) : null}
        {activeCase?.context ? (
          <span className="ff-orchestration__context">{activeCase.context}</span>
        ) : null}
      </div>

      <div className="ff-orchestration__status">
        <span className={`ff-pill ff-pill--${phase}`}>{phaseLabel(phase)}</span>
        <span className="ff-orchestration__meta">
          Step {cursor < 0 ? '—' : cursor + 1} / {seqLen || '—'}
        </span>
      </div>

      <div className="ff-orchestration__progress" aria-hidden>
        <div className="ff-orchestration__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="ff-orchestration__controls">
        <PlaygroundTransportButton variant="hero" />
        <RuntimeTimelineControls />
        <div className="ff-orchestration__controls-secondary">
          <label className="ff-speed">
            <span>Speed</span>
            <select
              value={String(speedMultiplier)}
              onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            >
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>
          </label>
          <button type="button" className="ff-btn ff-btn--ghost" onClick={() => reset()}>
            Reset
          </button>
          <button type="button" className="ff-btn ff-btn--ghost" onClick={() => stepForward()}>
            Step
          </button>
        </div>
      </div>
    </header>
  )
}
