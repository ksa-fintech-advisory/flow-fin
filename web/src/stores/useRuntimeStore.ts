import { create } from 'zustand'
import type {
  FlowDefinition,
  FDLNodeKind,
  RuntimeNodeState,
  SimulationCase,
} from '../fdl/types'

export type SimulationPhase = 'idle' | 'running' | 'paused' | 'completed'

export interface TimelineEntry {
  id: string
  at: number
  title: string
  detail?: string
  tone: 'neutral' | 'success' | 'warn' | 'error'
  nodeId?: string
}

interface RuntimeStore {
  phase: SimulationPhase
  cursor: number
  nodeStates: Record<string, RuntimeNodeState>
  activeEdgeIds: string[]
  /** Edge IDs that are currently carrying failure/decline signals */
  failedEdgeIds: string[]
  timeline: TimelineEntry[]
  /** Currently selected simulation case id */
  activeCaseId: string | null

  bindFlow: (flow: FlowDefinition) => void
  reset: () => void
  start: () => void
  pause: () => void
  resume: () => void
  stepForward: () => void
  advanceStep: () => void
  selectCase: (caseId: string) => void
}

let boundFlow: FlowDefinition | null = null

function getActiveCase(flow: FlowDefinition, caseId: string | null): SimulationCase | null {
  const cases = flow.simulation?.cases
  if (!cases?.length) return null
  if (caseId) {
    const found = cases.find((c) => c.id === caseId)
    if (found) return found
  }
  return cases[0]!
}

function getSequence(flow: FlowDefinition, caseId: string | null): string[] {
  const simCase = getActiveCase(flow, caseId)
  if (simCase) return simCase.sequence
  return flow.simulation?.sequence ?? []
}

function edgeBetween(
  flow: FlowDefinition,
  source: string,
  target: string,
): string | undefined {
  return flow.edges.find((e) => e.source === source && e.target === target)?.id
}

function timelineCopyForKind(
  kind: FDLNodeKind,
  label: string,
  isFailed?: boolean,
): { title: string; detail?: string } {
  if (isFailed) {
    switch (kind) {
      case 'fraud_check': return { title: 'Check declined', detail: `${label} flagged or blocked` }
      case 'payment': return { title: 'Payment declined', detail: `${label} rejected` }
      case 'end': return { title: 'Flow ended — declined', detail: label }
      default: return { title: 'Step failed', detail: label }
    }
  }
  switch (kind) {
    case 'start': return { title: 'Runtime entry', detail: `${label} · flow armed` }
    case 'end': return { title: 'Runtime exit', detail: `${label} · execution closed` }
    case 'payment': return { title: 'Payment authorized', detail: `${label} accepted payload & risk flags` }
    case 'fraud_check': return { title: 'Fraud check passed', detail: `${label} cleared velocity & device signals` }
    case 'approval': return { title: 'Strong customer approval', detail: `${label} completed SCA challenge` }
    case 'settlement': return { title: 'Settlement posted', detail: `${label} handed off to clearing` }
    case 'retry': return { title: 'Retry scheduled', detail: `${label} queued with backoff` }
    case 'routing': return { title: 'Route selected', detail: label }
    case 'wallet': return { title: 'Wallet updated', detail: label }
    case 'reconciliation': return { title: 'Reconciliation tick', detail: label }
    default: return { title: 'Step complete', detail: label }
  }
}

export const useRuntimeStore = create<RuntimeStore>((set, get) => ({
  phase: 'idle',
  cursor: -1,
  nodeStates: {},
  activeEdgeIds: [],
  failedEdgeIds: [],
  timeline: [],
  activeCaseId: null,

  selectCase: (caseId) => {
    set({ activeCaseId: caseId })
    get().reset()
  },

  bindFlow: (flow) => {
    boundFlow = flow
    // Auto-select the first case if available
    const cases = flow.simulation?.cases
    set({ activeCaseId: cases?.[0]?.id ?? null })
    get().reset()
  },

  reset: () => {
    const flow = boundFlow
    const nodeStates: Record<string, RuntimeNodeState> = {}
    if (flow) {
      for (const n of flow.nodes) nodeStates[n.id] = 'idle'
    }
    set({ phase: 'idle', cursor: -1, nodeStates, activeEdgeIds: [], failedEdgeIds: [], timeline: [] })
  },

  start: () => {
    const flow = boundFlow
    if (!flow) return
    const seq = getSequence(flow, get().activeCaseId)
    if (!seq.length) return
    get().reset()
    set({ phase: 'running', cursor: -1 })
    get().advanceStep()
  },

  pause: () => {
    if (get().phase === 'running') set({ phase: 'paused' })
  },

  resume: () => {
    if (get().phase === 'paused') set({ phase: 'running' })
  },

  stepForward: () => {
    const flow = boundFlow
    if (!flow) return
    const seq = getSequence(flow, get().activeCaseId)
    if (!seq.length) return
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
    if (!flow) return
    const state = get()
    if (state.phase !== 'running') return

    const seq = getSequence(flow, state.activeCaseId)
    if (!seq.length) return

    const simCase = getActiveCase(flow, state.activeCaseId)
    const terminalStates = simCase?.terminalStates ?? {}

    let { cursor, nodeStates, timeline } = state
    const now = Date.now()

    // Mark previous step done
    if (cursor >= 0 && cursor < seq.length) {
      const completedId = seq[cursor]
      const finalState = terminalStates[completedId] ?? 'success'
      nodeStates = { ...nodeStates, [completedId]: finalState }
      const node = flow.nodes.find((n) => n.id === completedId)
      const isFailed = finalState === 'failed'
      const msg = node
        ? timelineCopyForKind(node.kind, node.label ?? node.id, isFailed)
        : { title: 'Step complete' }
      timeline = [
        ...timeline,
        {
          id: `${now}-done-${completedId}`,
          at: now,
          title: msg.title,
          detail: msg.detail,
          tone: isFailed ? 'error' : 'success',
          nodeId: completedId,
        },
      ]
    }

    cursor += 1

    // End of sequence
    if (cursor >= seq.length) {
      const hasFailures = Object.keys(terminalStates).length > 0
      set({
        cursor,
        nodeStates,
        activeEdgeIds: [],
        failedEdgeIds: [],
        timeline: [
          ...timeline,
          {
            id: `${now}-done-flow`,
            at: Date.now(),
            title: hasFailures ? 'Simulation completed — declined' : 'Settlement completed',
            detail: hasFailures ? 'End-to-end simulation finished (decline path)' : 'End-to-end simulation finished',
            tone: hasFailures ? 'error' : 'success',
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
    let failedEdgeIds: string[] = []
    if (cursor > 0) {
      const prevId = seq[cursor - 1]
      const eid = edgeBetween(flow, prevId, nextId)
      if (eid) {
        activeEdgeIds = [eid]
        // Sticky failure propagation: once any node in the sequence has
        // been marked 'failed', all subsequent edges carry the failure signal.
        // This creates a continuous red decline path from the origin of failure
        // through all relay nodes back to the end.
        const anyPriorFailed = seq.slice(0, cursor).some(
          (nid) => nodeStates[nid] === 'failed',
        )
        if (anyPriorFailed) {
          failedEdgeIds = [eid]
        }
      }
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
              detail: `${flow.name}${simCase ? ` · ${simCase.label}` : ''}`,
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
      failedEdgeIds,
      timeline: [...timeline, ...appended],
    })
  },
}))
