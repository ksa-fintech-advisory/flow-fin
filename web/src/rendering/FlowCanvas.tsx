import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
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
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.22, duration: 280 })
    })
    return () => cancelAnimationFrame(frame)
  }, [layoutVersion, fitView])

  return null
}

function FlowCanvasInner() {
  const flow = useGraphStore((s) => s.flow)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)
  const activeEdgeIds = useRuntimeStore((s) => s.activeEdgeIds)
  const bindFlow = useRuntimeStore((s) => s.bindFlow)

  const [elkNodes, setElkNodes] = useState<Node[] | null>(null)
  const [edgeGeometry, setEdgeGeometry] = useState<
    Record<string, ElkEdgeGeometry>
  >({})
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
      const { width, height } = elkBBoxForKind(n.kind)
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
      .then(({ nodes: positioned, edgeGeometry: geom }) => {
        if (cancelled) return
        setElkNodes(positioned)
        setEdgeGeometry(geom)
        setLayoutVersion((v) => v + 1)
      })
      .catch(() => {
        if (cancelled) return
        setElkNodes(
          rawNodes.map((n, i) => ({
            ...n,
            position: { x: i * 280, y: 48 + (i % 3) * 40 },
          })),
        )
        setEdgeGeometry({})
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
      const { width, height } = elkBBoxForKind(fn.kind)
      return {
        ...node,
        type: fn.kind,
        width,
        height,
        data: {
          kind: fn.kind,
          label: fn.label ?? fn.id,
          runtimeState: nodeStates[node.id] ?? 'idle',
        },
      }
    })
  }, [elkNodes, flow.nodes, nodeStates])

  const edges: Edge[] = useMemo(
    () =>
      flow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'execution',
        data: {
          label: e.label,
          active: activeEdgeIds.includes(e.id),
          elkPoints: edgeGeometry[e.id]?.points,
        },
      })),
    [flow.edges, activeEdgeIds, edgeGeometry],
  )

  const onPaneClick = useCallback(() => {
    useUiStore.getState().setSelectedNodeId(null)
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
          nodes={nodes}
          edges={edges}
          nodeTypes={flowNodeTypes}
          edgeTypes={edgeTypes}
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.25}
          maxZoom={1.85}
          proOptions={{ hideAttribution: true }}
          onPaneClick={onPaneClick}
          nodesConnectable={false}
          elevateEdgesOnSelect
        >
          <ElkFitView layoutVersion={layoutVersion} />
          <Background gap={24} size={1} color="#1e293b" />
          <Controls showInteractive={false} />
          <MiniMap
            className="ff-minimap"
            pannable
            zoomable
            maskColor="rgba(15, 23, 42, 0.82)"
          />
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
