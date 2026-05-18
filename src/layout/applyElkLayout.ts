import type { ElkExtendedEdge, ElkNode, ElkPort, ElkPoint } from 'elkjs'
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

function nodeMidY(node: ElkNode | undefined): number {
  if (!node) return 0
  return (node.y ?? 0) + (node.height ?? ELK_FALLBACK_H) / 2
}

function nodeBottom(node: ElkNode | undefined): number {
  if (!node) return 0
  return (node.y ?? 0) + (node.height ?? ELK_FALLBACK_H)
}

function nodeRight(node: ElkNode | undefined): number {
  if (!node) return 0
  return (node.x ?? 0) + (node.width ?? ELK_FALLBACK_W)
}

function nodeLeft(node: ElkNode | undefined): number {
  if (!node) return 0
  return node.x ?? 0
}

// ─── Port assignment for parallel-edge separation ────────────────────────────

/**
 * Build port definitions for edges between the same node pair
 * that are NOT feedback/backward edges.
 * Backward edges get custom detour routing, so ports are skipped for them.
 */
function buildPortAssignments(
  nodes: Node[],
  edges: Edge[],
  skipEdgeIds: Set<string>,
): {
  ports: Map<string, ElkPort[]>
  edgeSourcePort: Map<string, string>
  edgeTargetPort: Map<string, string>
} {
  const ports = new Map<string, ElkPort[]>()
  const edgeSourcePort = new Map<string, string>()
  const edgeTargetPort = new Map<string, string>()

  // Canonical key for a pair of nodes (direction-agnostic)
  const pairKey = (a: string, b: string) =>
    a < b ? `${a}::${b}` : `${b}::${a}`

  // Find parallel edge groups (edges between the same pair of nodes)
  // Exclude edges that will be detour-routed
  const parallelGroups = new Map<string, Edge[]>()
  for (const edge of edges) {
    if (skipEdgeIds.has(edge.id)) continue
    const key = pairKey(edge.source, edge.target)
    if (!parallelGroups.has(key)) parallelGroups.set(key, [])
    parallelGroups.get(key)!.push(edge)
  }

  const nodeWidthMap = new Map<string, number>()
  const nodeHeightMap = new Map<string, number>()
  for (const node of nodes) {
    nodeWidthMap.set(node.id, Number(node.width ?? ELK_FALLBACK_W))
    nodeHeightMap.set(node.id, Number(node.height ?? ELK_FALLBACK_H))
  }

  const PORT_SPACING = 18

  for (const [, group] of parallelGroups) {
    if (group.length < 2) continue

    const count = group.length
    const totalSpan = (count - 1) * PORT_SPACING

    group.forEach((edge, idx) => {
      const offsetY = -totalSpan / 2 + idx * PORT_SPACING

      const sourceW = nodeWidthMap.get(edge.source) ?? ELK_FALLBACK_W
      const sourceH = nodeHeightMap.get(edge.source) ?? ELK_FALLBACK_H
      const sourcePortId = `p_src_${edge.id}`
      const sourcePort: ElkPort = {
        id: sourcePortId,
        x: sourceW,
        y: sourceH / 2 + offsetY,
        width: 1,
        height: 1,
        layoutOptions: {
          'org.eclipse.elk.port.side': 'EAST',
        },
      }

      const targetH = nodeHeightMap.get(edge.target) ?? ELK_FALLBACK_H
      const targetPortId = `p_tgt_${edge.id}`
      const targetPort: ElkPort = {
        id: targetPortId,
        x: 0,
        y: targetH / 2 + offsetY,
        width: 1,
        height: 1,
        layoutOptions: {
          'org.eclipse.elk.port.side': 'WEST',
        },
      }

      if (!ports.has(edge.source)) ports.set(edge.source, [])
      ports.get(edge.source)!.push(sourcePort)
      if (!ports.has(edge.target)) ports.set(edge.target, [])
      ports.get(edge.target)!.push(targetPort)

      edgeSourcePort.set(edge.id, sourcePortId)
      edgeTargetPort.set(edge.id, targetPortId)
    })
  }

  return { ports, edgeSourcePort, edgeTargetPort }
}

// ─── Detect backward / feedback edges pre-layout ─────────────────────────────

/**
 * Pre-scan edges to identify backward/response edges.
 * A backward edge is one whose target also sends an edge back to its source
 * (bidirectional pair) OR whose source appears later in topological order.
 */
export function detectBackwardEdges(edges: Edge[]): Set<string> {
  const backward = new Set<string>()

  // Build adjacency: which (source,target) pairs exist
  const forwardPairs = new Set<string>()
  for (const edge of edges) {
    forwardPairs.add(`${edge.source}->${edge.target}`)
  }

  // An edge is backward if the reverse direction also exists
  // AND this edge was defined later in the array (response path)
  const seenPair = new Set<string>()
  for (const edge of edges) {
    const canonical =
      edge.source < edge.target
        ? `${edge.source}::${edge.target}`
        : `${edge.target}::${edge.source}`

    const reverseExists = forwardPairs.has(`${edge.target}->${edge.source}`)
    if (reverseExists && seenPair.has(canonical)) {
      backward.add(edge.id)
    }
    seenPair.add(canonical)
  }

  return backward
}

/**
 * Layered + orthogonal: clean infrastructure topology layout.
 *
 * Design decisions:
 *   - ORTHOGONAL routing with softened curves at render time
 *   - NETWORK_SIMPLEX for balanced vertical placement
 *   - Very generous spacing to prevent visual congestion
 *   - Backward/response edges get custom nested rainbow routing
 *   - Port-based separation for remaining parallel forward edges
 */
const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  /* Very generous breathing room — infrastructure topology */
  'elk.spacing.nodeNode': '148',
  'elk.layered.spacing.nodeNodeBetweenLayers': '300',
  'elk.layered.spacing.edgeNodeBetweenLayers': '90',
  /* ORTHOGONAL routing softened at render time */
  'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
  'org.eclipse.elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  /* Thoroughness: higher value = more crossing-min iterations */
  'org.eclipse.elk.layered.thoroughness': '12',
  /* NETWORK_SIMPLEX: balanced vertical placement */
  'org.eclipse.elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'org.eclipse.elk.layered.nodePlacement.favorStraightEdges': 'true',
  /* Aggressive edge separation */
  'org.eclipse.elk.spacing.edgeEdge': '60',
  'org.eclipse.elk.spacing.edgeNode': '55',
  'org.eclipse.elk.padding': '64',
  'org.eclipse.elk.layered.feedbackEdges': 'true',
  'org.eclipse.elk.layered.mergeEdges': 'false',
  'org.eclipse.elk.layered.wrapping.strategy': 'OFF',
  'org.eclipse.elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'org.eclipse.elk.portConstraints': 'FREE',
  'org.eclipse.elk.layered.spacing.edgeEdgeBetweenLayers': '45',
} satisfies Record<string, string>

export async function layoutFlowWithElk(
  nodes: Node[],
  edges: Edge[],
): Promise<{
  nodes: Node[]
  edgeGeometry: Record<string, ElkEdgeGeometry>
  /** IDs of edges classified as backward/response (routed below the graph) */
  backwardEdgeIds: Set<string>
}> {
  // ── 1. Identify backward/response edges ──────────────────────────────
  const backwardEdgeIds = detectBackwardEdges(edges)

  // ── 2. Build ports only for non-backward parallel edges ──────────────
  const { ports, edgeSourcePort, edgeTargetPort } = buildPortAssignments(
    nodes,
    edges,
    backwardEdgeIds,
  )

  // ── 3. Build ELK graph — exclude backward edges from layout ──────────
  // Let ELK lay out only the forward edges for a clean spine.
  // Backward edges get fully custom routing after layout.
  const forwardEdges = edges.filter((e) => !backwardEdgeIds.has(e.id))

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: LAYOUT_OPTIONS,
    children: nodes.map((n) => {
      const nodePorts = ports.get(n.id)
      const child: ElkNode = {
        id: n.id,
        width: Number(n.width ?? ELK_FALLBACK_W),
        height: Number(n.height ?? ELK_FALLBACK_H),
      }
      if (nodePorts?.length) {
        child.ports = nodePorts
        child.layoutOptions = {
          'org.eclipse.elk.portConstraints': 'FIXED_POS',
        }
      }
      return child
    }),
    edges: forwardEdges.map((e) => {
      const elkEdge: ElkExtendedEdge = {
        id: e.id,
        sources: [edgeSourcePort.get(e.id) ?? e.source],
        targets: [edgeTargetPort.get(e.id) ?? e.target],
      }
      return elkEdge
    }),
  }

  const layouted = await (await getElk()).layout(elkGraph)
  const children: ElkNode[] = layouted.children ?? []
  const childById = new Map(children.map((c) => [c.id, c]))

  // ── 4. Position nodes ────────────────────────────────────────────────
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

  // ── 5. Build edge geometry ───────────────────────────────────────────
  const edgeGeometry: Record<string, ElkEdgeGeometry> = {}

  // 5a. Forward edges: use ELK-computed routing
  for (const edge of layouted.edges ?? []) {
    const ext = edge as ElkExtendedEdge
    if (!ext.id) continue
    let pts = dedupeConsecutive(collectSectionPoints(ext))
    pts = simplifyOrthogonal(pts)
    if (pts.length < 2) continue
    edgeGeometry[ext.id] = { points: pts }
  }

  // 5b. Backward/response edges: nested rainbow routing below the graph
  routeBackwardEdges(
    edges.filter((e) => backwardEdgeIds.has(e.id)),
    childById,
    children,
    edgeGeometry,
  )

  // ── 6. Post-process: nudge any remaining overlapping segments ────────
  separateOverlappingSegments(edgeGeometry)

  return { nodes: positioned, edgeGeometry, backwardEdgeIds }
}

// ─── Backward edge routing (nested rainbow) ──────────────────────────────────

/**
 * Route backward/response edges in a nested rainbow pattern below the
 * main node row. Edges with the longest horizontal span get the outermost
 * (lowest) lane, creating a clean nested arch pattern that avoids crossings.
 *
 * Each edge gets:
 *   - Its own exit X column (staggered right of source node)
 *   - Its own horizontal return lane Y
 *   - Its own entry X column (staggered left of target node)
 *
 * The staggering ensures vertical segments never overlap.
 */
function routeBackwardEdges(
  backwardEdges: Edge[],
  childById: Map<string, ElkNode>,
  allChildren: ElkNode[],
  edgeGeometry: Record<string, ElkEdgeGeometry>,
): void {
  if (backwardEdges.length === 0) return

  // Sort by horizontal span: longest span → outermost lane
  const edgesWithSpan = backwardEdges.map((edge) => {
    const sourceNode = childById.get(edge.source)
    const targetNode = childById.get(edge.target)
    const sourceX = nodeMidX(sourceNode)
    const targetX = nodeMidX(targetNode)
    const span = Math.abs(sourceX - targetX)
    return { edge, sourceNode, targetNode, span }
  })

  edgesWithSpan.sort((a, b) => a.span - b.span)

  // Calculate base Y: below all nodes with generous clearance
  const maxBottom = allChildren.reduce(
    (acc, node) => Math.max(acc, nodeBottom(node)),
    0,
  )

  const LANE_BASE_Y = maxBottom + 36        // tight clearance from lowest node
  const LANE_GAP = 32                        // compact vertical gap between return lanes
  const EXIT_STAGGER = 22                    // horizontal stagger per exit column
  const ENTRY_STAGGER = 22                   // horizontal stagger per entry column
  const NODE_CLEARANCE = 18                  // min clearance from node edges

  edgesWithSpan.forEach(({ edge, sourceNode, targetNode }, laneIdx) => {
    const laneY = LANE_BASE_Y + laneIdx * LANE_GAP

    // Source exit point: bottom of source node, then down to lane
    // For backward edges (right→left), source is on the right
    const srcRight = nodeRight(sourceNode)
    const srcMidY = nodeMidY(sourceNode)

    // Target entry point: bottom of target node, then up from lane
    const tgtLeft = nodeLeft(targetNode)
    const tgtMidY = nodeMidY(targetNode)

    // Stagger exit/entry X columns so vertical lines don't stack
    // Outermost lanes (longest span) exit closest to the node
    // Innermost lanes (shortest span) exit further from the node
    const reversedIdx = edgesWithSpan.length - 1 - laneIdx
    const exitX = srcRight + NODE_CLEARANCE + reversedIdx * EXIT_STAGGER
    const entryX = tgtLeft - NODE_CLEARANCE - reversedIdx * ENTRY_STAGGER

    // Build the path: source handle → right → down → horizontal → up → left → target handle
    // Source handle is on the right side of the source node
    const startPt: ElkPoint = { x: srcRight, y: srcMidY }
    // Target handle is on the left side of the target node
    const endPt: ElkPoint = { x: tgtLeft, y: tgtMidY }

    const pts: ElkPoint[] = [
      startPt,
      { x: exitX, y: srcMidY },          // horizontal exit from source handle
      { x: exitX, y: laneY },             // vertical drop to lane
      { x: entryX, y: laneY },            // horizontal return lane
      { x: entryX, y: tgtMidY },          // vertical rise to target
      endPt,                               // into target handle
    ]

    edgeGeometry[edge.id] = { points: simplifyOrthogonal(pts) }
  })
}

// ─── Overlap detection & separation ──────────────────────────────────────────

/**
 * Detect and separate edge segments that share near-identical routing space.
 * Post-processes the output to nudge overlapping horizontal/vertical
 * segments apart, ensuring each edge has a visually distinct trajectory.
 */
function separateOverlappingSegments(
  geom: Record<string, ElkEdgeGeometry>,
): void {
  const TOLERANCE = 6
  const NUDGE = 14

  type Segment = {
    edgeId: string
    segIdx: number
    horizontal: boolean
    fixedAxis: number
    min: number
    max: number
  }

  const segments: Segment[] = []

  for (const [edgeId, eg] of Object.entries(geom)) {
    const pts = eg.points
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const dx = Math.abs(b.x - a.x)
      const dy = Math.abs(b.y - a.y)

      if (dy < TOLERANCE && dx > TOLERANCE) {
        segments.push({
          edgeId,
          segIdx: i,
          horizontal: true,
          fixedAxis: (a.y + b.y) / 2,
          min: Math.min(a.x, b.x),
          max: Math.max(a.x, b.x),
        })
      } else if (dx < TOLERANCE && dy > TOLERANCE) {
        segments.push({
          edgeId,
          segIdx: i,
          horizontal: false,
          fixedAxis: (a.x + b.x) / 2,
          min: Math.min(a.y, b.y),
          max: Math.max(a.y, b.y),
        })
      }
    }
  }

  const processed = new Set<number>()

  for (let i = 0; i < segments.length; i++) {
    if (processed.has(i)) continue
    const group: number[] = [i]
    const si = segments[i]

    for (let j = i + 1; j < segments.length; j++) {
      if (processed.has(j)) continue
      const sj = segments[j]
      if (si.horizontal !== sj.horizontal) continue
      if (si.edgeId === sj.edgeId) continue
      if (Math.abs(si.fixedAxis - sj.fixedAxis) > TOLERANCE) continue

      const overlapMin = Math.max(si.min, sj.min)
      const overlapMax = Math.min(si.max, sj.max)
      if (overlapMax - overlapMin > TOLERANCE * 2) {
        group.push(j)
      }
    }

    if (group.length < 2) continue

    const totalSpan = (group.length - 1) * NUDGE
    group.forEach((segIdx, rank) => {
      const seg = segments[segIdx]
      const offset = -totalSpan / 2 + rank * NUDGE
      const pts = geom[seg.edgeId].points

      if (seg.horizontal) {
        pts[seg.segIdx] = { ...pts[seg.segIdx], y: pts[seg.segIdx].y + offset }
        pts[seg.segIdx + 1] = {
          ...pts[seg.segIdx + 1],
          y: pts[seg.segIdx + 1].y + offset,
        }
      } else {
        pts[seg.segIdx] = { ...pts[seg.segIdx], x: pts[seg.segIdx].x + offset }
        pts[seg.segIdx + 1] = {
          ...pts[seg.segIdx + 1],
          x: pts[seg.segIdx + 1].x + offset,
        }
      }

      processed.add(segIdx)
    })
  }
}
