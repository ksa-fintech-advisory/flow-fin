import { create } from 'zustand'
import type {
  FlowDefinition,
  FDLNodeKind,
  RuntimeNodeState,
} from '../fdl/types'

export type SimulationPhase = 'idle' | 'running' | 'paused' | 'completed'

export interface TimelineEntry {
  id: string
  at: number
  title: string
  detail?: string
  tone: 'neutral' | 'success' | 'warn' | 'error'
  /** Node this event primarily relates to (for inspector filtering) */
  nodeId?: string
}

interface RuntimeStore {
  phase: SimulationPhase
  /** Index into simulation.sequence for the node currently marked running after advance */
  cursor: number
  nodeStates: Record<string, RuntimeNodeState>
  activeEdgeIds: string[]
  timeline: TimelineEntry[]

  bindFlow: (flow: FlowDefinition) => void
  reset: () => void
  start: () => void
  pause: () => void
  resume: () => void
  stepForward: () => void
  advanceStep: () => void
}

let boundFlow: FlowDefinition | null = null

function edgeBetween(
  flow: FlowDefinition,
  source: string,
  target: string,
): string | undefined {
  return flow.edges.find((e) => e.source === source && e.target === target)
    ?.id
}

function timelineCopyForKind(
  kind: FDLNodeKind,
  label: string,
): { title: string; detail?: string } {
  switch (kind) {
    case 'start':
      return {
        title: 'Runtime entry',
        detail: `${label} · flow armed`,
      }
    case 'end':
      return {
        title: 'Runtime exit',
        detail: `${label} · execution closed`,
      }
    case 'payment':
      return {
        title: 'Payment authorized',
        detail: `${label} accepted payload & risk flags`,
      }
    case 'fraud_check':
      return {
        title: 'Fraud check passed',
        detail: `${label} cleared velocity & device signals`,
      }
    case 'approval':
      return {
        title: 'Strong customer approval',
        detail: `${label} completed SCA challenge`,
      }
    case 'settlement':
      return {
        title: 'Settlement posted',
        detail: `${label} handed off to clearing`,
      }
    case 'retry':
      return {
        title: 'Retry scheduled',
        detail: `${label} queued with backoff`,
      }
    case 'routing':
      return { title: 'Route selected', detail: label }
    case 'wallet':
      return { title: 'Wallet updated', detail: label }
    case 'reconciliation':
      return { title: 'Reconciliation tick', detail: label }
    default:
      return { title: 'Step complete', detail: label }
  }
}

export const useRuntimeStore = create<RuntimeStore>((set, get) => ({
  phase: 'idle',
  cursor: -1,
  nodeStates: {},
  activeEdgeIds: [],
  timeline: [],

  bindFlow: (flow) => {
    boundFlow = flow
    get().reset()
  },

  reset: () => {
    const flow = boundFlow
    const nodeStates: Record<string, RuntimeNodeState> = {}
    if (flow) {
      for (const n of flow.nodes) nodeStates[n.id] = 'idle'
    }
    set({
      phase: 'idle',
      cursor: -1,
      nodeStates,
      activeEdgeIds: [],
      timeline: [],
    })
  },

  start: () => {
    const flow = boundFlow
    if (!flow?.simulation?.sequence?.length) return
    get().reset()
    set({ phase: 'running', cursor: -1 })
    get().advanceStep()
  },

  pause: () => {
    const { phase } = get()
    if (phase === 'running') set({ phase: 'paused' })
  },

  resume: () => {
    const { phase } = get()
    if (phase === 'paused') set({ phase: 'running' })
  },

  stepForward: () => {
    const flow = boundFlow
    if (!flow?.simulation?.sequence?.length) return
    const { phase } = get()
    if (phase === 'idle' || phase === 'completed') {
      get().reset()
      set({ phase: 'running', cursor: -1 })
    } else if (phase === 'paused') {
      set({ phase: 'running' })
    }
    get().advanceStep()
  },

  advanceStep: () => {
    const flow = boundFlow
    if (!flow?.simulation?.sequence) return
    const seq = flow.simulation.sequence
    const state = get()
    if (state.phase !== 'running') return

    let { cursor, nodeStates, timeline } = state
    const now = Date.now()

    if (cursor >= 0 && cursor < seq.length) {
      const completedId = seq[cursor]
      nodeStates = { ...nodeStates, [completedId]: 'success' }
      const node = flow.nodes.find((n) => n.id === completedId)
      const msg = node
        ? timelineCopyForKind(node.kind, node.label ?? node.id)
        : { title: 'Step complete' }
      timeline = [
        ...timeline,
        {
          id: `${now}-done-${completedId}`,
          at: now,
          title: msg.title,
          detail: msg.detail,
          tone: 'success' as const,
          nodeId: completedId,
        },
      ]
    }

    cursor += 1

    if (cursor >= seq.length) {
      set({
        cursor,
        nodeStates,
        activeEdgeIds: [],
        timeline: [
          ...timeline,
          {
            id: `${now}-done-flow`,
            at: Date.now(),
            title: 'Settlement completed',
            detail: 'End-to-end simulation finished',
            tone: 'success',
          },
        ],
        phase: 'completed',
      })
      return
    }

    const nextId = seq[cursor]
    const nextStates: Record<string, RuntimeNodeState> = {
      ...nodeStates,
      [nextId]: 'running',
    }
    let activeEdgeIds: string[] = []
    if (cursor > 0) {
      const prevId = seq[cursor - 1]
      const eid = edgeBetween(flow, prevId, nextId)
      if (eid) activeEdgeIds = [eid]
    }

    const node = flow.nodes.find((n) => n.id === nextId)
    const runCopy = node
      ? timelineCopyForKind(node.kind, node.label ?? node.id)
      : { title: 'Executing step' }

    const appended: TimelineEntry[] =
      cursor === 0
        ? [
            {
              id: `${now}-flow-start`,
              at: now,
              title: 'Flow started',
              detail: flow.name,
              tone: 'neutral',
            },
            {
              id: `${now}-enter-${nextId}`,
              at: now + 1,
              title: `Entering: ${runCopy.title}`,
              detail: node ? `${node.kind} · ${node.label ?? node.id}` : undefined,
              tone: 'neutral',
              nodeId: nextId,
            },
          ]
        : [
            {
              id: `${now}-enter-${nextId}`,
              at: now,
              title: `Entering: ${runCopy.title}`,
              detail: node ? `${node.kind} · ${node.label ?? node.id}` : undefined,
              tone: 'neutral',
              nodeId: nextId,
            },
          ]

    set({
      cursor,
      nodeStates: nextStates,
      activeEdgeIds,
      timeline: [...timeline, ...appended],
    })
  },
}))
