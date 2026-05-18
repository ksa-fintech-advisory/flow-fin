import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FlowFinLogo } from '../../brand/FlowFinLogo'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { PlaygroundTransportButton } from '../PlaygroundTransportButton'
import { phaseLabel } from '../../i18n/helpers'
import { useGraphStore } from '../../stores/useGraphStore'
import { useRuntimeStore } from '../../stores/useRuntimeStore'

/** Compact runtime header for adaptive mobile / tablet companion mode. */
export function MobileOrchestrationBar() {
  const { t } = useTranslation()
  const flow = useGraphStore((s) => s.flow)
  const phase = useRuntimeStore((s) => s.phase)
  const cursor = useRuntimeStore((s) => s.cursor)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const transitPackets = useRuntimeStore((s) => s.transitPackets)

  const cases = flow.simulation?.cases
  const activeCase = cases?.find((c) => c.id === activeCaseId) ?? cases?.[0]
  const seqLen = activeCase?.sequence.length ?? flow.simulation?.sequence.length ?? 0
  const stepCurrent = cursor < 0 ? '—' : String(cursor + 1)
  const stepTotal = seqLen ? String(seqLen) : '—'

  return (
    <header className="ff-mobile-orchestration" aria-label={t('aria.runtimeOrchestration')}>
      <div className="ff-mobile-orchestration__top">
        <Link to="/" className="ff-mobile-orchestration__logo" aria-label={t('aria.home')}>
          <FlowFinLogo size={20} wordmarkClassName="ff-mobile-orchestration__wordmark" />
        </Link>
        <div className="ff-mobile-orchestration__status">
          <LanguageSwitcher />
          <span className={`ff-pill ff-pill--${phase}`}>{phaseLabel(t, phase)}</span>
          {transitPackets.length > 0 ? (
            <span
              className="ff-mobile-orchestration__inflight"
              title={t('aria.inFlightPropagations')}
            >
              {t('common.inFlight', { count: transitPackets.length })}
            </span>
          ) : null}
        </div>
      </div>
      <div className="ff-mobile-orchestration__flow">
        <h1 className="ff-mobile-orchestration__title">{flow.name}</h1>
        <p className="ff-mobile-orchestration__meta">
          {t('common.stepProgress', { current: stepCurrent, total: stepTotal })}
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
