import type { FDLNodeKind } from './types'

export type DetailRow = {
  label: string
  value: string
  mono?: boolean
}

export type NodeRole = {
  title: string
  description: string
}

const ROLES: Record<FDLNodeKind, NodeRole> = {
  start: {
    title: 'Flow entry',
    description: 'Arms the runtime and accepts the first propagation tick.',
  },
  end: {
    title: 'Flow exit',
    description: 'Terminal state — execution is closed and traced.',
  },
  payment: {
    title: 'Payment processor',
    description: 'Captures or posts a payment instruction onto the rail.',
  },
  fraud_check: {
    title: 'Decision · fraud',
    description: 'Scores risk and routes to clear path or retry branch.',
  },
  approval: {
    title: 'Strong customer auth',
    description: 'SCA / manual approval gate before funds movement.',
  },
  settlement: {
    title: 'Settlement',
    description: 'Hands off to clearing / ACH / card settlement rail.',
  },
  retry: {
    title: 'Retry buffer',
    description: 'Queues failed or soft-declined work with backoff policy.',
  },
  routing: {
    title: 'Decision · routing',
    description: 'Selects corridor, rail, or policy branch.',
  },
  wallet: {
    title: 'Wallet ledger',
    description: 'Updates balance or prefunded position.',
  },
  reconciliation: {
    title: 'Reconciliation',
    description: 'Matches ledger entries against external statements.',
  },
}

/** Simulated operational fields — phase 1 mock, no backend. */
export function operationalDetailsForKind(
  kind: FDLNodeKind,
  nodeId: string,
): DetailRow[] {
  const suffix = nodeId.slice(-4).toUpperCase()
  switch (kind) {
    case 'start':
      return [
        { label: 'Trigger', value: 'Manual / API arm' },
        { label: 'Correlation', value: `RUN-${suffix}`, mono: true },
      ]
    case 'end':
      return [
        { label: 'Outcome', value: 'Terminal success path' },
        { label: 'Trace sealed', value: `TRACE-${suffix}`, mono: true },
      ]
    case 'payment':
      return [
        { label: 'Instruction', value: 'Card capture · auth' },
        { label: 'Idempotency', value: `idem_pay_${nodeId}`, mono: true },
        { label: 'Rail', value: 'Scheme / acquirer' },
        { label: 'SLA', value: '< 2s auth' },
      ]
    case 'fraud_check':
      return [
        { label: 'Ruleset', value: 'velocity_v3 + device' },
        { label: 'Score band', value: '0–1000 (threshold 720)' },
        { label: 'Outcomes', value: 'clear · soft decline · block' },
      ]
    case 'approval':
      return [
        { label: 'Challenge', value: 'SCA / OTP / biometrics' },
        { label: 'Timeout', value: '5 minutes' },
        { label: 'Fallback', value: 'Manual desk queue' },
      ]
    case 'settlement':
      return [
        { label: 'Clearing', value: 'Batch / RTP window' },
        { label: 'Settlement ID', value: `stl_${suffix}`, mono: true },
        { label: 'Cut-off', value: 'T+0 / T+1 per rail' },
      ]
    case 'retry':
      return [
        { label: 'Policy', value: 'Exponential backoff' },
        { label: 'Max attempts', value: '3' },
        { label: 'Queue', value: `retry_q_${suffix}`, mono: true },
      ]
    case 'routing':
      return [
        { label: 'Strategy', value: 'Cost · speed · compliance' },
        { label: 'Candidates', value: 'ACH · RTP · SWIFT' },
      ]
    case 'wallet':
      return [
        { label: 'Ledger', value: 'Double-entry wallet' },
        { label: 'Account', value: `WLT-${suffix}`, mono: true },
        { label: 'Hold policy', value: 'Available balance' },
      ]
    case 'reconciliation':
      return [
        { label: 'Source', value: 'Statement / bank file' },
        { label: 'Match key', value: `recon_${suffix}`, mono: true },
        { label: 'Tolerance', value: '± $0.01 FX' },
      ]
    default:
      return []
  }
}

export function roleForKind(kind: FDLNodeKind): NodeRole {
  return ROLES[kind]
}

export type InspectorFieldGroup = {
  id: string
  title: string
  fields: DetailRow[]
}

/** Mock integration / orchestration fields for the node inspector (phase 1). */
export function inspectorConfigForKind(
  kind: FDLNodeKind,
  nodeId: string,
): InspectorFieldGroup[] {
  const hook = `https://api.flowfin.dev/hooks/${nodeId}`
  const suffix = nodeId.slice(-4).toUpperCase()

  const commonIntegration: InspectorFieldGroup = {
    id: 'integration',
    title: 'Integration',
    fields: [
      { label: 'Webhook URL', value: hook, mono: true },
      { label: 'Auth', value: 'HMAC-SHA256 · rotating secret' },
      { label: 'Method', value: 'POST' },
      { label: 'Timeout', value: '30s' },
    ],
  }

  const commonRuntime: InspectorFieldGroup = {
    id: 'runtime',
    title: 'Runtime policy',
    fields: [
      { label: 'Retries', value: '3 · exponential' },
      { label: 'Backoff', value: '250ms → 2s' },
      { label: 'Delay', value: '0ms (sync handoff)' },
      { label: 'Circuit', value: 'Closed · 0 trips' },
    ],
  }

  switch (kind) {
    case 'start':
      return [
        {
          id: 'trigger',
          title: 'Trigger',
          fields: [
            { label: 'Source', value: 'API · manual arm' },
            { label: 'Ingress', value: '/v1/flows/arm' },
            { label: 'Correlation', value: `RUN-${suffix}`, mono: true },
          ],
        },
        commonRuntime,
      ]
    case 'end':
      return [
        {
          id: 'terminal',
          title: 'Terminal',
          fields: [
            { label: 'Seal trace', value: 'On completion' },
            { label: 'Webhook', value: `${hook}/complete`, mono: true },
            { label: 'Retention', value: '90 days' },
          ],
        },
      ]
    case 'payment':
      return [
        commonIntegration,
        {
          id: 'fees',
          title: 'Fees & routing',
          fields: [
            { label: 'Fee model', value: 'IC++ · pass-through' },
            { label: 'MCC', value: '5411 · Grocery' },
            { label: 'Rail', value: 'Visa · domestic' },
            { label: 'Idempotency', value: `idem_${nodeId}`, mono: true },
          ],
        },
        commonRuntime,
      ]
    case 'fraud_check':
      return [
        {
          id: 'rules',
          title: 'Decision engine',
          fields: [
            { label: 'Ruleset', value: 'velocity_v3 + device' },
            { label: 'Threshold', value: '720 / 1000' },
            { label: 'Simulation', value: 'Shadow · no block' },
          ],
        },
        commonIntegration,
        commonRuntime,
      ]
    case 'approval':
      return [
        {
          id: 'sca',
          title: 'Strong customer auth',
          fields: [
            { label: 'Challenge', value: 'OTP · biometrics' },
            { label: 'Timeout', value: '5 min' },
            { label: 'Fallback', value: 'Manual desk' },
          ],
        },
        commonIntegration,
        commonRuntime,
      ]
    case 'settlement':
      return [
        {
          id: 'clearing',
          title: 'Clearing',
          fields: [
            { label: 'Window', value: 'T+0 batch' },
            { label: 'Settlement ID', value: `stl_${suffix}`, mono: true },
            { label: 'Fee', value: 'Net settlement' },
          ],
        },
        commonIntegration,
        commonRuntime,
      ]
    case 'retry':
      return [
        {
          id: 'queue',
          title: 'Retry queue',
          fields: [
            { label: 'Policy', value: 'Exponential backoff' },
            { label: 'Max attempts', value: '3' },
            { label: 'DLQ', value: `dlq_${suffix}`, mono: true },
          ],
        },
        commonRuntime,
      ]
    case 'routing':
      return [
        {
          id: 'routing',
          title: 'Routing',
          fields: [
            { label: 'Strategy', value: 'Cost · speed · compliance' },
            { label: 'Candidates', value: 'ACH · RTP · SWIFT' },
            { label: 'Simulation', value: 'Dry-run corridor' },
          ],
        },
        commonIntegration,
        commonRuntime,
      ]
    case 'wallet':
      return [
        {
          id: 'ledger',
          title: 'Ledger',
          fields: [
            { label: 'Account', value: `WLT-${suffix}`, mono: true },
            { label: 'Hold', value: 'Available balance' },
            { label: 'Fee', value: '0 bps internal' },
          ],
        },
        commonIntegration,
        commonRuntime,
      ]
    case 'reconciliation':
      return [
        {
          id: 'recon',
          title: 'Reconciliation',
          fields: [
            { label: 'Source', value: 'Bank statement' },
            { label: 'Match key', value: `recon_${suffix}`, mono: true },
            { label: 'Tolerance', value: '± $0.01 FX' },
          ],
        },
        commonIntegration,
        commonRuntime,
      ]
    default:
      return [commonRuntime]
  }
}

/** Sample transaction payload for inspector display. */
export function samplePayloadForKind(
  kind: FDLNodeKind,
  nodeId: string,
): Record<string, unknown> {
  const base = {
    nodeId,
    timestamp: new Date().toISOString(),
    traceId: `tr_${nodeId}`,
  }
  switch (kind) {
    case 'payment':
      return {
        ...base,
        type: 'payment_instruction',
        amount: { value: 100000, currency: 'USD' },
        method: 'card',
        merchantRef: 'ord_8f2a',
      }
    case 'fraud_check':
      return {
        ...base,
        type: 'risk_score',
        score: 412,
        decision: 'clear',
        signals: ['device_known', 'velocity_ok'],
      }
    case 'wallet':
      return {
        ...base,
        type: 'ledger_post',
        debit: 'WLT-OUT',
        credit: 'WLT-IN',
        amount: { value: 100000, currency: 'USD' },
      }
    default:
      return { ...base, type: 'handoff', status: 'propagating' }
  }
}
