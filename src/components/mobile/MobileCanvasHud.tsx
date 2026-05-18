import { useTranslation } from 'react-i18next'
import { phaseLabel } from '../../i18n/helpers'
import { useRuntimeStore } from '../../stores/useRuntimeStore'

/** Minimal runtime HUD for adaptive canvas — no desktop sidebars. */
export function MobileCanvasHud() {
  const { t } = useTranslation()
  const phase = useRuntimeStore((s) => s.phase)
  const transitPackets = useRuntimeStore((s) => s.transitPackets)

  return (
    <div className="ff-mobile-canvas-hud">
      <div className="ff-runtime-chip ff-runtime-chip--compact">
        <span className={`ff-runtime-chip__dot ff-runtime-chip__dot--${phase}`} />
        <span className="ff-runtime-chip__label">{phaseLabel(t, phase)}</span>
        {transitPackets.length > 0 ? (
          <span className="ff-runtime-chip__queue">
            {t('common.inFlight', { count: transitPackets.length })}
          </span>
        ) : null}
      </div>
      <span className="ff-mobile-canvas-hud__hint">{t('canvas.pinchHint')}</span>
    </div>
  )
}
