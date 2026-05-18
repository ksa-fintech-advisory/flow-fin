import {
  useRuntimeStore,
  type SimulationPhase,
} from '../stores/useRuntimeStore'

type PlaygroundTransportButtonProps = {
  /** `hero` — top bar; `dock` — bottom case bar */
  variant?: 'hero' | 'dock'
}

function primaryLabel(phase: SimulationPhase): string {
  switch (phase) {
    case 'running':
      return 'Pause'
    case 'paused':
      return 'Resume'
    case 'completed':
      return 'Play again'
    default:
      return 'Play simulation'
  }
}

export function PlaygroundTransportButton({ variant = 'hero' }: PlaygroundTransportButtonProps) {
  const phase = useRuntimeStore((s) => s.phase)
  const start = useRuntimeStore((s) => s.start)
  const pause = useRuntimeStore((s) => s.pause)
  const resume = useRuntimeStore((s) => s.resume)

  const onPrimary = () => {
    if (phase === 'running') pause()
    else if (phase === 'paused') resume()
    else start()
  }

  const icon = phase === 'running' ? '❚❚' : phase === 'paused' ? '▶' : '▶'
  const shortLabel =
    phase === 'running' ? 'Pause' : phase === 'paused' ? 'Resume' : phase === 'completed' ? 'Again' : 'Play'

  return (
    <button
      type="button"
      className={`ff-btn-play ff-btn-play--${phase} ff-btn-play--${variant}`}
      onClick={onPrimary}
      aria-label={primaryLabel(phase)}
    >
      <span className="ff-btn-play__icon" aria-hidden>
        {icon}
      </span>
      <span className="ff-btn-play__label">{variant === 'dock' ? shortLabel : primaryLabel(phase)}</span>
    </button>
  )
}
