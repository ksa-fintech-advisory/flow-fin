import { Link } from 'react-router-dom'
import { FlowFinLogo } from '../../brand/FlowFinLogo'
import { PlaygroundTransportButton } from '../PlaygroundTransportButton'
import { useGraphStore } from '../../stores/useGraphStore'
import { useRuntimeStore, type SimulationPhase } from '../../stores/useRuntimeStore'

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

/** Compact runtime header for adaptive mobile / tablet companion mode. */
export function MobileOrchestrationBar() {
  const flow = useGraphStore((s) => s.flow)
  const phase = useRuntimeStore((s) => s.phase)
  const cursor = useRuntimeStore((s) => s.cursor)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const transitPackets = useRuntimeStore((s) => s.transitPackets)

  const cases = flow.simulation?.cases
  const activeCase = cases?.find((c) => c.id === activeCaseId) ?? cases?.[0]
  const seqLen = activeCase?.sequence.length ?? flow.simulation?.sequence.length ?? 0

  return (
    <header className="ff-mobile-orchestration" aria-label="Runtime orchestration">
      <div className="ff-mobile-orchestration__top">
        <Link to="/" className="ff-mobile-orchestration__logo" aria-label="FlowFin home">
          <FlowFinLogo size={20} wordmarkClassName="ff-mobile-orchestration__wordmark" />
        </Link>
        <div className="ff-mobile-orchestration__status">
          <span className={`ff-pill ff-pill--${phase}`}>{phaseLabel(phase)}</span>
          {transitPackets.length > 0 ? (
            <span className="ff-mobile-orchestration__inflight" title="In-flight propagations">
              {transitPackets.length} in-flight
            </span>
          ) : null}
        </div>
      </div>
      <div className="ff-mobile-orchestration__flow">
        <h1 className="ff-mobile-orchestration__title">{flow.name}</h1>
        <p className="ff-mobile-orchestration__meta">
          Step {cursor < 0 ? '—' : cursor + 1} / {seqLen || '—'}
          {activeCase?.context ? (
            <span className="ff-mobile-orchestration__context">{activeCase.context}</span>
          ) : null}
        </p>
      </div>
      <div className="ff-mobile-orchestration__transport">
        <PlaygroundTransportButton variant="dock" />
      </div>
    </header>
  )
}
