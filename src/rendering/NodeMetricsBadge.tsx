import { formatMetricPercent } from '../runtime/metrics'
import type { NodeOperationalMetrics } from '../runtime/runtimeTypes'

type NodeMetricsBadgeProps = {
  metrics: NodeOperationalMetrics | undefined
  visible: boolean
}

export function NodeMetricsBadge({ metrics, visible }: NodeMetricsBadgeProps) {
  if (!visible || !metrics) return null

  return (
    <div className="ff-node-metrics" aria-hidden>
      <span className="ff-node-metrics__item" title="Latency">
        {metrics.latencyMs}ms
      </span>
      {metrics.retries > 0 ? (
        <span className="ff-node-metrics__item ff-node-metrics__item--warn">
          ↻{metrics.retries}
        </span>
      ) : null}
      <span className="ff-node-metrics__item" title="Success rate">
        {formatMetricPercent(metrics.successRate)}
      </span>
    </div>
  )
}
