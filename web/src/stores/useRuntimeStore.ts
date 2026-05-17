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
  /**
   * Cumulative set of edge IDs that have carried failure/decline signals.
   * Edges stay in this list after traversal so they remain visually red.
   */
  failedEdgeIds: string[]
  /**
   * The active failure reason (set when a node fails).
   * Carried on edge labels during decline propagation.
   */
  failureReason: string | null
  /**
   * Per-node failure messages. Shown on the node and in the timeline
   * during decline propagation.
   */
  nodeFailureMessages: Record<string, string>
  /**
   * Active edge payload labels. Shows the "packet" data traveling along
   * each active edge during simulation, like Packet Tracer.
   */
  activeEdgePayloads: Record<string, string>
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
  failureMessage?: string,
): { title: string; detail?: string } {
  if (isFailed) {
    switch (kind) {
      case 'fraud_check': return { title: 'Check declined', detail: failureMessage ?? `${label} flagged or blocked` }
      case 'payment': return { title: 'Payment declined', detail: failureMessage ?? `${label} rejected` }
      case 'end': return { title: 'Flow ended — declined', detail: failureMessage ?? label }
      default: return { title: 'Step failed', detail: failureMessage ?? label }
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

const INITIAL_RUNTIME: Pick<
  RuntimeStore,
  'phase' | 'cursor' | 'nodeStates' | 'activeEdgeIds' | 'failedEdgeIds' | 'failureReason' | 'nodeFailureMessages' | 'activeEdgePayloads' | 'timeline'
> = {
  phase: 'idle',
  cursor: -1,
  nodeStates: {},
  activeEdgeIds: [],
  failedEdgeIds: [],
  failureReason: null,
  nodeFailureMessages: {},
  activeEdgePayloads: {},
  timeline: [],
}

export const useRuntimeStore = create<RuntimeStore>((set, get) => ({
  ...INITIAL_RUNTIME,
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
    set({ ...INITIAL_RUNTIME, nodeStates })
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
    const caseFailureReason = simCase?.failureReason ?? null
    const caseFailureMessages = simCase?.failureMessages ?? {}

    let { cursor, nodeStates, timeline, failedEdgeIds, failureReason, nodeFailureMessages } = state
    const now = Date.now()

    // Mark previous step done
    if (cursor >= 0 && cursor < seq.length) {
      const completedId = seq[cursor]
      const finalState = terminalStates[completedId] ?? 'success'
      nodeStates = { ...nodeStates, [completedId]: finalState }

      const isFailed = finalState === 'failed'
      const node = flow.nodes.find((n) => n.id === completedId)

      // When a node fails, activate the failure reason and messages
      if (isFailed && caseFailureReason) {
        failureReason = caseFailureReason
        nodeFailureMessages = { ...nodeFailureMessages, ...caseFailureMessages }
      }

      // If we're in failure propagation and this node has a failure message, record it
      const nodeMsg = failureReason ? caseFailureMessages[completedId] : undefined

      const msg = node
        ? timelineCopyForKind(
            node.kind,
            node.label ?? node.id,
            isFailed,
            isFailed ? nodeMsg : undefined,
          )
        : { title: 'Step complete' }

      // If this node is relaying a failure (not the origin), use a special timeline entry
      const isRelaying = !isFailed && failureReason && nodeMsg
      const tone: TimelineEntry['tone'] = isFailed ? 'error' : isRelaying ? 'warn' : 'success'
      const title = isRelaying ? `Relaying decline` : msg.title
      const detail = isRelaying ? nodeMsg : msg.detail

      timeline = [
        ...timeline,
        {
          id: `${now}-done-${completedId}`,
          at: now,
          title,
          detail,
          tone,
          nodeId: completedId,
        },
      ]
    }

    cursor += 1

    // End of sequence
    if (cursor >= seq.length) {
      const hasFailures = Object.keys(terminalStates).length > 0
      const endDetail = hasFailures
        ? `End-to-end simulation finished — ${failureReason ?? 'decline path'}`
        : 'End-to-end simulation finished'
      set({
        cursor,
        nodeStates,
        activeEdgeIds: [],
        activeEdgePayloads: {},
        failedEdgeIds, // preserve — keep all red edges visible
        failureReason,
        nodeFailureMessages,
        timeline: [
          ...timeline,
          {
            id: `${now}-done-flow`,
            at: Date.now(),
            title: hasFailures ? 'Simulation completed — declined' : 'Settlement completed',
            detail: endDetail,
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
    let newFailedEdgeIds = [...failedEdgeIds] // cumulative — keep previous
    let activeEdgePayloads: Record<string, string> = {}
    const caseEdgePayloads = simCase?.edgePayloads ?? {}
    if (cursor > 0) {
      const prevId = seq[cursor - 1]
      const eid = edgeBetween(flow, prevId, nextId)
      if (eid) {
        activeEdgeIds = [eid]
        // Attach payload data to active edge (like a network packet)
        if (caseEdgePayloads[eid]) {
          activeEdgePayloads[eid] = caseEdgePayloads[eid]
        }
        // Sticky failure propagation: once any node has been marked 'failed',
        // all subsequent edges accumulate in failedEdgeIds and stay red.
        const anyPriorFailed = seq.slice(0, cursor).some(
          (nid) => nodeStates[nid] === 'failed',
        )
        if (anyPriorFailed && !newFailedEdgeIds.includes(eid)) {
          newFailedEdgeIds = [...newFailedEdgeIds, eid]
        }
      }
    }

    const node = flow.nodes.find((n) => n.id === nextId)

    // If we're in failure propagation, use the failure message for the entering node
    const isInFailurePropagation = failureReason !== null
    const enterMsg = isInFailurePropagation && caseFailureMessages[nextId]
      ? caseFailureMessages[nextId]
      : undefined

    const runCopy = node
      ? timelineCopyForKind(node.kind, node.label ?? node.id)
      : { title: 'Executing step' }

    const enterTitle = isInFailurePropagation
      ? `Propagating: ${failureReason}`
      : `Entering: ${runCopy.title}`
    const enterDetail = enterMsg
      ? enterMsg
      : node
        ? `${node.kind} · ${node.label ?? node.id}`
        : undefined
    const enterTone: TimelineEntry['tone'] = isInFailurePropagation ? 'error' : 'neutral'

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
              title: enterTitle,
              detail: enterDetail,
              tone: enterTone,
              nodeId: nextId,
            },
          ]
        : [
            {
              id: `${now}-enter-${nextId}`,
              at: now,
              title: enterTitle,
              detail: enterDetail,
              tone: enterTone,
              nodeId: nextId,
            },
          ]

    set({
      cursor,
      nodeStates: nextStates,
      activeEdgeIds,
      activeEdgePayloads,
      failedEdgeIds: newFailedEdgeIds,
      failureReason,
      nodeFailureMessages,
      timeline: [...timeline, ...appended],
    })
  },
}))
