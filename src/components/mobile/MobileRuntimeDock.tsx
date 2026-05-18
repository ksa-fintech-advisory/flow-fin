import { RuntimeTimelineControls } from '../RuntimeTimelineControls'
import { useRuntimeStore } from '../../stores/useRuntimeStore'
import { useUiStore } from '../../stores/useUiStore'

/** Sticky playback scrubber above the bottom navigation. */
export function MobileRuntimeDock() {
  const phase = useRuntimeStore((s) => s.phase)
  const reset = useRuntimeStore((s) => s.reset)
  const stepForward = useRuntimeStore((s) => s.stepForward)
  const speedMultiplier = useUiStore((s) => s.speedMultiplier)
  const setSpeedMultiplier = useUiStore((s) => s.setSpeedMultiplier)

  return (
    <div className="ff-mobile-dock" role="region" aria-label="Runtime playback">
      <RuntimeTimelineControls />
      <div className="ff-mobile-dock__actions">
        <label className="ff-speed ff-speed--compact">
          <span>Speed</span>
          <select
            value={String(speedMultiplier)}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            aria-label="Simulation speed"
          >
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </label>
        <button type="button" className="ff-btn ff-btn--ghost ff-btn--touch" onClick={() => reset()}>
          Reset
        </button>
        <button
          type="button"
          className="ff-btn ff-btn--ghost ff-btn--touch"
          onClick={() => stepForward()}
          disabled={phase === 'running'}
        >
          Step
        </button>
      </div>
    </div>
  )
}
