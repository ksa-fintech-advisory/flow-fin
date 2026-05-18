import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import {
  type ElkEdgeGeometry,
  layoutFlowWithElk,
} from '../layout/applyElkLayout'
import type { FlowDefinition } from '../fdl/types'
import { elkBBoxForKind } from '../layout/elkNodeSizes'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'
import { PlaygroundToolbar } from '../components/PlaygroundToolbar'
import { ExecutionEdge } from './edges/ExecutionEdge'
import { nodeTypes } from './nodeRegistry'

const edgeTypes = { execution: ExecutionEdge } satisfies EdgeTypes
const flowNodeTypes = nodeTypes satisfies NodeTypes

function ElkFitView({ layoutVersion }: { layoutVersion: number }) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!layoutVersion) return
    // Delay slightly so nodes settle before fitting
    const timer = setTimeout(() => {
      fitView({ padding: 0.18, duration: 420, minZoom: 0.15 })
    }, 60)
    return () => clearTimeout(timer)
  }, [layoutVersion, fitView])

  return null
}

function FlowCanvasInner({ flow }: { flow: FlowDefinition }) {
  const selectedNodeId = useUiStore((s) => s.selectedNodeId)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)
  const activeEdgeIds = useRuntimeStore((s) => s.activeEdgeIds)
  const failedEdgeIds = useRuntimeStore((s) => s.failedEdgeIds)
  const succeededEdgeIds = useRuntimeStore((s) => s.succeededEdgeIds)
  const failureReason = useRuntimeStore((s) => s.failureReason)
  const nodeFailureMessages = useRuntimeStore((s) => s.nodeFailureMessages)
  const activeEdgePayloads = useRuntimeStore((s) => s.activeEdgePayloads)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const phase = useRuntimeStore((s) => s.phase)
  const bindFlow = useRuntimeStore((s) => s.bindFlow)

  const caseEdgePayloads = useMemo(() => {
    const cases = flow.simulation?.cases
    if (!cases?.length) return {}
    const simCase =
      (activeCaseId ? cases.find((c) => c.id === activeCaseId) : null) ??
      cases[0]
    return simCase?.edgePayloads ?? {}
  }, [flow, activeCaseId])

  const [elkNodes, setElkNodes] = useState<Node[] | null>(null)
  const [edgeGeometry, setEdgeGeometry] = useState<
    Record<string, ElkEdgeGeometry>
  >({})
  const [backwardIds, setBackwardIds] = useState<Set<string>>(new Set())
  const [layoutVersion, setLayoutVersion] = useState(0)

  useEffect(() => {
    bindFlow(flow)
  }, [flow, bindFlow])

  useEffect(() => {
    let cancelled = false

    // Reset layout synchronously when the scenario changes.
    setElkNodes(null)
    setEdgeGeometry({})
    setBackwardIds(new Set())

    const rawNodes: Node[] = flow.nodes.map((n) => {
      const { width, height } = elkBBoxForKind(n.kind, n.label)
      return {
        id: n.id,
        type: n.kind,
        position: { x: 0, y: 0 },
        width,
        height,
        data: {},
      }
    })

    const rfEdges: Edge[] = flow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'execution',
    }))

    layoutFlowWithElk(rawNodes, rfEdges)
      .then(({ nodes: positioned, edgeGeometry: geom, backwardEdgeIds: bIds }) => {
        if (cancelled) return
        setElkNodes(positioned)
        setEdgeGeometry(geom)
        setBackwardIds(bIds)
        setLayoutVersion((v) => v + 1)
      })
      .catch(() => {
        if (cancelled) return
        // Organic fallback positions: diagonal cascade with variance
        setElkNodes(
          rawNodes.map((n, i) => ({
            ...n,
            position: {
              x: i * 320,
              y: 120 + (i % 2 === 0 ? -1 : 1) * (i * 22),
            },
          })),
        )
        setEdgeGeometry({})
        setBackwardIds(new Set())
        setLayoutVersion((v) => v + 1)
      })

    return () => {
      cancelled = true
    }
  }, [flow])

  const nodes: Node[] = useMemo(() => {
    if (!elkNodes) return []
    const flowNodeIds = new Set(flow.nodes.map((n) => n.id))
    return elkNodes
      .filter((node) => flowNodeIds.has(node.id))
      .map((node) => {
      const fn = flow.nodes.find((n) => n.id === node.id)!
      const { width, height } = elkBBoxForKind(fn.kind, fn.label ?? fn.id)
      const runtimeState = nodeStates[node.id] ?? 'idle'
      // If node has a failure message, pass it for display
      const failureMessage = nodeFailureMessages[node.id] ?? null
      return {
        ...node,
        type: fn.kind,
        width,
        height,
        selected: selectedNodeId === node.id,
        data: {
          kind: fn.kind,
          label: fn.label ?? fn.id,
          runtimeState,
          failureMessage: runtimeState === 'failed' || (failureReason && runtimeState === 'success')
            ? failureMessage
            : null,
        },
      }
    })
  }, [elkNodes, flow.nodes, nodeStates, selectedNodeId, failureReason, nodeFailureMessages, flow.id])

  const edges: Edge[] = useMemo(
    () =>
      flow.edges.map((e) => {
        const touchesSelection =
          selectedNodeId != null &&
          (e.source === selectedNodeId || e.target === selectedNodeId)
        const isFailed = failedEdgeIds.includes(e.id)
        const isSucceeded = succeededEdgeIds.includes(e.id)
        const isActive = activeEdgeIds.includes(e.id)
        // Edge label priority during simulation:
        // 1. Active edge payload (packet data like "AUTH $1,000.00")
        // 2. Failed edge decline reason ("decline: insufficient balance")
        // 3. Static edge label from the flow definition
        let edgeLabel = e.label
        if (isActive && activeEdgePayloads[e.id]) {
          edgeLabel = activeEdgePayloads[e.id]
        } else if (isFailed) {
          edgeLabel =
            caseEdgePayloads[e.id] ??
            (failureReason ? `decline: ${failureReason.toLowerCase()}` : edgeLabel)
        }
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'execution',
          data: {
            label: edgeLabel,
            active: isActive,
            failed: isFailed,
            succeeded: isSucceeded,
            highlighted: touchesSelection,
            elkPoints: edgeGeometry[e.id]?.points,
            direction: backwardIds.has(e.id) ? 'response' as const : 'forward' as const,
          },
        }
      }),
    [flow.edges, activeEdgeIds, activeEdgePayloads, caseEdgePayloads, failedEdgeIds, succeededEdgeIds, failureReason, edgeGeometry, selectedNodeId, backwardIds],
  )

  const onPaneClick = useCallback(() => {
    useUiStore.getState().setSelectedNodeId(null)
  }, [])

  const onNodeClick = useCallback((_: MouseEvent, node: Node) => {
    useUiStore.getState().setSelectedNodeId(node.id)
  }, [])

  return (
    <div className="ff-canvas-wrap">
      {!elkNodes ? (
        <div className="ff-canvas-loading" role="status">
          Computing ELK layout…
        </div>
      ) : (
        <ReactFlow
          key={flow.id}
          className={`ff-flow-editor ${phase === 'running' ? 'ff-flow-editor--live' : ''}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={flowNodeTypes}
          edgeTypes={edgeTypes}
          fitViewOptions={{ padding: 0.28 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          nodesConnectable={false}
          nodesDraggable
          elementsSelectable
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          panOnDrag
          selectionOnDrag={false}
          elevateEdgesOnSelect
          elevateNodesOnSelect
        >
          <ElkFitView layoutVersion={layoutVersion} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1.2}
            color="rgba(51, 65, 85, 0.38)"
          />
          <Controls
            showInteractive={false}
            className="ff-flow-controls"
            position="bottom-left"
          />
          <MiniMap
            className="ff-minimap"
            pannable
            zoomable
            maskColor="rgba(15, 23, 42, 0.88)"
            nodeColor={(n) => {
              const state = nodeStates[n.id]
              if (state === 'running') return '#38bdf8'
              if (state === 'success') return '#34d399'
              if (state === 'failed') return '#f87171'
              return '#475569'
            }}
          />
          <Panel position="top-left" className="ff-canvas-panel">
            <PlaygroundToolbar
              nodeCount={flow.nodes.length}
              edgeCount={flow.edges.length}
              layoutReady={Boolean(elkNodes)}
            />
          </Panel>
          <Panel position="top-right" className="ff-canvas-overlay">
            <div className="ff-runtime-chip">
              <span className={`ff-runtime-chip__dot ff-runtime-chip__dot--${phase}`} />
              <span className="ff-runtime-chip__label">{phase}</span>
            </div>
            {selectedNodeId ? (
              <span className="ff-canvas-overlay__hint">Inspector open · Esc to clear</span>
            ) : (
              <span className="ff-canvas-overlay__hint">Click node to inspect</span>
            )}
          </Panel>
        </ReactFlow>
      )}
    </div>
  )
}

type FlowCanvasProps = {
  flow: FlowDefinition
}

export function FlowCanvas({ flow }: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner flow={flow} />
    </ReactFlowProvider>
  )
}
