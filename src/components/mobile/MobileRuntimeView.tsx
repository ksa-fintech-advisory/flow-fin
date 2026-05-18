import { useTranslation } from 'react-i18next'
import { PlaygroundCaseBar } from '../PlaygroundCaseBar'
import { TopologyThemePicker } from '../TopologyThemePicker'
import { phaseLabel } from '../../i18n/helpers'
import { formatMetricPercent } from '../../runtime/metrics'
import { useGraphStore } from '../../stores/useGraphStore'
import { useRuntimeStore } from '../../stores/useRuntimeStore'

/** Runtime metrics, case selection, and playback context for companion mode. */
export function MobileRuntimeView() {
  const { t } = useTranslation()
  const flow = useGraphStore((s) => s.flow)
  const phase = useRuntimeStore((s) => s.phase)
  const failureReason = useRuntimeStore((s) => s.failureReason)
  const timeline = useRuntimeStore((s) => s.timeline)
  const nodeMetrics = useRuntimeStore((s) => s.nodeMetrics)
  const transitPackets = useRuntimeStore((s) => s.transitPackets)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)

  const nodes = flow.nodes
  const runningCount = Object.values(nodeStates).filter((s) => s === 'running').length
  const failedCount = Object.values(nodeStates).filter((s) => s === 'failed').length
  const metrics = Object.values(nodeMetrics)
  const avgLatency =
    metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.latencyMs, 0) / metrics.length)
      : null
  const avgSuccess =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
      : null

  return (
    <div className="ff-mobile-runtime">
      <header className="ff-mobile-runtime__head">
        <h2>{t('mobile.runtimeTitle')}</h2>
        <p>{t('mobile.runtimeSubtitle')}</p>
      </header>

      <section className="ff-mobile-runtime__metrics" aria-label={t('aria.runtimeMetrics')}>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">{t('mobile.phase')}</span>
          <span className={`ff-pill ff-pill--${phase}`}>{phaseLabel(t, phase)}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">{t('common.nodes')}</span>
          <span className="ff-mobile-metric__value">{nodes.length}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">{t('mobile.active')}</span>
          <span className="ff-mobile-metric__value">{runningCount}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">{t('mobile.inFlight')}</span>
          <span className="ff-mobile-metric__value">{transitPackets.length}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">{t('mobile.eventsCount')}</span>
          <span className="ff-mobile-metric__value">{timeline.length}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">{t('mobile.failed')}</span>
          <span
            className={`ff-mobile-metric__value${failedCount > 0 ? ' ff-mobile-metric__value--alert' : ''}`}
          >
            {failedCount}
          </span>
        </div>
        {avgLatency != null ? (
          <div className="ff-mobile-metric">
            <span className="ff-mobile-metric__label">{t('mobile.avgLatency')}</span>
            <span className="ff-mobile-metric__value">{avgLatency}ms</span>
          </div>
        ) : null}
        {avgSuccess != null ? (
          <div className="ff-mobile-metric">
            <span className="ff-mobile-metric__label">{t('mobile.success')}</span>
            <span className="ff-mobile-metric__value">{formatMetricPercent(avgSuccess)}</span>
          </div>
        ) : null}
      </section>

      {failureReason ? (
        <div className="ff-mobile-runtime__alert" role="alert">
          <strong>{t('mobile.runtimeAlert')}</strong>
          <p>{failureReason}</p>
        </div>
      ) : null}

      <section className="ff-mobile-runtime__theme" aria-label={t('aria.topologyTheme')}>
        <h3>{t('mobile.visualTheme')}</h3>
        <TopologyThemePicker />
      </section>

      <section className="ff-mobile-runtime__cases" aria-label={t('aria.simulationCases')}>
        <h3>{t('mobile.transactionCases')}</h3>
        <PlaygroundCaseBar />
      </section>
    </div>
  )
}
