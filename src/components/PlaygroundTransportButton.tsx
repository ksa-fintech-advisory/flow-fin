import { useTranslation } from 'react-i18next'
import {
  useRuntimeStore,
  type SimulationPhase,
} from '../stores/useRuntimeStore'

type PlaygroundTransportButtonProps = {
  /** `hero` — top bar; `dock` — bottom case bar */
  variant?: 'hero' | 'dock'
}

function primaryLabel(t: (key: string) => string, phase: SimulationPhase): string {
  switch (phase) {
    case 'running':
      return t('transport.pause')
    case 'paused':
      return t('transport.resume')
    case 'completed':
      return t('transport.playAgain')
    default:
      return t('transport.play')
  }
}

function shortLabel(t: (key: string) => string, phase: SimulationPhase): string {
  switch (phase) {
    case 'running':
      return t('transport.pause')
    case 'paused':
      return t('transport.resume')
    case 'completed':
      return t('transport.again')
    default:
      return t('transport.playShort')
  }
}

export function PlaygroundTransportButton({ variant = 'hero' }: PlaygroundTransportButtonProps) {
  const { t } = useTranslation()
  const phase = useRuntimeStore((s) => s.phase)
  const start = useRuntimeStore((s) => s.start)
  const pause = useRuntimeStore((s) => s.pause)
  const resume = useRuntimeStore((s) => s.resume)

  const onPrimary = () => {
    if (phase === 'running') pause()
    else if (phase === 'paused') resume()
    else start()
  }

  const icon = phase === 'running' ? '❚❚' : '▶'
  const label = variant === 'dock' ? shortLabel(t, phase) : primaryLabel(t, phase)

  return (
    <button
      type="button"
      className={`ff-btn-play ff-btn-play--${phase} ff-btn-play--${variant}`}
      onClick={onPrimary}
      aria-label={primaryLabel(t, phase)}
    >
      <span className="ff-btn-play__icon" aria-hidden>
        {icon}
      </span>
      <span className="ff-btn-play__label">{label}</span>
    </button>
  )
}
