import type { ElkExtendedEdge, ElkNode, ElkPoint } from 'elkjs'
import type { Edge, Node } from '@xyflow/react'

export type ElkEdgeGeometry = {
  /** Polyline in flow space (endpoints aligned by ExecutionEdge to handles). */
  points: ElkPoint[]
}

const ELK_FALLBACK_W = 216
const ELK_FALLBACK_H = 88

type ElkConstructor = typeof import('elkjs/lib/elk.bundled.js').default

let elkSingletonPromise: Promise<InstanceType<ElkConstructor>> | null = null

async function getElk(): Promise<InstanceType<ElkConstructor>> {
  if (!elkSingletonPromise) {
    elkSingletonPromise = import('elkjs/lib/elk.bundled.js').then((mod) => {
      const Elk = mod.default
      return new Elk()
    })
  }
  return elkSingletonPromise
}

function collectSectionPoints(edge: ElkExtendedEdge): ElkPoint[] {
  const pts: ElkPoint[] = []
  for (const sec of edge.sections ?? []) {
    pts.push(sec.startPoint)
    if (sec.bendPoints?.length) pts.push(...sec.bendPoints)
    pts.push(sec.endPoint)
  }
  return pts
}

function dedupeConsecutive(pts: ElkPoint[]): ElkPoint[] {
  const out: ElkPoint[] = []
  for (const p of pts) {
    const prev = out[out.length - 1]
    if (!prev || prev.x !== p.x || prev.y !== p.y) out.push(p)
  }
  return out
}

/** Remove redundant vertices on the same horizontal / vertical segment */
function simplifyOrthogonal(pts: ElkPoint[]): ElkPoint[] {
  if (pts.length < 3) return pts
  const out: ElkPoint[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1]
    const b = pts[i]
    const c = pts[i + 1]
    const collinearH = a.y === b.y && b.y === c.y
    const collinearV = a.x === b.x && b.x === c.x
    if (!collinearH && !collinearV) out.push(b)
  }
  out.push(pts[pts.length - 1])
  return out
}

function nodeMidX(node: ElkNode | undefined): number {
  if (!node) return 0
  return (node.x ?? 0) + (node.width ?? ELK_FALLBACK_W) / 2
}

function countNodesBetweenX(
  nodes: ElkNode[],
  source: ElkNode | undefined,
  target: ElkNode | undefined,
): number {
  if (!source || !target) return 0
  const sourceX = nodeMidX(source)
  const targetX = nodeMidX(target)
  const minX = Math.min(sourceX, targetX)
  const maxX = Math.max(sourceX, targetX)
  return nodes.filter((node) => {
    if (node.id === source.id || node.id === target.id) return false
    const midX = nodeMidX(node)
    return midX > minX && midX < maxX
  }).length
}

/**
 * Layered + orthogonal: clean topology-system layout.
 *
 * Design decisions:
 *   - ORTHOGONAL routing: predictable right-angle paths that get softened
 *     into curves at render time (roundedOrthoPath / organicSplinePath)
 *   - NETWORK_SIMPLEX placement: balanced vertical distribution
 *   - Generous spacing: topology breathing room without excess
 *   - feedbackEdges: loops route cleanly below the graph
 */
const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  /* Balanced breathing room — topology, not workflow editor */
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '180',
  'elk.layered.spacing.edgeNodeBetweenLayers': '60',
  /* ORTHOGONAL: clean structured routes, softened in rendering */
  'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
  'org.eclipse.elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  /* NETWORK_SIMPLEX: balanced vertical placement */
  'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'org.eclipse.elk.layered.nodePlacement.favorStraightEdges': 'true',
  /* Edge separation */
  'org.eclipse.elk.spacing.edgeEdge': '40',
  'org.eclipse.elk.spacing.edgeNode': '36',
  'org.eclipse.elk.padding': '48',
  'org.eclipse.elk.layered.feedbackEdges': 'true',
  'org.eclipse.elk.layered.mergeEdges': 'false',
  'org.eclipse.elk.layered.wrapping.strategy': 'OFF',
  'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
} satisfies Record<string, string>

export async function layoutFlowWithElk(
  nodes: Node[],
  edges: Edge[],
): Promise<{ nodes: Node[]; edgeGeometry: Record<string, ElkEdgeGeometry> }> {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: nodes.map((n) => ({
      id: n.id,
      width: Number(n.width ?? ELK_FALLBACK_W),
      height: Number(n.height ?? ELK_FALLBACK_H),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  }

  const layouted = await (await getElk()).layout(elkGraph)
  const children: ElkNode[] = layouted.children ?? []
  const childById = new Map(children.map((c) => [c.id, c]))
  const edgeById = new Map(edges.map((e) => [e.id, e]))

  const detourEdgeIds = new Set<string>()
  for (const edge of edges) {
    const source = childById.get(edge.source)
    const target = childById.get(edge.target)
    const sourceMidX = nodeMidX(source)
    const targetMidX = nodeMidX(target)
    const isFeedback = sourceMidX > targetMidX
    const crossesIntermediateNodes =
      countNodesBetweenX(children, source, target) > 0
    if (isFeedback || crossesIntermediateNodes) detourEdgeIds.add(edge.id)
  }

  const maxBottom = children.reduce(
    (acc, node) => Math.max(acc, (node.y ?? 0) + (node.height ?? ELK_FALLBACK_H)),
    0,
  )
  const detourLaneBaseY = maxBottom + 64
  const detourLaneGap = 44
  const detourLaneByEdgeId = new Map<string, number>()
  let detourLaneCursor = 0
  for (const edge of edges) {
    if (!detourEdgeIds.has(edge.id)) continue
    detourLaneByEdgeId.set(edge.id, detourLaneCursor)
    detourLaneCursor += 1
  }

  const positioned = nodes.map((node) => {
    const box = children.find((c) => c.id === node.id)
    return {
      ...node,
      position: {
        x: box?.x ?? 0,
        y: box?.y ?? 0,
      },
    }
  })

  const edgeGeometry: Record<string, ElkEdgeGeometry> = {}
  for (const edge of layouted.edges ?? []) {
    const ext = edge as ElkExtendedEdge
    if (!ext.id) continue
    let pts = dedupeConsecutive(collectSectionPoints(ext))

    if (detourEdgeIds.has(ext.id) && pts.length >= 2) {
      const spec = edgeById.get(ext.id)
      const sourceNode = spec ? childById.get(spec.source) : undefined
      const targetNode = spec ? childById.get(spec.target) : undefined
      const lane = detourLaneByEdgeId.get(ext.id) ?? 0
      const laneY = detourLaneBaseY + lane * detourLaneGap

      const start = pts[0]
      const end = pts[pts.length - 1]
      const defaultOut = 42
      const startOutX = Math.max(
        start.x + defaultOut,
        (sourceNode?.x ?? start.x) + (sourceNode?.width ?? 0) + 20,
      )
      const endInX = Math.min(
        end.x - defaultOut,
        (targetNode?.x ?? end.x) - 20,
      )

      pts = [
        start,
        { x: startOutX, y: start.y },
        { x: startOutX, y: laneY },
        { x: endInX, y: laneY },
        { x: endInX, y: end.y },
        end,
      ]
    }

    pts = simplifyOrthogonal(pts)
    if (pts.length < 2) continue
    edgeGeometry[ext.id] = { points: pts }
  }

  return { nodes: positioned, edgeGeometry }
}
