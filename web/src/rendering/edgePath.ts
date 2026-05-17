/**
 * Organic edge path helpers — Figma/Miro/Cisco Packet Tracer feel.
 *
 * Philosophy:
 *   - No hard 90° corners, no rigid orthogonal traces
 *   - Cubic bezier arcs that guide the eye naturally
 *   - Multi-waypoint paths use catmull-rom tension for smooth flow
 *   - Endpoints always snap to React Flow handles
 */

export type Point = { x: number; y: number }

// ─── Geometry primitives ─────────────────────────────────────────────────────

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

// ─── Direct connection (2 points) ────────────────────────────────────────────

/**
 * Organic cubic bezier for a direct source→target connection.
 * Creates a natural bow arc — inspired by Figma connection handles and Miro.
 * The arc amplitude scales with distance and vertical offset to feel alive.
 */
export function organicDirectPath(source: Point, target: Point): string {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const d = Math.hypot(dx, dy)

  // Horizontal pull: control points lean horizontally for a smooth departure
  const pullX = Math.max(Math.abs(dx) * 0.42, Math.min(d * 0.35, 180))

  // Vertical bow: subtle perpendicular lift for visual breathing
  const vertBow = Math.abs(dy) < 8
    ? Math.min(d * 0.06, 36)   // nearly straight: add gentle bow
    : dy * 0.08                 // slanted: follow natural curve

  const cx1 = source.x + pullX
  const cy1 = source.y + vertBow

  const cx2 = target.x - pullX
  const cy2 = target.y - vertBow

  return `M ${source.x} ${source.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${target.x} ${target.y}`
}

// ─── Multi-waypoint spline (ELK polyline → organic curve) ────────────────────

/**
 * Convert ELK waypoints into a smooth catmull-rom-style bezier spline.
 * Tension controls how tightly the curve follows the waypoints.
 * Higher tension = tighter corners; lower = more fluid arcs.
 */
export function organicSplinePath(points: Point[], tension = 0.22): string {
  if (points.length < 2) return ''

  if (points.length === 2) {
    return organicDirectPath(points[0], points[1])
  }

  // Build smooth C commands through waypoints using Catmull-Rom → Cubic conversion
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    // Catmull-Rom control point derivation
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }

  return d
}

// ─── Feedback / loop edge path ────────────────────────────────────────────────

/**
 * Smooth bypass arc for feedback / long-range edges.
 * Routes below the node layer with gentle entry/exit curves.
 * Creates the "operational loop" topology feel.
 */
export function feedbackArcPath(points: Point[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) return organicDirectPath(points[0], points[1])

  // Use the spline path for ELK-routed feedback edges
  // but with slightly looser tension so loops feel natural
  return organicSplinePath(points, 0.28)
}

// ─── Endpoint snapping ────────────────────────────────────────────────────────

/**
 * Align ELK polyline endpoints to React Flow handle positions.
 * Preserves interior waypoints for accurate routing.
 */
export function snapEndpoints(
  points: Point[],
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): Point[] {
  if (points.length < 2) return points

  return points.map((p, i) =>
    i === 0
      ? { x: sourceX, y: sourceY }
      : i === points.length - 1
        ? { x: targetX, y: targetY }
        : { ...p },
  )
}

// ─── Label anchor ─────────────────────────────────────────────────────────────

/**
 * Compute a label position that sits semantically ON the edge curve.
 *
 * For 2-point paths: evaluates the cubic bezier at t=0.5 (true visual center)
 * then offsets by a small perpendicular amount for readability.
 *
 * For multi-point paths: picks the middle waypoint pair and samples the
 * midpoint with a perpendicular lift.
 *
 * `pxOffset` controls how far above/below the curve the label sits.
 * Use small values (6–10) to keep labels attached to the topology.
 *
 * Returns { x, y, angle } where angle (degrees) is the tangent at the
 * label point — can be used to rotate labels to follow the curve.
 */
export function labelOnCurve(
  points: Point[],
  pxOffset = 8,
): { x: number; y: number; angle: number } {
  if (points.length < 2) return { ...points[0], angle: 0 }

  // ── 2-point: evaluate the actual bezier curve at t=0.5 ──────────────
  if (points.length === 2) {
    const [src, tgt] = points
    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const d = Math.hypot(dx, dy)

    // Reconstruct the same control points organicDirectPath uses
    const pullX = Math.max(Math.abs(dx) * 0.42, Math.min(d * 0.35, 180))
    const vertBow = Math.abs(dy) < 8
      ? Math.min(d * 0.06, 36)
      : dy * 0.08

    const cx1 = src.x + pullX
    const cy1 = src.y + vertBow
    const cx2 = tgt.x - pullX
    const cy2 = tgt.y - vertBow

    // Cubic bezier at t=0.5
    const t = 0.5
    const it = 1 - t
    const midX = it*it*it*src.x + 3*it*it*t*cx1 + 3*it*t*t*cx2 + t*t*t*tgt.x
    const midY = it*it*it*src.y + 3*it*it*t*cy1 + 3*it*t*t*cy2 + t*t*t*tgt.y

    // Tangent at t=0.5 (first derivative of cubic bezier)
    const tanX = 3*it*it*(cx1-src.x) + 6*it*t*(cx2-cx1) + 3*t*t*(tgt.x-cx2)
    const tanY = 3*it*it*(cy1-src.y) + 6*it*t*(cy2-cy1) + 3*t*t*(tgt.y-cy2)
    const tanLen = Math.hypot(tanX, tanY) || 1
    const angle = Math.atan2(tanY, tanX) * (180 / Math.PI)

    // Perpendicular offset (rotate tangent 90°)
    const nx = -tanY / tanLen
    const ny = tanX / tanLen

    return {
      x: midX + nx * pxOffset,
      y: midY + ny * pxOffset,
      angle,
    }
  }

  // ── Multi-point: sample the middle segment ──────────────────────────
  const midIdx = Math.floor((points.length - 1) / 2)
  const p0 = points[midIdx]
  const p1 = points[midIdx + 1]

  const cx = lerp(p0.x, p1.x, 0.5)
  const cy = lerp(p0.y, p1.y, 0.5)

  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const L = Math.hypot(dx, dy) || 1
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  // Perpendicular offset (small — keeps label attached)
  const nx = -dy / L
  const ny = dx / L

  return {
    x: cx + nx * pxOffset,
    y: cy + ny * pxOffset,
    angle,
  }
}

/**
 * @deprecated Use labelOnCurve instead — this shim preserves old call sites.
 */
export function labelAboveMidSegment(points: Point[], pxOffset: number): Point {
  const { x, y } = labelOnCurve(points, pxOffset)
  return { x, y }
}

// ─── Legacy compatibility shims ───────────────────────────────────────────────
// These ensure any code that imported the old functions still compiles.

/** @deprecated Use organicSplinePath instead */
export function softConnectorPath(points: Point[], tension = 0.22): string {
  return organicSplinePath(points, tension)
}

/** @deprecated Use organicDirectPath or organicSplinePath instead */
export function roundedOrthoPath(points: Point[], _radius: number): string {
  return organicSplinePath(points, 0.22)
}

/** @deprecated */
export function simplifyOrthoWaypoints(pts: Point[]): Point[] {
  return pts
}
