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
