import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FlowFinLogo } from '../brand/FlowFinLogo'
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
  const phase = useRuntimeStore((s) => s.phase)
  const cursor = useRuntimeStore((s) => s.cursor)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const speedMultiplier = useUiStore((s) => s.speedMultiplier)
  const setSpeedMultiplier = useUiStore((s) => s.setSpeedMultiplier)

  const start = useRuntimeStore((s) => s.start)
  const pause = useRuntimeStore((s) => s.pause)
  const resume = useRuntimeStore((s) => s.resume)
  const reset = useRuntimeStore((s) => s.reset)
  const stepForward = useRuntimeStore((s) => s.stepForward)
  const advanceStep = useRuntimeStore((s) => s.advanceStep)

  const cases = flow.simulation?.cases
  const activeCase = cases?.find((c) => c.id === activeCaseId) ?? cases?.[0]
  const seqLen = activeCase?.sequence.length ?? flow.simulation?.sequence.length ?? 0

  useEffect(() => {
    if (phase !== 'running') return
    const base = flow.simulation?.stepDelayMs ?? 1000
    const ms = Math.max(120, base / speedMultiplier)
    const id = window.setInterval(() => advanceStep(), ms)
    return () => window.clearInterval(id)
  }, [phase, flow.simulation?.stepDelayMs, speedMultiplier, advanceStep])

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

        <button type="button" className="ff-btn" onClick={() => reset()}>
          Reset
        </button>
        <button
          type="button"
          className="ff-btn ff-btn--primary"
          onClick={() => start()}
          disabled={phase === 'running'}
        >
          Play
        </button>
        <button
          type="button"
          className="ff-btn"
          onClick={() => pause()}
          disabled={phase !== 'running'}
        >
          Pause
        </button>
        <button
          type="button"
          className="ff-btn"
          onClick={() => resume()}
          disabled={phase !== 'paused'}
        >
          Resume
        </button>
        <button type="button" className="ff-btn ff-btn--ghost" onClick={() => stepForward()}>
          Step
        </button>
      </div>
    </header>
  )
}
