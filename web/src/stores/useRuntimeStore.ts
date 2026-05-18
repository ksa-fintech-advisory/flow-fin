import { create } from 'zustand'
import type {
  FlowDefinition,
  FDLNodeKind,
  RuntimeNodeState,
  SimulationCase,
} from '../fdl/types'
import { detectBackwardEdges } from '../layout/applyElkLayout'
import {
  completeLogsForKind,
  enterLogsForKind,
  runningTickLog,
  timeoutWarningLog,
  type RuntimeLogEntry,
} from '../runtime/mockNodeLogs'

export type SimulationPhase = 'idle' | 'running' | 'paused' | 'completed'

export interface TimelineEntry {
  id: string
  at: number
  title: string
  detail?: string
  tone: 'neutral' | 'success' | 'warn' | 'error'
  nodeId?: string
}

export interface NodeRuntimeTiming {
  startedAt?: number
  completedAt?: number
  durationMs?: number
  attempt: number
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
   * Response edges that successfully carried an approval/settlement signal.
   * Stays visible after traversal (green operational path).
   */
  succeededEdgeIds: string[]
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
  /** Per-node operational log stream (mock runtime). */
  nodeLogs: Record<string, RuntimeLogEntry[]>
  /** Per-node timing and retry metadata for the inspector. */
  nodeTiming: Record<string, NodeRuntimeTiming>
  /** Tick counter per running node for rotating in-flight logs. */
  runningLogTicks: Record<string, number>
  /** Currently selected simulation case id */
  activeCaseId: string | null

  appendNodeLogs: (nodeId: string, entries: RuntimeLogEntry[]) => void
  pushRunningLogTicks: () => void
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
let responseEdgeIds: Set<string> = new Set()

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
  | 'phase'
  | 'cursor'
  | 'nodeStates'
  | 'activeEdgeIds'
  | 'failedEdgeIds'
  | 'succeededEdgeIds'
  | 'failureReason'
  | 'nodeFailureMessages'
  | 'activeEdgePayloads'
  | 'timeline'
  | 'nodeLogs'
  | 'nodeTiming'
  | 'runningLogTicks'
> = {
  phase: 'idle',
  cursor: -1,
  nodeStates: {},
  activeEdgeIds: [],
  failedEdgeIds: [],
  succeededEdgeIds: [],
  failureReason: null,
  nodeFailureMessages: {},
  activeEdgePayloads: {},
  timeline: [],
  nodeLogs: {},
  nodeTiming: {},
  runningLogTicks: {},
}

function mergeNodeLogs(
  existing: Record<string, RuntimeLogEntry[]>,
  nodeId: string,
  entries: RuntimeLogEntry[],
): Record<string, RuntimeLogEntry[]> {
  if (!entries.length) return existing
  const prev = existing[nodeId] ?? []
  return { ...existing, [nodeId]: [...prev, ...entries].slice(-48) }
}

export const useRuntimeStore = create<RuntimeStore>((set, get) => ({
  ...INITIAL_RUNTIME,
  activeCaseId: null,

  appendNodeLogs: (nodeId, entries) => {
    if (!entries.length) return
    set((s) => ({
      nodeLogs: mergeNodeLogs(s.nodeLogs, nodeId, entries),
    }))
  },

  pushRunningLogTicks: () => {
    const flow = boundFlow
    if (!flow || get().phase !== 'running') return

    const { nodeStates, runningLogTicks, nodeLogs } = get()
    let nextLogs = nodeLogs
    let nextTicks = { ...runningLogTicks }
    let hasRunning = false

    for (const n of flow.nodes) {
      if (nodeStates[n.id] !== 'running') continue
      hasRunning = true
      const tick = (runningLogTicks[n.id] ?? 0) + 1
      nextTicks[n.id] = tick
      const log = runningTickLog(n.kind, n.id, n.label ?? n.id, tick)
      if (log) nextLogs = mergeNodeLogs(nextLogs, n.id, [log])
      if (tick === 4) {
        nextLogs = mergeNodeLogs(nextLogs, n.id, [timeoutWarningLog(n.id, n.kind)])
      }
    }

    if (hasRunning) {
      set({ nodeLogs: nextLogs, runningLogTicks: nextTicks })
    }
  },

  selectCase: (caseId) => {
    set({ activeCaseId: caseId })
    get().reset()
  },

  bindFlow: (flow) => {
    boundFlow = flow
    responseEdgeIds = detectBackwardEdges(
      flow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    )
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

    let {
      cursor,
      nodeStates,
      timeline,
      failedEdgeIds,
      succeededEdgeIds,
      failureReason,
      nodeFailureMessages,
      nodeLogs,
      nodeTiming,
      runningLogTicks,
    } = state
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

      if (node) {
        const priorTiming = nodeTiming[completedId]
        const startedAt = priorTiming?.startedAt ?? now - 400
        nodeTiming = {
          ...nodeTiming,
          [completedId]: {
            startedAt,
            completedAt: now,
            durationMs: now - startedAt,
            attempt: priorTiming?.attempt ?? 1,
          },
        }
        nodeLogs = mergeNodeLogs(
          nodeLogs,
          completedId,
          completeLogsForKind(
            node.kind,
            completedId,
            node.label ?? completedId,
            finalState,
            isFailed ? nodeMsg : undefined,
          ),
        )
        const { [completedId]: _, ...restTicks } = runningLogTicks
        runningLogTicks = restTicks
      }

      // Sticky decline: mark the inbound edge when a node fails.
      if (isFailed && cursor > 0) {
        const inboundId = edgeBetween(flow, seq[cursor - 1]!, completedId)
        if (inboundId && !failedEdgeIds.includes(inboundId)) {
          failedEdgeIds = [...failedEdgeIds, inboundId]
        }
      }
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
        succeededEdgeIds, // preserve — keep green response path visible
        failureReason,
        nodeFailureMessages,
        nodeLogs,
        nodeTiming,
        runningLogTicks,
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
    let newSucceededEdgeIds = [...succeededEdgeIds]
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
        const anyPriorFailed = seq.slice(0, cursor).some(
          (nid) => nodeStates[nid] === 'failed',
        )
        const inDeclinePath = failureReason !== null || anyPriorFailed
        // Sticky failure propagation: decline path edges stay red after completion.
        if (inDeclinePath && !newFailedEdgeIds.includes(eid)) {
          newFailedEdgeIds = [...newFailedEdgeIds, eid]
        }
        // Successful response edges stay green after traversal.
        if (
          !inDeclinePath &&
          responseEdgeIds.has(eid) &&
          !newSucceededEdgeIds.includes(eid)
        ) {
          newSucceededEdgeIds = [...newSucceededEdgeIds, eid]
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

    if (node) {
      const attempt =
        node.kind === 'retry'
          ? (nodeTiming[nextId]?.attempt ?? 0) + 1
          : nodeTiming[nextId]?.attempt ?? 1
      nodeTiming = {
        ...nodeTiming,
        [nextId]: { startedAt: now, attempt },
      }
      nodeLogs = mergeNodeLogs(
        nodeLogs,
        nextId,
        enterLogsForKind(node.kind, nextId, node.label ?? nextId, {
          declinePath: isInFailurePropagation,
          failureReason,
        }),
      )
      runningLogTicks = { ...runningLogTicks, [nextId]: 0 }
    }

    set({
      cursor,
      nodeStates: nextStates,
      activeEdgeIds,
      activeEdgePayloads,
      failedEdgeIds: newFailedEdgeIds,
      succeededEdgeIds: newSucceededEdgeIds,
      failureReason,
      nodeFailureMessages,
      nodeLogs,
      nodeTiming,
      runningLogTicks,
      timeline: [...timeline, ...appended],
    })
  },
}))
