import type { FDLNodeKind } from '../fdl/types'
import type { NodeOperationalMetrics } from './runtimeTypes'

/** Deterministic pseudo-random from string seed (0–1). */
function hash01(seed: string, salt = 0): number {
  let h = salt
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i)
    h |= 0
  }
  return (Math.abs(h) % 1000) / 1000
}

const KIND_BASE_LATENCY: Partial<Record<FDLNodeKind, number>> = {
  start: 12,
  end: 8,
  payment: 48,
  fraud_check: 72,
  approval: 95,
  settlement: 110,
  routing: 38,
  retry: 140,
  wallet: 55,
  reconciliation: 88,
}

export function deriveNodeMetrics(
  nodeId: string,
  kind: FDLNodeKind,
  runtimeState: string,
  attempt = 1,
): NodeOperationalMetrics {
  const base = KIND_BASE_LATENCY[kind] ?? 42
  const jitter = hash01(nodeId, 3) * 28
  const latencyMs = Math.round(base + jitter + (attempt - 1) * 22)

  const retries =
    kind === 'retry' ? attempt - 1 : runtimeState === 'failed' ? 1 : Math.floor(hash01(nodeId, 7) * 2)

  const successBase =
    runtimeState === 'failed' ? 0.72 : runtimeState === 'success' ? 0.99 : 0.94 + hash01(nodeId, 11) * 0.04

  const queuePressure =
    runtimeState === 'running'
      ? 0.35 + hash01(nodeId, 13) * 0.45
      : hash01(nodeId, 17) * 0.22

  const feeAccumulated =
    kind === 'payment' || kind === 'settlement'
      ? Math.round((hash01(nodeId, 19) * 0.018 + 0.002) * 10000) / 100
      : 0

  const processingMs = Math.round(latencyMs * (0.85 + hash01(nodeId, 23) * 0.35))

  return {
    latencyMs,
    retries,
    successRate: Math.min(0.999, Math.round(successBase * 1000) / 1000),
    queuePressure: Math.round(queuePressure * 100) / 100,
    feeAccumulated,
    processingMs,
  }
}

export function formatMetricPercent(n: number): string {
  return `${Math.round(n * 100)}%`
}
