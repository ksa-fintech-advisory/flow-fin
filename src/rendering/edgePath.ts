/**
 * Edge path helpers — clean rounded-corner orthogonal routing.
 *
 * Philosophy:
 *   - Right-angle paths with small rounded arcs at each bend
 *   - Clean, structured feel like Figma / draw.io connectors
 *   - Endpoints snap to React Flow handles
 *   - Labels sit at the midpoint of the longest segment
 *   - Intelligent curvature adapts to edge density
 */

export type Point = { x: number; y: number }

// ─── Geometry primitives ─────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ─── Rounded orthogonal path ─────────────────────────────────────────────────

/**
 * Convert ELK orthogonal waypoints into a path with rounded corners.
 * Each 90° bend is replaced by a quadratic arc with the given radius.
 * Straight segments and 2-point paths get a simple horizontal-pull bezier.
 */
export function roundedOrthoPath(points: Point[], radius = 14): string {
  if (points.length < 2) return ''

  // 2-point: simple horizontal bezier (clean departure from handles)
  if (points.length === 2) {
    return directHorizontalPath(points[0], points[1])
  }

  const r = radius
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    // Direction vectors
    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y

    const len1 = Math.hypot(dx1, dy1)
    const len2 = Math.hypot(dx2, dy2)

    // Clamp radius to half the shorter segment
    const maxR = Math.min(len1, len2) / 2
    const cr = Math.min(r, maxR)

    if (cr < 1) {
      // Too small for rounding — sharp corner
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    // Points where the arc begins / ends (offset from corner by cr)
    const arcStartX = curr.x - (dx1 / len1) * cr
    const arcStartY = curr.y - (dy1 / len1) * cr
    const arcEndX = curr.x + (dx2 / len2) * cr
    const arcEndY = curr.y + (dy2 / len2) * cr

    // Line to the arc start, then quadratic curve through the corner point
    d += ` L ${arcStartX} ${arcStartY}`
    d += ` Q ${curr.x} ${curr.y} ${arcEndX} ${arcEndY}`
  }

  // Final line to last point
  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`

  return d
}

// ─── Direct connection (2 points, no ELK waypoints) ──────────────────────────

/**
 * Clean horizontal-pull bezier for direct source→target connections.
 * Handles depart horizontally and meet the target cleanly.
 */
export function directHorizontalPath(source: Point, target: Point): string {
  const dx = target.x - source.x
  const dy = Math.abs(target.y - source.y)
  // Scale pull strength based on distance — longer edges get more pull
  const pullX = Math.max(Math.abs(dx) * 0.38, Math.min(dy * 0.6, 120), 50)

  const cx1 = source.x + pullX
  const cy1 = source.y
  const cx2 = target.x - pullX
  const cy2 = target.y

  return `M ${source.x} ${source.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${target.x} ${target.y}`
}

// ─── Feedback / loop edge path ────────────────────────────────────────────────

/**
 * For feedback / backward edges that ELK routes through detour lanes.
 * Uses slightly larger rounding radius for cleaner loops.
 */
export function feedbackArcPath(points: Point[]): string {
  return roundedOrthoPath(points, 16)
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
 * Position a label at the midpoint of the longest segment in the path.
 * This ensures labels sit on the most visually prominent section
 * of the edge, with a small perpendicular offset for readability.
 */
export function labelOnCurve(
  points: Point[],
  pxOffset = 10,
): { x: number; y: number; angle: number } {
  if (points.length < 2) return { ...points[0], angle: 0 }

  // Find the longest segment — label goes there
  let bestIdx = 0
  let bestLen = 0
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(
      points[i + 1].x - points[i].x,
      points[i + 1].y - points[i].y,
    )
    if (len > bestLen) {
      bestLen = len
      bestIdx = i
    }
  }

  const p0 = points[bestIdx]
  const p1 = points[bestIdx + 1]

  const cx = lerp(p0.x, p1.x, 0.5)
  const cy = lerp(p0.y, p1.y, 0.5)

  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const L = Math.hypot(dx, dy) || 1
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  // Perpendicular offset
  const nx = -dy / L
  const ny = dx / L

  return {
    x: cx + nx * pxOffset,
    y: cy + ny * pxOffset,
    angle,
  }
}

/**
 * @deprecated Use labelOnCurve instead.
 */
export function labelAboveMidSegment(points: Point[], pxOffset: number): Point {
  const { x, y } = labelOnCurve(points, pxOffset)
  return { x, y }
}

// ─── Legacy shims ─────────────────────────────────────────────────────────────

/** @deprecated Use roundedOrthoPath */
export function organicSplinePath(points: Point[], _tension?: number): string {
  return roundedOrthoPath(points, 14)
}

/** @deprecated Use directHorizontalPath */
export function organicDirectPath(source: Point, target: Point): string {
  return directHorizontalPath(source, target)
}

/** @deprecated Use roundedOrthoPath */
export function softConnectorPath(points: Point[], _tension?: number): string {
  return roundedOrthoPath(points, 14)
}

/** @deprecated */
export function simplifyOrthoWaypoints(pts: Point[]): Point[] {
  return pts
}
