import { PlaygroundCaseBar } from '../PlaygroundCaseBar'
import { TopologyThemePicker } from '../TopologyThemePicker'
import { formatMetricPercent } from '../../runtime/metrics'
import { useGraphStore } from '../../stores/useGraphStore'
import { useRuntimeStore } from '../../stores/useRuntimeStore'

/** Runtime metrics, case selection, and playback context for companion mode. */
export function MobileRuntimeView() {
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
        <h2>Runtime observability</h2>
        <p>Metrics · playback · scenario outcomes</p>
      </header>

      <section className="ff-mobile-runtime__metrics" aria-label="Runtime metrics">
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">Phase</span>
          <span className={`ff-pill ff-pill--${phase}`}>{phase}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">Nodes</span>
          <span className="ff-mobile-metric__value">{nodes.length}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">Active</span>
          <span className="ff-mobile-metric__value">{runningCount}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">In-flight</span>
          <span className="ff-mobile-metric__value">{transitPackets.length}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">Events</span>
          <span className="ff-mobile-metric__value">{timeline.length}</span>
        </div>
        <div className="ff-mobile-metric">
          <span className="ff-mobile-metric__label">Failed</span>
          <span
            className={`ff-mobile-metric__value${failedCount > 0 ? ' ff-mobile-metric__value--alert' : ''}`}
          >
            {failedCount}
          </span>
        </div>
        {avgLatency != null ? (
          <div className="ff-mobile-metric">
            <span className="ff-mobile-metric__label">Avg latency</span>
            <span className="ff-mobile-metric__value">{avgLatency}ms</span>
          </div>
        ) : null}
        {avgSuccess != null ? (
          <div className="ff-mobile-metric">
            <span className="ff-mobile-metric__label">Success</span>
            <span className="ff-mobile-metric__value">{formatMetricPercent(avgSuccess)}</span>
          </div>
        ) : null}
      </section>

      {failureReason ? (
        <div className="ff-mobile-runtime__alert" role="alert">
          <strong>Runtime alert</strong>
          <p>{failureReason}</p>
        </div>
      ) : null}

      <section className="ff-mobile-runtime__theme" aria-label="Topology theme">
        <h3>Visual theme</h3>
        <TopologyThemePicker />
      </section>

      <section className="ff-mobile-runtime__cases" aria-label="Simulation cases">
        <h3>Transaction cases</h3>
        <PlaygroundCaseBar />
      </section>
    </div>
  )
}
