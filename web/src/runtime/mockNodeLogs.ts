import type { FDLNodeKind, RuntimeNodeState } from '../fdl/types'

export type RuntimeLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type RuntimeLogCategory =
  | 'ingress'
  | 'processing'
  | 'egress'
  | 'infra'
  | 'security'

export interface RuntimeLogEntry {
  id: string
  at: number
  level: RuntimeLogLevel
  message: string
  detail?: string
  category?: RuntimeLogCategory
}

let logSeq = 0

export function nextLogId(nodeId: string, tag: string): string {
  logSeq += 1
  return `${nodeId}-${tag}-${logSeq}`
}

function entry(
  nodeId: string,
  tag: string,
  level: RuntimeLogLevel,
  message: string,
  detail?: string,
  category?: RuntimeLogCategory,
  at = Date.now(),
): RuntimeLogEntry {
  return {
    id: nextLogId(nodeId, tag),
    at,
    level,
    message,
    detail,
    category,
  }
}

/** Standby / pre-run logs shown when inspecting an idle node. */
export function standbyLogsForKind(
  kind: FDLNodeKind,
  nodeId: string,
  label: string,
): RuntimeLogEntry[] {
  const at = Date.now()
  const common = [
    entry(nodeId, 'hb', 'debug', 'Health check OK', 'agent · 30s interval', 'infra', at - 4200),
    entry(nodeId, 'cfg', 'info', 'Runtime policy loaded', 'retries=3 · circuit=closed', 'infra', at - 2800),
  ]

  switch (kind) {
    case 'payment':
      return [
        ...common,
        entry(nodeId, 'ready', 'info', 'Processor endpoint reachable', 'acquirer · TLS 1.3', 'ingress', at - 1200),
        entry(nodeId, 'idle', 'info', 'Awaiting authorization request', label, 'processing', at),
      ]
    case 'fraud_check':
      return [
        ...common,
        entry(nodeId, 'rules', 'info', 'Ruleset velocity_v3 armed', '720/1000 threshold', 'security', at - 900),
        entry(nodeId, 'idle', 'info', 'Scoring engine on standby', label, 'processing', at),
      ]
    case 'settlement':
      return [
        ...common,
        entry(nodeId, 'window', 'info', 'Clearing window open', 'T+0 batch · cut-off 17:00 UTC', 'infra', at - 1500),
        entry(nodeId, 'idle', 'info', 'Settlement rail idle', label, 'processing', at),
      ]
    case 'retry':
      return [
        ...common,
        entry(nodeId, 'q', 'info', 'Retry queue connected', `retry_q_${nodeId.slice(-4)}`, 'infra', at - 1100),
        entry(nodeId, 'idle', 'info', 'No pending retries', 'backoff policy armed', 'processing', at),
      ]
    case 'start':
      return [
        entry(nodeId, 'arm', 'info', 'Flow runtime armed', 'manual / API ingress ready', 'ingress', at - 800),
        entry(nodeId, 'idle', 'info', 'Waiting for propagation tick', label, 'processing', at),
      ]
  case 'end':
      return [
        entry(nodeId, 'trace', 'info', 'Trace buffer ready', 'seal on terminal state', 'infra', at - 600),
        entry(nodeId, 'idle', 'info', 'Terminal node standby', label, 'egress', at),
      ]
    default:
      return [
        ...common,
        entry(nodeId, 'idle', 'info', 'Node on standby', label, 'processing', at),
      ]
  }
}

/** Logs emitted when a node enters the running state. */
export function enterLogsForKind(
  kind: FDLNodeKind,
  nodeId: string,
  label: string,
  opts?: { declinePath?: boolean; failureReason?: string | null },
): RuntimeLogEntry[] {
  const at = Date.now()
  const decline = opts?.declinePath

  if (decline && opts?.failureReason) {
    return [
      entry(nodeId, 'decline-in', 'warn', 'Decline signal received', opts.failureReason, 'ingress', at),
      entry(nodeId, 'relay', 'warn', 'Propagating failure context', label, 'processing', at + 1),
    ]
  }

  switch (kind) {
    case 'start':
      return [
        entry(nodeId, 'tick', 'info', 'Propagation tick accepted', 'correlation bound', 'ingress', at),
        entry(nodeId, 'arm', 'info', 'Flow execution started', label, 'processing', at + 1),
      ]
    case 'payment':
      return [
        entry(nodeId, 'auth-start', 'info', 'Payment authorization started', 'card · auth-only', 'ingress', at),
        entry(nodeId, 'idem', 'debug', 'Idempotency key validated', `idem_pay_${nodeId}`, 'security', at + 1),
        entry(nodeId, 'fwd', 'info', 'Request forwarded to processor', 'scheme rail · domestic', 'egress', at + 2),
      ]
    case 'fraud_check':
      return [
        entry(nodeId, 'score-start', 'info', 'Fraud scoring started', 'velocity + device bundle', 'security', at),
        entry(nodeId, 'signals', 'debug', 'Signal ingest complete', '12 features · 4ms', 'processing', at + 1),
      ]
    case 'approval':
      return [
        entry(nodeId, 'sca', 'info', 'SCA challenge dispatched', 'OTP · push fallback', 'egress', at),
        entry(nodeId, 'wait', 'info', 'Awaiting customer response', 'timeout 5m', 'processing', at + 1),
      ]
    case 'settlement':
      return [
        entry(nodeId, 'batch', 'info', 'Settlement batch opened', 'clearing window T+0', 'ingress', at),
        entry(nodeId, 'post', 'info', 'Posting to clearing rail', label, 'egress', at + 1),
      ]
    case 'retry':
      return [
        entry(nodeId, 'retry', 'warn', 'Retry attempt initiated', 'attempt 1 · backoff 250ms', 'processing', at),
        entry(nodeId, 'queue', 'info', 'Queue delay simulated', 'synthetic 180ms wait', 'infra', at + 1),
      ]
    case 'routing':
      return [
        entry(nodeId, 'route', 'info', 'Route evaluation started', 'ACH · RTP · SWIFT candidates', 'processing', at),
      ]
    case 'wallet':
      return [
        entry(nodeId, 'hold', 'info', 'Balance hold applied', 'available → reserved', 'processing', at),
        entry(nodeId, 'post', 'info', 'Ledger post staged', label, 'egress', at + 1),
      ]
    case 'reconciliation':
      return [
        entry(nodeId, 'match', 'info', 'Reconciliation tick started', 'statement ingest', 'ingress', at),
      ]
    case 'end':
      return [
        entry(nodeId, 'seal', 'info', 'Terminal trace sealing', label, 'processing', at),
      ]
    default:
      return [
        entry(nodeId, 'run', 'info', 'Step execution started', label, 'processing', at),
      ]
  }
}

/** Rotating operational logs while a node stays in `running`. */
export function runningTickLog(
  kind: FDLNodeKind,
  nodeId: string,
  label: string,
  tick: number,
): RuntimeLogEntry | null {
  const pools: Record<FDLNodeKind, { message: string; detail?: string; level?: RuntimeLogLevel; category?: RuntimeLogCategory }[]> = {
    start: [
      { message: 'Correlation ID bound', detail: `RUN-${nodeId.slice(-4).toUpperCase()}`, category: 'infra' },
      { message: 'Ingress payload validated', detail: 'schema v2', category: 'ingress' },
    ],
    payment: [
      { message: 'Issuer communication in flight', detail: 'auth request pending', category: 'egress' },
      { message: 'Risk flags attached to instruction', detail: 'SCA required=false', category: 'security' },
      { message: 'Processor heartbeat OK', detail: '42ms RTT', category: 'infra' },
    ],
    fraud_check: [
      { message: 'Fraud score calculated', detail: 'score=412 · band=low', category: 'security' },
      { message: 'Velocity rules evaluated', detail: '24h window clear', category: 'processing' },
      { message: 'Device fingerprint matched', detail: 'trust tier B', category: 'security' },
    ],
    approval: [
      { message: 'Customer challenge pending', detail: 'channel=push', category: 'processing' },
      { message: 'Response received from issuer', detail: 'approved · SCA satisfied', category: 'ingress' },
    ],
    settlement: [
      { message: 'Clearing file chunk written', detail: 'batch seq 8842', category: 'processing' },
      { message: 'Settlement netting applied', detail: 'IC++ fees deducted', category: 'processing' },
    ],
    retry: [
      { message: 'Backoff window elapsed', detail: 'ready for re-dispatch', category: 'infra' },
      { message: 'Retry attempt initiated', detail: `attempt ${(tick % 3) + 1}`, level: 'warn', category: 'processing' },
      { message: 'Queue delay simulated', detail: '180ms synthetic lag', category: 'infra' },
    ],
    routing: [
      { message: 'Corridor latency sampled', detail: 'RTP 120ms · ACH 4h', category: 'processing' },
      { message: 'Compliance rule pass', detail: 'sanctions clear', category: 'security' },
    ],
    wallet: [
      { message: 'Double-entry post balanced', detail: 'debit=credit', category: 'processing' },
      { message: 'Hold release scheduled', detail: 'on success path', category: 'infra' },
    ],
    reconciliation: [
      { message: 'Statement line matched', detail: '± $0.00 variance', category: 'processing' },
      { message: 'Exception queue empty', detail: label, category: 'infra' },
    ],
    end: [
      { message: 'Trace segments flushed', detail: '6 spans sealed', category: 'infra' },
      { message: 'Webhook dispatch queued', detail: '/complete', category: 'egress' },
    ],
  }

  const pool = pools[kind] ?? [{ message: 'Processing step', detail: label, category: 'processing' as const }]
  const pick = pool[tick % pool.length]!
  return entry(
    nodeId,
    `tick-${tick}`,
    pick.level ?? 'info',
    pick.message,
    pick.detail,
    pick.category,
  )
}

/** Logs when a node completes (success, failed, retrying). */
export function completeLogsForKind(
  kind: FDLNodeKind,
  nodeId: string,
  label: string,
  finalState: RuntimeNodeState,
  failureMessage?: string,
): RuntimeLogEntry[] {
  const at = Date.now()

  if (finalState === 'failed') {
    const failMsgs: Partial<Record<FDLNodeKind, RuntimeLogEntry[]>> = {
      payment: [
        entry(nodeId, 'decline', 'error', 'Payment declined', failureMessage ?? `${label} rejected`, 'egress', at),
        entry(nodeId, 'issuer', 'warn', 'Response received from issuer', 'decline code · do not honor', 'ingress', at + 1),
      ],
      fraud_check: [
        entry(nodeId, 'block', 'error', 'Fraud check blocked', failureMessage ?? 'score above threshold', 'security', at),
        entry(nodeId, 'score', 'warn', 'Fraud score calculated', 'score=891 · action=block', 'security', at + 1),
      ],
      end: [
        entry(nodeId, 'end-fail', 'error', 'Flow ended — declined', failureMessage ?? label, 'egress', at),
      ],
    }
    return failMsgs[kind] ?? [
      entry(nodeId, 'fail', 'error', 'Step failed', failureMessage ?? label, 'processing', at),
    ]
  }

  if (finalState === 'retrying') {
    return [
      entry(nodeId, 'retry-sched', 'warn', 'Retry scheduled', `${label} · exponential backoff`, 'processing', at),
      entry(nodeId, 'queue', 'info', 'Queue delay simulated', 'next attempt in 2s', 'infra', at + 1),
    ]
  }

  switch (kind) {
    case 'payment':
      return [
        entry(nodeId, 'auth-ok', 'info', 'Payment authorized', 'auth code captured', 'egress', at),
        entry(nodeId, 'issuer-ok', 'info', 'Response received from issuer', 'approved · AVS match', 'ingress', at + 1),
      ]
    case 'fraud_check':
      return [
        entry(nodeId, 'clear', 'info', 'Fraud score calculated', 'decision=clear', 'security', at),
        entry(nodeId, 'pass', 'info', 'Risk gate passed', label, 'processing', at + 1),
      ]
    case 'settlement':
      return [
        entry(nodeId, 'done', 'info', 'Settlement completed', 'funds handed to clearing', 'egress', at),
      ]
    case 'retry':
      return [
        entry(nodeId, 'retry-ok', 'info', 'Retry succeeded', 'downstream accepted', 'processing', at),
      ]
    case 'end':
      return [
        entry(nodeId, 'sealed', 'info', 'Runtime exit sealed', 'trace archived', 'egress', at),
      ]
    default:
      return [
        entry(nodeId, 'ok', 'info', 'Step completed', label, 'processing', at),
      ]
  }
}

/** Timeout / degradation logs for long-running steps (optional tick). */
export function timeoutWarningLog(
  nodeId: string,
  kind: FDLNodeKind,
): RuntimeLogEntry {
  const detail =
    kind === 'payment'
      ? 'processor SLA 2s · synthetic breach'
      : kind === 'approval'
        ? 'SCA timeout window 5m'
        : 'step budget 3s exceeded'
  return entry(nodeId, 'timeout', 'warn', 'Timeout detected', detail, 'infra')
}
