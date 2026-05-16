import type { FDLNodeKind } from '../fdl/types'

/** Presentation geometry — processes are rectangles, decisions diamonds, terminals circles */
export type NodeShapeKind = 'terminal' | 'condition' | 'process'

export type NodeVisual = {
  accent: string
  muted: string
  shape: NodeShapeKind
}

export const NODE_VISUALS: Record<FDLNodeKind, NodeVisual> = {
  start: {
    accent: '#4ade80',
    muted: 'rgba(74,222,128,0.2)',
    shape: 'terminal',
  },
  end: {
    accent: '#f87171',
    muted: 'rgba(248,113,113,0.18)',
    shape: 'terminal',
  },
  payment: {
    accent: '#34d399',
    muted: 'rgba(52,211,153,0.15)',
    shape: 'process',
  },
  fraud_check: {
    accent: '#fbbf24',
    muted: 'rgba(251,191,36,0.18)',
    shape: 'condition',
  },
  approval: {
    accent: '#a78bfa',
    muted: 'rgba(167,139,250,0.18)',
    shape: 'process',
  },
  settlement: {
    accent: '#38bdf8',
    muted: 'rgba(56,189,248,0.16)',
    shape: 'process',
  },
  retry: {
    accent: '#fb923c',
    muted: 'rgba(251,146,60,0.18)',
    shape: 'process',
  },
  routing: {
    accent: '#94a3b8',
    muted: 'rgba(148,163,184,0.14)',
    shape: 'condition',
  },
  wallet: {
    accent: '#2dd4bf',
    muted: 'rgba(45,212,191,0.15)',
    shape: 'process',
  },
  reconciliation: {
    accent: '#c084fc',
    muted: 'rgba(192,132,252,0.15)',
    shape: 'process',
  },
}
