import type { FlowDefinition } from '../fdl/types'
import type { DomainZone } from './runtimeTypes'

/** Lightweight infrastructure zones — keyed by flow id. */
const ZONES_BY_FLOW: Record<string, DomainZone[]> = {
  'card-payment': [
    {
      id: 'zone-checkout',
      label: 'Payment Gateway',
      nodeIds: ['nmerch', 'ngw'],
      accent: 'rgba(56, 189, 248, 0.14)',
    },
    {
      id: 'zone-processor',
      label: 'Card Network',
      nodeIds: ['nproc', 'nnet'],
      accent: 'rgba(167, 139, 250, 0.12)',
    },
    {
      id: 'zone-banking',
      label: 'Banking Layer',
      nodeIds: ['nacq', 'niss'],
      accent: 'rgba(52, 211, 153, 0.1)',
    },
  ],
  'fraud-escalation': [
    {
      id: 'zone-risk',
      label: 'Risk Systems',
      nodeIds: ['nfraud', 'nreview', 'nblock'],
      accent: 'rgba(248, 113, 113, 0.12)',
    },
    {
      id: 'zone-payments',
      label: 'Payment Gateway',
      nodeIds: ['ngw', 'nproc'],
      accent: 'rgba(56, 189, 248, 0.12)',
    },
  ],
  'chargeback': [
    {
      id: 'zone-settlement',
      label: 'Settlement Systems',
      nodeIds: ['nsettle', 'nacq'],
      accent: 'rgba(52, 211, 153, 0.12)',
    },
    {
      id: 'zone-disputes',
      label: 'Dispute Ops',
      nodeIds: ['ndispute', 'nledger'],
      accent: 'rgba(251, 191, 36, 0.12)',
    },
  ],
}

const GENERIC_ZONES: DomainZone[] = [
  {
    id: 'zone-ingress',
    label: 'Ingress',
    nodeIds: [],
    accent: 'rgba(56, 189, 248, 0.1)',
  },
  {
    id: 'zone-core',
    label: 'Processing Core',
    nodeIds: [],
    accent: 'rgba(148, 163, 184, 0.08)',
  },
]

export function domainZonesForFlow(flow: FlowDefinition): DomainZone[] {
  const preset = ZONES_BY_FLOW[flow.id]
  if (preset) {
    const known = new Set(flow.nodes.map((n) => n.id))
    return preset
      .map((z) => ({
        ...z,
        nodeIds: z.nodeIds.filter((id) => known.has(id)),
      }))
      .filter((z) => z.nodeIds.length > 0)
  }

  const nodes = flow.nodes.filter((n) => n.kind !== 'start' && n.kind !== 'end')
  if (nodes.length < 4) return []

  const third = Math.ceil(nodes.length / 3)
  return [
    {
      ...GENERIC_ZONES[0]!,
      nodeIds: nodes.slice(0, third).map((n) => n.id),
    },
    {
      ...GENERIC_ZONES[1]!,
      label: flow.metadata?.domain === 'risk' ? 'Risk Systems' : 'Infrastructure',
      nodeIds: nodes.slice(third, third * 2).map((n) => n.id),
    },
    {
      id: 'zone-egress',
      label: 'Settlement',
      nodeIds: nodes.slice(third * 2).map((n) => n.id),
      accent: 'rgba(52, 211, 153, 0.1)',
    },
  ].filter((z) => z.nodeIds.length > 0)
}
