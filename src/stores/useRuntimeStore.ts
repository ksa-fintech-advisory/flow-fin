import { create } from 'zustand'
import type {
  FlowDefinition,
  FDLNodeKind,
  RuntimeNodeState,
  SimulationCase,
} from '../fdl/types'
import { detectBackwardEdges } from '../layout/applyElkLayout'
import { deriveNodeMetrics } from '../runtime/metrics'
import { defaultTransitPayload, parseEdgePayloadLabel } from '../runtime/payloads'
import type {
  NodeOperationalMetrics,
  PropagationTrail,
  RuntimeSnapshot,
  TransitPacket,
} from '../runtime/runtimeTypes'
import { shouldEmitRetrySignal } from '../runtime/variability'
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
  failedEdgeIds: string[]
  succeededEdgeIds: string[]
  failureReason: string | null
  nodeFailureMessages: Record<string, string>
  activeEdgePayloads: Record<string, string>
  propagationTrails: PropagationTrail[]
  transitPackets: TransitPacket[]
  nodeMetrics: Record<string, NodeOperationalMetrics>
  stepSnapshots: RuntimeSnapshot[]
  timeline: TimelineEntry[]
  nodeLogs: Record<string, RuntimeLogEntry[]>
  nodeTiming: Record<string, NodeRuntimeTiming>
  runningLogTicks: Record<string, number>
  activeCaseId: string | null

  appendNodeLogs: (nodeId: string, entries: RuntimeLogEntry[]) => void
  pushRunningLogTicks: () => void
  bindFlow: (flow: FlowDefinition) => void
  reset: () => void
  start: () => void
  pause: () => void
  resume: () => void
  replay: () => void
  stepForward: () => void
  advanceStep: () => void
  seekToStep: (stepIndex: number) => void
  selectCase: (caseId: string) => void
  decayTrails: () => void
  tickPackets: () => void
  maybeSpawnConcurrentPacket: () => void
  captureSnapshot: () => void
}

let boundFlow: FlowDefinition | null = null
let responseEdgeIds: Set<string> = new Set()
let packetCounter = 0

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
      case 'fraud_check':
        return { title: 'Check declined', detail: failureMessage ?? `${label} flagged or blocked` }
      case 'payment':
        return { title: 'Payment declined', detail: failureMessage ?? `${label} rejected` }
      case 'end':
        return { title: 'Flow ended — declined', detail: failureMessage ?? label }
      default:
        return { title: 'Step failed', detail: failureMessage ?? label }
    }
  }
  switch (kind) {
    case 'start':
      return { title: 'Runtime entry', detail: `${label} · flow armed` }
    case 'end':
      return { title: 'Runtime exit', detail: `${label} · execution closed` }
    case 'payment':
      return { title: 'Payment authorized', detail: `${label} accepted payload & risk flags` }
    case 'fraud_check':
      return { title: 'Fraud check passed', detail: `${label} cleared velocity & device signals` }
    case 'approval':
      return { title: 'Strong customer approval', detail: `${label} completed SCA challenge` }
    case 'settlement':
      return { title: 'Settlement posted', detail: `${label} handed off to clearing` }
    case 'retry':
      return { title: 'Retry scheduled', detail: `${label} queued with backoff` }
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

const INITIAL_RUNTIME = {
  phase: 'idle' as SimulationPhase,
  cursor: -1,
  nodeStates: {} as Record<string, RuntimeNodeState>,
  activeEdgeIds: [] as string[],
  failedEdgeIds: [] as string[],
  succeededEdgeIds: [] as string[],
  failureReason: null as string | null,
  nodeFailureMessages: {} as Record<string, string>,
  activeEdgePayloads: {} as Record<string, string>,
  propagationTrails: [] as PropagationTrail[],
  transitPackets: [] as TransitPacket[],
  nodeMetrics: {} as Record<string, NodeOperationalMetrics>,
  stepSnapshots: [] as RuntimeSnapshot[],
  timeline: [] as TimelineEntry[],
  nodeLogs: {} as Record<string, RuntimeLogEntry[]>,
  nodeTiming: {} as Record<string, NodeRuntimeTiming>,
  runningLogTicks: {} as Record<string, number>,
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

function snapshotFromState(state: RuntimeStore): RuntimeSnapshot {
  return {
    cursor: state.cursor,
    phase: state.phase,
    nodeStates: { ...state.nodeStates },
    activeEdgeIds: [...state.activeEdgeIds],
    failedEdgeIds: [...state.failedEdgeIds],
    succeededEdgeIds: [...state.succeededEdgeIds],
    failureReason: state.failureReason,
    nodeFailureMessages: { ...state.nodeFailureMessages },
    activeEdgePayloads: { ...state.activeEdgePayloads },
    propagationTrails: state.propagationTrails.map((t) => ({ ...t })),
    nodeMetrics: { ...state.nodeMetrics },
  }
}

function pushTrail(
  trails: PropagationTrail[],
  edgeId: string,
  tone: PropagationTrail['tone'],
): PropagationTrail[] {
  const now = Date.now()
  const next = [
    ...trails.filter((t) => t.edgeId !== edgeId || t.opacity > 0.15),
    { id: `${now}-${edgeId}`, edgeId, opacity: 1, tone, createdAt: now },
  ]
  return next.slice(-24)
}

function refreshMetricsForNode(
  metrics: Record<string, NodeOperationalMetrics>,
  flow: FlowDefinition,
  nodeId: string,
  state: RuntimeNodeState,
  attempt: number,
): Record<string, NodeOperationalMetrics> {
  const node = flow.nodes.find((n) => n.id === nodeId)
  if (!node) return metrics
  return {
    ...metrics,
    [nodeId]: deriveNodeMetrics(nodeId, node.kind, state, attempt),
  }
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

  captureSnapshot: () => {
    set((s) => ({
      stepSnapshots: [...s.stepSnapshots, snapshotFromState(s)],
    }))
  },

  decayTrails: () => {
    set((s) => {
      if (!s.propagationTrails.length) return s
      const next = s.propagationTrails
        .map((t) => ({ ...t, opacity: t.opacity * 0.92 }))
        .filter((t) => t.opacity > 0.06)
      return next.length === s.propagationTrails.length &&
        next.every((t, i) => t.opacity === s.propagationTrails[i]!.opacity)
        ? s
        : { propagationTrails: next }
    })
  },

  tickPackets: () => {
    set((s) => {
      if (!s.transitPackets.length) return s
      const speed = 0.045
      const next = s.transitPackets
        .map((p) => ({ ...p, progress: p.progress + speed }))
        .filter((p) => p.progress < 1.05)
      return { transitPackets: next }
    })
  },

  maybeSpawnConcurrentPacket: () => {
    const flow = boundFlow
    if (!flow || get().phase !== 'running') return
    const { cursor, activeCaseId, transitPackets, failureReason } = get()
    if (transitPackets.length >= 5) return

    const seq = getSequence(flow, activeCaseId)
    if (cursor < 1 || cursor >= seq.length) return

    const sources = seq.slice(Math.max(0, cursor - 2), cursor + 1)
    for (let i = 0; i < sources.length - 1; i++) {
      const eid = edgeBetween(flow, sources[i]!, sources[i + 1]!)
      if (!eid) continue
      packetCounter += 1
      const payload = defaultTransitPayload(cursor + packetCounter)
      const tone = failureReason ? 'warn' : 'neutral'
      set((s) => ({
        transitPackets: [
          ...s.transitPackets,
          {
            id: `tx-${packetCounter}`,
            edgeId: eid,
            progress: 0,
            payload,
            tone,
            label: `${payload.currency} ${payload.amount}`,
          },
        ],
      }))
      return
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
    const cases = flow.simulation?.cases
    set({ activeCaseId: cases?.[0]?.id ?? null })
    get().reset()
  },

  reset: () => {
    const flow = boundFlow
    const nodeStates: Record<string, RuntimeNodeState> = {}
    const nodeMetrics: Record<string, NodeOperationalMetrics> = {}
    if (flow) {
      for (const n of flow.nodes) {
        nodeStates[n.id] = 'idle'
        nodeMetrics[n.id] = deriveNodeMetrics(n.id, n.kind, 'idle', 1)
      }
    }
    set({
      ...INITIAL_RUNTIME,
      nodeStates,
      nodeMetrics,
      activeCaseId: get().activeCaseId,
    })
  },

  start: () => {
    const flow = boundFlow
    if (!flow) return
    const seq = getSequence(flow, get().activeCaseId)
    if (!seq.length) return
    get().reset()
    set({ phase: 'running', cursor: -1, stepSnapshots: [] })
    get().advanceStep()
  },

  replay: () => {
    const flow = boundFlow
    if (!flow) return
    const seq = getSequence(flow, get().activeCaseId)
    if (!seq.length) return
    get().reset()
    set({ phase: 'running', cursor: -1, stepSnapshots: [] })
    get().advanceStep()
  },

  pause: () => {
    if (get().phase === 'running') set({ phase: 'paused' })
  },

  resume: () => {
    if (get().phase === 'paused') set({ phase: 'running' })
  },

  seekToStep: (stepIndex) => {
    const snapshots = get().stepSnapshots
    if (stepIndex < 0) {
      get().reset()
      return
    }
    const snap = snapshots[stepIndex]
    if (!snap) return
    set({
      ...snap,
      phase: 'paused',
      transitPackets: [],
    })
  },

  stepForward: () => {
    const flow = boundFlow
    if (!flow) return
    const seq = getSequence(flow, get().activeCaseId)
    if (!seq.length) return
    const { phase } = get()
    if (phase === 'idle' || phase === 'completed') {
      get().reset()
      set({ phase: 'running', cursor: -1, stepSnapshots: [] })
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
      propagationTrails,
      nodeMetrics,
      transitPackets,
    } = state
    const now = Date.now()
    let nextTransitPackets = transitPackets

    if (cursor >= 0 && cursor < seq.length) {
      const completedId = seq[cursor]
      const finalState = terminalStates[completedId] ?? 'success'
      nodeStates = { ...nodeStates, [completedId]: finalState }
      nodeMetrics = refreshMetricsForNode(
        nodeMetrics,
        flow,
        completedId,
        finalState,
        nodeTiming[completedId]?.attempt ?? 1,
      )

      const isFailed = finalState === 'failed'
      const node = flow.nodes.find((n) => n.id === completedId)

      if (isFailed && caseFailureReason) {
        failureReason = caseFailureReason
        nodeFailureMessages = { ...nodeFailureMessages, ...caseFailureMessages }
      }

      const nodeMsg = failureReason ? caseFailureMessages[completedId] : undefined

      const msg = node
        ? timelineCopyForKind(
            node.kind,
            node.label ?? node.id,
            isFailed,
            isFailed ? nodeMsg : undefined,
          )
        : { title: 'Step complete' }

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

        if (shouldEmitRetrySignal(cursor, completedId) && !isFailed) {
          timeline = [
            ...timeline,
            {
              id: `${now}-retry-signal-${completedId}`,
              at: now + 1,
              title: 'Transient retry recovered',
              detail: `${node.label ?? completedId} · backoff cleared`,
              tone: 'warn',
              nodeId: completedId,
            },
          ]
        }
      }

      if (isFailed && cursor > 0) {
        const inboundId = edgeBetween(flow, seq[cursor - 1]!, completedId)
        if (inboundId) {
          propagationTrails = pushTrail(propagationTrails, inboundId, 'failed')
          if (!failedEdgeIds.includes(inboundId)) {
            failedEdgeIds = [...failedEdgeIds, inboundId]
          }
        }
      }
    }

    cursor += 1

    if (cursor >= seq.length) {
      get().captureSnapshot()
      set({
        cursor,
        nodeStates,
        activeEdgeIds: [],
        activeEdgePayloads: {},
        failedEdgeIds,
        succeededEdgeIds,
        failureReason,
        nodeFailureMessages,
        nodeLogs,
        nodeTiming,
        runningLogTicks,
        propagationTrails,
        nodeMetrics,
        timeline: [
          ...timeline,
          {
            id: `${now}-done-flow`,
            at: Date.now(),
            title: Object.keys(terminalStates).length
              ? 'Simulation completed — declined'
              : 'Settlement completed',
            detail: Object.keys(terminalStates).length
              ? `End-to-end simulation finished — ${failureReason ?? 'decline path'}`
              : 'End-to-end simulation finished',
            tone: Object.keys(terminalStates).length ? 'error' : 'success',
          },
        ],
        phase: 'completed',
        transitPackets: [],
      })
      return
    }

    const nextId = seq[cursor]
    const nextStates: Record<string, RuntimeNodeState> = {
      ...nodeStates,
      [nextId]: 'running',
    }
    let activeEdgeIds: string[] = []
    let newFailedEdgeIds = [...failedEdgeIds]
    let newSucceededEdgeIds = [...succeededEdgeIds]
    let newActivePayloads: Record<string, string> = {}
    const caseEdgePayloads = simCase?.edgePayloads ?? {}
    let trailTone: PropagationTrail['tone'] = failureReason ? 'failed' : 'active'

    if (cursor > 0) {
      const prevId = seq[cursor - 1]
      const eid = edgeBetween(flow, prevId, nextId)
      if (eid) {
        activeEdgeIds = [eid]
        if (caseEdgePayloads[eid]) {
          newActivePayloads[eid] = caseEdgePayloads[eid]
        }
        const anyPriorFailed = seq.slice(0, cursor).some((nid) => nodeStates[nid] === 'failed')
        const inDeclinePath = failureReason !== null || anyPriorFailed
        trailTone = inDeclinePath ? 'failed' : 'active'
        propagationTrails = pushTrail(propagationTrails, eid, trailTone)

        const parsed = parseEdgePayloadLabel(newActivePayloads[eid])
        if (parsed) {
          packetCounter += 1
          const pkt: TransitPacket = {
            id: `primary-${packetCounter}`,
            edgeId: eid,
            progress: 0,
            payload: parsed,
            tone: inDeclinePath ? 'warn' : 'success',
            label: `${parsed.currency} ${parsed.amount}`,
          }
          nextTransitPackets = [pkt, ...nextTransitPackets].slice(0, 6)
        }

        if (inDeclinePath && !newFailedEdgeIds.includes(eid)) {
          newFailedEdgeIds = [...newFailedEdgeIds, eid]
        }
        if (
          !inDeclinePath &&
          responseEdgeIds.has(eid) &&
          !newSucceededEdgeIds.includes(eid)
        ) {
          newSucceededEdgeIds = [...newSucceededEdgeIds, eid]
          propagationTrails = pushTrail(propagationTrails, eid, 'success')
        }
      }
    }

    const node = flow.nodes.find((n) => n.id === nextId)
    const isInFailurePropagation = failureReason !== null
    const enterMsg =
      isInFailurePropagation && caseFailureMessages[nextId]
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
      nodeMetrics = refreshMetricsForNode(nodeMetrics, flow, nextId, 'running', attempt)
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
      activeEdgePayloads: newActivePayloads,
      failedEdgeIds: newFailedEdgeIds,
      succeededEdgeIds: newSucceededEdgeIds,
      failureReason,
      nodeFailureMessages,
      nodeLogs,
      nodeTiming,
      runningLogTicks,
      propagationTrails,
      nodeMetrics,
      transitPackets: nextTransitPackets,
      timeline: [...timeline, ...appended],
    })
    get().captureSnapshot()
  },
}))
