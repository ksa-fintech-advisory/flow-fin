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
import { elkBBoxForKind } from '../layout/elkNodeSizes'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'
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

function FlowCanvasInner() {
  const flow = useGraphStore((s) => s.flow)
  const selectedNodeId = useUiStore((s) => s.selectedNodeId)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)
  const activeEdgeIds = useRuntimeStore((s) => s.activeEdgeIds)
  const failedEdgeIds = useRuntimeStore((s) => s.failedEdgeIds)
  const bindFlow = useRuntimeStore((s) => s.bindFlow)

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
    useUiStore.getState().setSelectedNodeId(null)
  }, [flow.id])

  useEffect(() => {
    let cancelled = false

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
    return elkNodes.map((node) => {
      const fn = flow.nodes.find((n) => n.id === node.id)!
      const { width, height } = elkBBoxForKind(fn.kind, fn.label ?? fn.id)
      return {
        ...node,
        type: fn.kind,
        width,
        height,
        selected: selectedNodeId === node.id,
        data: {
          kind: fn.kind,
          label: fn.label ?? fn.id,
          runtimeState: nodeStates[node.id] ?? 'idle',
        },
      }
    })
  }, [elkNodes, flow.nodes, nodeStates, selectedNodeId])

  const edges: Edge[] = useMemo(
    () =>
      flow.edges.map((e) => {
        const touchesSelection =
          selectedNodeId != null &&
          (e.source === selectedNodeId || e.target === selectedNodeId)
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'execution',
          data: {
            label: e.label,
            active: activeEdgeIds.includes(e.id),
            failed: failedEdgeIds.includes(e.id),
            highlighted: touchesSelection,
            elkPoints: edgeGeometry[e.id]?.points,
            direction: backwardIds.has(e.id) ? 'response' as const : 'forward' as const,
          },
        }
      }),
    [flow.edges, activeEdgeIds, failedEdgeIds, edgeGeometry, selectedNodeId, backwardIds],
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
          className="ff-flow-editor"
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
            gap={24}
            size={1}
            color="rgba(51, 65, 85, 0.45)"
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
            maskColor="rgba(15, 23, 42, 0.82)"
            nodeColor={() => '#475569'}
          />
          <Panel position="top-right" className="ff-canvas-hint">
            Scroll to zoom · drag canvas to pan
          </Panel>
        </ReactFlow>
      )}
    </div>
  )
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
