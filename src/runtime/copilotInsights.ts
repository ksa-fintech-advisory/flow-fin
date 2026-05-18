import type { TimelineEntry } from '../stores/useRuntimeStore'
import type { NodeOperationalMetrics } from './runtimeTypes'

export interface CopilotInsight {
  id: string
  severity: 'info' | 'warn' | 'critical'
  title: string
  detail: string
  action?: string
}

export function buildCopilotInsights(input: {
  phase: string
  failureReason: string | null
  timeline: TimelineEntry[]
  nodeMetrics: Record<string, NodeOperationalMetrics>
  queueDepth: number
  flowName: string
}): CopilotInsight[] {
  const insights: CopilotInsight[] = []

  const highLatency = Object.entries(input.nodeMetrics).find(
    ([, m]) => m.latencyMs > 95 && m.queuePressure > 0.5,
  )
  if (highLatency) {
    const [nodeId, m] = highLatency
    insights.push({
      id: 'latency',
      severity: 'warn',
      title: `High latency detected on ${nodeId}`,
      detail: `p95 ${m.latencyMs}ms · queue pressure ${Math.round(m.queuePressure * 100)}%`,
      action: 'Suggested rerouting traffic to backup processor',
    })
  }

  const retries = Object.entries(input.nodeMetrics).filter(([, m]) => m.retries > 0)
  if (retries.length) {
    const [nodeId, m] = retries[0]!
    insights.push({
      id: 'retries',
      severity: 'warn',
      title: `AI detected increased retries on ${nodeId}`,
      detail: `${m.retries} retry attempt(s) in current window`,
      action: 'Review idempotency keys and downstream timeouts',
    })
  }

  if (input.failureReason) {
    insights.push({
      id: 'decline',
      severity: 'critical',
      title: 'Decline propagation active',
      detail: input.failureReason,
      action: 'Enable fallback routing to secondary acquirer',
    })
  }

  if (input.queueDepth >= 3) {
    insights.push({
      id: 'concurrency',
      severity: 'warn',
      title: 'Elevated concurrent transaction load',
      detail: `${input.queueDepth} in-flight propagations across topology`,
      action: 'Scale worker pool or enable back-pressure',
    })
  }

  const lastError = [...input.timeline].reverse().find((e) => e.tone === 'error')
  if (lastError && input.phase === 'completed') {
    insights.push({
      id: 'postmortem',
      severity: 'info',
      title: 'Post-run analysis ready',
      detail: `${lastError.title} · ${input.flowName}`,
      action: 'Export trace for settlement review',
    })
  }

  if (!insights.length) {
    insights.push({
      id: 'healthy',
      severity: 'info',
      title: 'Topology operating within SLO',
      detail: 'No anomalies detected in the last simulation window',
      action: 'Continue monitoring propagation traces',
    })
  }

  return insights.slice(0, 4)
}
