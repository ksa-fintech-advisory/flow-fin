import type { FlowDefinition, SimulationCase } from '../types'

export type ScenarioMeta = {
  id: string
  title: string
  subtitle: string
  flow: FlowDefinition
}

function spine(
  steps: string[],
  stepDelayMs: number,
): NonNullable<FlowDefinition['simulation']> {
  return { stepDelayMs, sequence: steps }
}

/** Build simulation config with multiple named cases */
function multiCase(
  stepDelayMs: number,
  cases: SimulationCase[],
): NonNullable<FlowDefinition['simulation']> {
  return {
    stepDelayMs,
    sequence: cases[0]!.sequence, // default for backward compat
    cases,
  }
}

const S = 'n_start'
const E = 'n_end'

export const SCENARIOS: ScenarioMeta[] = [
  /* ─── 1. Card Payment (from spec — real bidirectional flow) ─── */
  {
    id: 'card-payment',
    title: 'Card payment',
    subtitle: 'Full authorization: request forward → issuer decision → response back',
    flow: {
      id: 'card-payment',
      name: 'Card payment authorization',
      metadata: { domain: 'payments' },
      nodes: [
        { id: S, kind: 'start', label: 'Customer' },
        { id: 'ngw', kind: 'payment', label: 'Payment gateway' },
        { id: 'nproc', kind: 'payment', label: 'Payment processor' },
        { id: 'nacq', kind: 'settlement', label: 'Acquirer bank' },
        { id: 'nnet', kind: 'routing', label: 'Card network' },
        { id: 'niss', kind: 'fraud_check', label: 'Issuing bank' },
        { id: E, kind: 'end', label: 'Result' },
      ],
      edges: [
        /* Forward request path */
        { id: 'e0', source: S, target: 'ngw', label: 'card data' },
        { id: 'e1', source: 'ngw', target: 'nproc' },
        { id: 'e2', source: 'nproc', target: 'nacq' },
        { id: 'e3', source: 'nacq', target: 'nnet' },
        { id: 'e4', source: 'nnet', target: 'niss' },
        /* Backward response path */
        { id: 'e5', source: 'niss', target: 'nnet', label: 'response' },
        { id: 'e6', source: 'nnet', target: 'nacq', label: 'relay' },
        { id: 'e7', source: 'nacq', target: 'nproc', label: 'relay' },
        { id: 'e8', source: 'nproc', target: 'ngw', label: 'relay' },
        { id: 'e9', source: 'ngw', target: E, label: 'result' },
      ],
      simulation: multiCase(800, [
        {
          id: 'approved',
          label: '✓ Approved — balance OK, no risk',
          context: 'Customer pays $1,000.00 at an e-commerce merchant using Visa ****4242',
          sequence: [S, 'ngw', 'nproc', 'nacq', 'nnet', 'niss', 'nnet', 'nacq', 'nproc', 'ngw', E],
          edgePayloads: {
            e0: 'PAN ****4242 · $1,000.00',
            e1: 'AUTH_REQ · $1,000.00 · MID-8821',
            e2: 'ISO 8583 · 0100 · $1,000.00',
            e3: 'AUTH · BIN 424242 · $1,000.00',
            e4: 'AUTH_REQ · $1,000.00',
            e5: 'RSP 00 · Approved',
            e6: 'AUTH_RSP · Approved · $1,000.00',
            e7: 'RSP 00 · ref:TXN-7842',
            e8: 'APPROVED · ref:TXN-7842',
            e9: '✓ $1,000.00 settled',
          },
        },
        {
          id: 'declined-balance',
          label: '✗ Declined — insufficient balance',
          context: 'Customer attempts $1,000.00 purchase — account balance is $420.00',
          sequence: [S, 'ngw', 'nproc', 'nacq', 'nnet', 'niss', 'nnet', 'nacq', 'nproc', 'ngw', E],
          terminalStates: { niss: 'failed', [E]: 'failed' },
          failureReason: 'Insufficient balance',
          failureMessages: {
            niss: 'Balance check failed — $420.00 available, $1,000.00 requested',
            nnet: 'Relaying decline response code 51',
            nacq: 'Authorization declined by issuer',
            nproc: 'Forwarding decline to gateway',
            ngw: 'Transaction declined — notifying merchant',
            [E]: 'Payment declined',
          },
          edgePayloads: {
            e0: 'PAN ****4242 · $1,000.00',
            e1: 'AUTH_REQ · $1,000.00 · MID-8821',
            e2: 'ISO 8583 · 0100 · $1,000.00',
            e3: 'AUTH · BIN 424242 · $1,000.00',
            e4: 'AUTH_REQ · $1,000.00',
            e5: 'RSP 51 · Insufficient funds',
            e6: 'DECLINE · code 51 · $1,000.00',
            e7: 'DECLINED · ref:TXN-7842',
            e8: 'DECLINE · insufficient funds',
            e9: '✗ $1,000.00 declined',
          },
        },
        {
          id: 'declined-risk',
          label: '✗ Declined — risk flagged',
          context: 'Customer attempts $1,000.00 purchase — flagged by fraud detection',
          sequence: [S, 'ngw', 'nproc', 'nacq', 'nnet', 'niss', 'nnet', 'nacq', 'nproc', 'ngw', E],
          terminalStates: { niss: 'failed', [E]: 'failed' },
          failureReason: 'Risk flagged',
          failureMessages: {
            niss: 'Transaction flagged by fraud detection — risk score exceeded threshold',
            nnet: 'Relaying decline response code 59',
            nacq: 'Authorization declined — suspected fraud',
            nproc: 'Forwarding risk decline to gateway',
            ngw: 'Transaction blocked — risk flag',
            [E]: 'Payment blocked',
          },
          edgePayloads: {
            e0: 'PAN ****4242 · $1,000.00',
            e1: 'AUTH_REQ · $1,000.00 · MID-8821',
            e2: 'ISO 8583 · 0100 · $1,000.00',
            e3: 'AUTH · BIN 424242 · $1,000.00',
            e4: 'AUTH_REQ · $1,000.00',
            e5: 'RSP 59 · Suspected fraud',
            e6: 'DECLINE · code 59 · $1,000.00',
            e7: 'DECLINED · ref:TXN-7842',
            e8: 'DECLINE · risk flagged',
            e9: '✗ $1,000.00 blocked',
          },
        },
      ]),
    },
  },
  /* ─── 2. Card capture ─── */
  {
    id: 'card-capture',
    title: 'Card capture',
    subtitle: 'Ingest → fraud → approval → settlement + retry loop',
    flow: {
      id: 'card-capture',
      name: 'Card capture → fraud → approval → settlement',
      metadata: { domain: 'payments' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'npay', kind: 'payment', label: 'Payment ingest' },
        { id: 'nfraud', kind: 'fraud_check', label: 'Fraud screening' },
        { id: 'napprove', kind: 'approval', label: 'SCA / approval' },
        { id: 'nsettle', kind: 'settlement', label: 'Settlement rail' },
        { id: 'nretry', kind: 'retry', label: 'Retry buffer' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'npay' },
        { id: 'e1', source: 'npay', target: 'nfraud' },
        { id: 'e2', source: 'nfraud', target: 'napprove', label: 'clear' },
        { id: 'e3', source: 'napprove', target: 'nsettle' },
        { id: 'e4', source: 'nsettle', target: E },
        { id: 'e5', source: 'nfraud', target: 'nretry', label: 'soft decline' },
        { id: 'e6', source: 'nretry', target: 'nfraud', label: 're-present' },
      ],
      simulation: multiCase(900, [
        { id: 'success', label: '✓ Approved — fraud clear', context: 'Merchant captures $350.00 debit card payment — fraud score 12/100', sequence: [S, 'npay', 'nfraud', 'napprove', 'nsettle', E] },
        { id: 'soft-decline', label: '⟲ Soft decline — retry loop', context: 'Merchant captures $350.00 — soft decline on first attempt, re-presented', sequence: [S, 'npay', 'nfraud', 'nretry', 'nfraud', 'napprove', 'nsettle', E] },
        { id: 'hard-decline', label: '✗ Hard decline — blocked', context: 'Merchant captures $350.00 — card flagged as stolen', sequence: [S, 'npay', 'nfraud'], terminalStates: { nfraud: 'failed' }, failureReason: 'Card flagged as stolen', failureMessages: { nfraud: 'Fraud screening blocked — card reported stolen' } },
      ]),
    },
  },
  /* ─── 3. Instant refund ─── */
  {
    id: 'instant-refund',
    title: 'Instant refund',
    subtitle: 'Wallet → screening → route ok/challenge → ledger sync',
    flow: {
      id: 'instant-refund',
      name: 'Instant refund path',
      metadata: { domain: 'payments' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'nw', kind: 'wallet', label: 'Wallet ledger' },
        { id: 'npay', kind: 'payment', label: 'Refund post' },
        { id: 'nfraud', kind: 'fraud_check', label: 'Refund screening' },
        { id: 'nroute', kind: 'routing', label: 'Route policy' },
        { id: 'napprove', kind: 'approval', label: 'Manual OK' },
        { id: 'nrec', kind: 'reconciliation', label: 'Ledger sync' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'nw' },
        { id: 'e1', source: 'nw', target: 'npay' },
        { id: 'e2', source: 'npay', target: 'nfraud' },
        { id: 'e3', source: 'nfraud', target: 'nroute' },
        { id: 'e4', source: 'nroute', target: 'napprove', label: 'challenge' },
        { id: 'e5', source: 'nroute', target: 'nrec', label: 'auto' },
        { id: 'e6', source: 'napprove', target: 'nrec' },
        { id: 'e7', source: 'nrec', target: E },
      ],
      simulation: multiCase(850, [
        { id: 'auto-approve', label: '✓ Auto-approved refund', context: 'Customer requests $89.99 refund — within auto-approval threshold', sequence: [S, 'nw', 'npay', 'nfraud', 'nroute', 'nrec', E] },
        { id: 'manual-review', label: '⚠ Manual review required', context: 'Customer requests $2,500.00 refund — exceeds auto-approval limit', sequence: [S, 'nw', 'npay', 'nfraud', 'nroute', 'napprove', 'nrec', E] },
      ]),
    },
  },
  /* ─── 4. Crypto on-ramp ─── */
  {
    id: 'crypto-onramp',
    title: 'Crypto on-ramp',
    subtitle: 'Wallet → route chain → fraud → settlement rail',
    flow: {
      id: 'crypto-onramp',
      name: 'Crypto on-ramp',
      metadata: { domain: 'crypto' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'nw', kind: 'wallet', label: 'Custodial wallet' },
        { id: 'nroute', kind: 'routing', label: 'Chain / rail pick' },
        { id: 'nfraud', kind: 'fraud_check', label: 'AML screening' },
        { id: 'nsettle', kind: 'settlement', label: 'On-chain settle' },
        { id: 'nretry', kind: 'retry', label: 'Resubmit' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'nw' },
        { id: 'e1', source: 'nw', target: 'nroute' },
        { id: 'e2', source: 'nroute', target: 'nfraud' },
        { id: 'e3', source: 'nfraud', target: 'nsettle', label: 'pass' },
        { id: 'e4', source: 'nfraud', target: 'nretry', label: 'review' },
        { id: 'e5', source: 'nretry', target: 'nroute', label: 're-quote' },
        { id: 'e6', source: 'nsettle', target: E },
      ],
      simulation: multiCase(880, [
        { id: 'pass', label: '✓ AML pass — settled', context: 'Customer buys 0.5 ETH ($1,250.00) via bank transfer — AML clear', sequence: [S, 'nw', 'nroute', 'nfraud', 'nsettle', E] },
        { id: 'review-retry', label: '⟲ AML review — resubmit', context: 'Customer buys 2.0 BTC ($58,000.00) — requires enhanced due diligence', sequence: [S, 'nw', 'nroute', 'nfraud', 'nretry', 'nroute', 'nfraud', 'nsettle', E] },
        { id: 'blocked', label: '✗ AML blocked', context: 'Customer attempts $150,000.00 purchase — sanctioned jurisdiction', sequence: [S, 'nw', 'nroute', 'nfraud'], terminalStates: { nfraud: 'failed' }, failureReason: 'Sanctioned jurisdiction', failureMessages: { nfraud: 'AML screening blocked — originator jurisdiction on OFAC sanctions list' } },
      ]),
    },
  },
  /* ─── 5. Treasury sweep ─── */
  {
    id: 'treasury-sweep',
    title: 'Treasury sweep',
    subtitle: 'Rec batch → route destinations → settlement → wallets',
    flow: {
      id: 'treasury-sweep',
      name: 'Treasury sweep',
      metadata: { domain: 'treasury' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'nrec', kind: 'reconciliation', label: 'Positions recon' },
        { id: 'nroute', kind: 'routing', label: 'Sweep router' },
        { id: 'nsettle', kind: 'settlement', label: 'CLS / ACH' },
        { id: 'nw', kind: 'wallet', label: 'House wallet' },
        { id: 'nretry', kind: 'retry', label: 'Retry queue' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'nrec' },
        { id: 'e1', source: 'nrec', target: 'nroute' },
        { id: 'e2', source: 'nroute', target: 'nsettle', label: 'primary' },
        { id: 'e3', source: 'nroute', target: 'nretry', label: 'defer' },
        { id: 'e4', source: 'nretry', target: 'nroute', label: 'flush' },
        { id: 'e5', source: 'nsettle', target: 'nw' },
        { id: 'e6', source: 'nw', target: E },
      ],
      simulation: multiCase(920, [
        { id: 'primary', label: '✓ Primary sweep', context: 'EOD sweep — $4.2M excess liquidity routed to overnight deposit', sequence: [S, 'nrec', 'nroute', 'nsettle', 'nw', E] },
        { id: 'deferred', label: '⟲ Deferred → retry → sweep', context: 'EOD sweep — $4.2M deferred due to cut-off, retried next window', sequence: [S, 'nrec', 'nroute', 'nretry', 'nroute', 'nsettle', 'nw', E] },
      ]),
    },
  },
  /* ─── 6. Batch payout ─── */
  {
    id: 'batch-payout',
    title: 'Batch payout',
    subtitle: 'Router splits payrails → parallel settle → single recon',
    flow: {
      id: 'batch-payout',
      name: 'Batch payout',
      metadata: { domain: 'payments' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'nroute', kind: 'routing', label: 'Batch router' },
        { id: 'npay_a', kind: 'payment', label: 'Rail A file' },
        { id: 'npay_b', kind: 'payment', label: 'Rail B file' },
        { id: 'nset_a', kind: 'settlement', label: 'Settle A' },
        { id: 'nset_b', kind: 'settlement', label: 'Settle B' },
        { id: 'nrec', kind: 'reconciliation', label: 'Unified recon' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'nroute' },
        { id: 'e1', source: 'nroute', target: 'npay_a', label: 'slice A' },
        { id: 'e2', source: 'nroute', target: 'npay_b', label: 'slice B' },
        { id: 'e3', source: 'npay_a', target: 'nset_a' },
        { id: 'e4', source: 'npay_b', target: 'nset_b' },
        { id: 'e5', source: 'nset_a', target: 'nrec' },
        { id: 'e6', source: 'nset_b', target: 'nrec' },
        { id: 'e7', source: 'nrec', target: E },
      ],
      simulation: multiCase(900, [
        { id: 'rail-a', label: 'Rail A path', context: 'Processing 1,200 payroll records — $890K via ACH (Rail A)', sequence: [S, 'nroute', 'npay_a', 'nset_a', 'nrec', E] },
        { id: 'rail-b', label: 'Rail B path', context: 'Processing 340 vendor payments — $2.1M via wire (Rail B)', sequence: [S, 'nroute', 'npay_b', 'nset_b', 'nrec', E] },
      ]),
    },
  },
  /* ─── 7. Cross-border FX ─── */
  {
    id: 'cross-border-fx',
    title: 'Cross-border FX',
    subtitle: 'Route corridor → fraud → approval → settle',
    flow: {
      id: 'cross-border-fx',
      name: 'Cross-border FX',
      metadata: { domain: 'payments' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'nroute', kind: 'routing', label: 'Corridor pick' },
        { id: 'nfraud', kind: 'fraud_check', label: 'Compliance' },
        { id: 'napprove', kind: 'approval', label: 'Treasury sign-off' },
        { id: 'nsettle', kind: 'settlement', label: 'SWIFT / RTP' },
        { id: 'nretry', kind: 'retry', label: 'Repair queue' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'nroute' },
        { id: 'e1', source: 'nroute', target: 'nfraud' },
        { id: 'e2', source: 'nfraud', target: 'napprove', label: 'release' },
        { id: 'e3', source: 'nfraud', target: 'nretry', label: 'hold' },
        { id: 'e4', source: 'nretry', target: 'nroute', label: 're-route' },
        { id: 'e5', source: 'napprove', target: 'nsettle' },
        { id: 'e6', source: 'nsettle', target: E },
      ],
      simulation: multiCase(900, [
        { id: 'release', label: '✓ Released — compliance pass', context: 'EUR→USD $25,000.00 transfer — London to New York corridor', sequence: [S, 'nroute', 'nfraud', 'napprove', 'nsettle', E] },
        { id: 'hold-reroute', label: '⟲ Held → repair → re-route', context: 'EUR→USD $25,000.00 — held for missing beneficiary details', sequence: [S, 'nroute', 'nfraud', 'nretry', 'nroute', 'nfraud', 'napprove', 'nsettle', E] },
        { id: 'blocked', label: '✗ Compliance blocked', context: 'EUR→RUB $200,000.00 — sanctioned corridor', sequence: [S, 'nroute', 'nfraud'], terminalStates: { nfraud: 'failed' }, failureReason: 'Sanctioned corridor', failureMessages: { nfraud: 'Compliance blocked — destination corridor under EU sanctions' } },
      ]),
    },
  },
  /* ─── 8. Chargeback dispute ─── */
  {
    id: 'chargeback',
    title: 'Chargeback dispute',
    subtitle: 'Ledger hook → fraud → approval → settlement credit',
    flow: {
      id: 'chargeback',
      name: 'Chargeback dispute',
      metadata: { domain: 'risk' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'nrec', kind: 'reconciliation', label: 'CB intake' },
        { id: 'nfraud', kind: 'fraud_check', label: 'Evidence fit' },
        { id: 'napprove', kind: 'approval', label: 'Dispute desk' },
        { id: 'nsettle', kind: 'settlement', label: 'Chargeback settle' },
        { id: 'nretry', kind: 'retry', label: 'Evidence retry' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'nrec' },
        { id: 'e1', source: 'nrec', target: 'nfraud' },
        { id: 'e2', source: 'nfraud', target: 'napprove', label: 'accept' },
        { id: 'e3', source: 'nfraud', target: 'nretry', label: 'needs docs' },
        { id: 'e4', source: 'nretry', target: 'nfraud', label: 're-review' },
        { id: 'e5', source: 'napprove', target: 'nsettle' },
        { id: 'e6', source: 'nsettle', target: E },
      ],
      simulation: multiCase(910, [
        { id: 'accepted', label: '✓ Evidence accepted', context: 'Dispute for $299.00 — merchant provides delivery tracking proof', sequence: [S, 'nrec', 'nfraud', 'napprove', 'nsettle', E] },
        { id: 'retry-docs', label: '⟲ Needs docs → retry', context: 'Dispute for $1,450.00 — additional invoice documentation requested', sequence: [S, 'nrec', 'nfraud', 'nretry', 'nfraud', 'napprove', 'nsettle', E] },
        { id: 'lost', label: '✗ Dispute lost', context: 'Dispute for $750.00 — insufficient evidence, merchant loses', sequence: [S, 'nrec', 'nfraud'], terminalStates: { nfraud: 'failed' }, failureReason: 'Insufficient evidence', failureMessages: { nfraud: 'Evidence review failed — documentation does not meet card network requirements' } },
      ]),
    },
  },
  /* ─── 9. Fraud escalation ─── */
  {
    id: 'fraud-escalation',
    title: 'Fraud escalation',
    subtitle: 'Payment stuck → fraud loops → manual approval outlet',
    flow: {
      id: 'fraud-escalation',
      name: 'Fraud escalation',
      metadata: { domain: 'risk' },
      nodes: [
        { id: S, kind: 'start', label: 'Entry' },
        { id: 'npay', kind: 'payment', label: 'Suspicious txn' },
        { id: 'nfraud', kind: 'fraud_check', label: 'Rules engine' },
        { id: 'nroute', kind: 'routing', label: 'Escalation tier' },
        { id: 'napprove', kind: 'approval', label: 'SOC analyst' },
        { id: 'nsettle', kind: 'settlement', label: 'Safe release' },
        { id: 'nretry', kind: 'retry', label: 'Cool-off queue' },
        { id: E, kind: 'end', label: 'Exit' },
      ],
      edges: [
        { id: 'e0', source: S, target: 'npay' },
        { id: 'e1', source: 'npay', target: 'nfraud' },
        { id: 'e2', source: 'nfraud', target: 'nroute', label: 'score' },
        { id: 'e3', source: 'nroute', target: 'napprove', label: 'tier-2' },
        { id: 'e4', source: 'nroute', target: 'nretry', label: 'defer' },
        { id: 'e5', source: 'nretry', target: 'nfraud', label: 'replay' },
        { id: 'e6', source: 'napprove', target: 'nsettle' },
        { id: 'e7', source: 'nsettle', target: E },
      ],
      simulation: multiCase(890, [
        { id: 'tier2-release', label: '✓ Tier-2 → analyst → release', context: 'Suspicious $8,200.00 wire transfer — analyst confirms legitimate', sequence: [S, 'npay', 'nfraud', 'nroute', 'napprove', 'nsettle', E] },
        { id: 'cooloff-replay', label: '⟲ Deferred → cooloff → replay', context: 'Suspicious $8,200.00 wire — deferred for 24h monitoring, replayed', sequence: [S, 'npay', 'nfraud', 'nroute', 'nretry', 'nfraud', 'nroute', 'napprove', 'nsettle', E] },
      ]),
    },
  },
]

export const DEFAULT_SCENARIO_ID = SCENARIOS[0]!.id

/** @deprecated Use scenarios from SCENARIOS — kept for imports */
export const sampleFlow = SCENARIOS[0]!.flow
