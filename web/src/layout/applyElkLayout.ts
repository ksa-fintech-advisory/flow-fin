import type { ElkExtendedEdge, ElkNode, ElkPoint } from 'elkjs'
import type { Edge, Node } from '@xyflow/react'

export type ElkEdgeGeometry = {
  /** Orthogonal polyline in flow space (endpoints aligned by ExecutionEdge to handles). */
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

/**
 * Layered + orthogonal: feedback routes for loops, multi-row wrapping so graphs
 * do not collapse into one rigid horizontal spine when width grows.
 */
const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  /* Generous node gaps — Figma/Miro-style breathing room */
  'elk.spacing.nodeNode': '112',
  'elk.layered.spacing.nodeNodeBetweenLayers': '208',
  'elk.layered.spacing.edgeNodeBetweenLayers': '72',
  'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
  'org.eclipse.elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'org.eclipse.elk.layered.nodePlacement.favorStraightEdges': 'false',
  /* Critical: parallel connector separation */
  'org.eclipse.elk.spacing.edgeEdge': '80',
  'org.eclipse.elk.spacing.edgeNode': '44',
  'org.eclipse.elk.padding': '56',
  'org.eclipse.elk.layered.feedbackEdges': 'true',
  'org.eclipse.elk.layered.mergeEdges': 'false',
  /* Single-row primary axis reads cleaner than aggressive wrap for boards */
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
    pts = simplifyOrthogonal(pts)
    if (pts.length < 2) continue
    edgeGeometry[ext.id] = { points: pts }
  }

  return { nodes: positioned, edgeGeometry }
}
