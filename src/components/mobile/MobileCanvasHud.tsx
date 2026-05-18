import { useRuntimeStore } from '../../stores/useRuntimeStore'

/** Minimal runtime HUD for adaptive canvas — no desktop sidebars. */
export function MobileCanvasHud() {
  const phase = useRuntimeStore((s) => s.phase)
  const transitPackets = useRuntimeStore((s) => s.transitPackets)

  return (
    <div className="ff-mobile-canvas-hud">
      <div className="ff-runtime-chip ff-runtime-chip--compact">
        <span className={`ff-runtime-chip__dot ff-runtime-chip__dot--${phase}`} />
        <span className="ff-runtime-chip__label">{phase}</span>
        {transitPackets.length > 0 ? (
          <span className="ff-runtime-chip__queue">{transitPackets.length} in-flight</span>
        ) : null}
      </div>
      <span className="ff-mobile-canvas-hud__hint">Pinch to zoom · drag to pan</span>
    </div>
  )
}
