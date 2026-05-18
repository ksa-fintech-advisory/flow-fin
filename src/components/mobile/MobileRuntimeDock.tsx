import { useTranslation } from 'react-i18next'
import { RuntimeTimelineControls } from '../RuntimeTimelineControls'
import { useRuntimeStore } from '../../stores/useRuntimeStore'
import { useUiStore } from '../../stores/useUiStore'

/** Sticky playback scrubber above the bottom navigation. */
export function MobileRuntimeDock() {
  const { t } = useTranslation()
  const phase = useRuntimeStore((s) => s.phase)
  const reset = useRuntimeStore((s) => s.reset)
  const stepForward = useRuntimeStore((s) => s.stepForward)
  const speedMultiplier = useUiStore((s) => s.speedMultiplier)
  const setSpeedMultiplier = useUiStore((s) => s.setSpeedMultiplier)

  return (
    <div className="ff-mobile-dock" role="region" aria-label={t('aria.runtimePlayback')}>
      <RuntimeTimelineControls />
      <div className="ff-mobile-dock__actions">
        <label className="ff-speed ff-speed--compact">
          <span>{t('common.speed')}</span>
          <select
            value={String(speedMultiplier)}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            aria-label={t('aria.simulationSpeed')}
          >
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </label>
        <button type="button" className="ff-btn ff-btn--ghost ff-btn--touch" onClick={() => reset()}>
          {t('common.reset')}
        </button>
        <button
          type="button"
          className="ff-btn ff-btn--ghost ff-btn--touch"
          onClick={() => stepForward()}
          disabled={phase === 'running'}
        >
          {t('common.step')}
        </button>
      </div>
    </div>
  )
}
