/** Helpers for ELK polylines → rounded orthogonal SVG paths (Miro / Packet Tracer feel). */

export type Point = { x: number; y: number }

function len(ax: number, ay: number): number {
  return Math.hypot(ax, ay)
}

function clampCornerRadius(
  prev: Point,
  corner: Point,
  next: Point,
  radius: number,
): number {
  const dIn = len(corner.x - prev.x, corner.y - prev.y)
  const dOut = len(next.x - corner.x, next.y - corner.y)
  return Math.min(radius, dIn / 2 - 0.5, dOut / 2 - 0.5)
}

/**
 * Rounded orthogonal trace: preserves corners as quadratic bends instead of sharp ELK corners.
 */
export function roundedOrthoPath(points: Point[], radius: number): string {
  if (points.length < 2) return ''
  const r0 = Math.max(4, radius)

  if (points.length === 2) {
    const [a, b] = points
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    const din = len(curr.x - prev.x, curr.y - prev.y)
    const dout = len(next.x - curr.x, next.y - curr.y)
    if (din < 0.5 || dout < 0.5) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const r = clampCornerRadius(prev, curr, next, r0)
    if (r <= 2) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const vIn = {
      x: (curr.x - prev.x) / din,
      y: (curr.y - prev.y) / din,
    }
    const vOut = {
      x: (next.x - curr.x) / dout,
      y: (next.y - curr.y) / dout,
    }

    const pBefore = { x: curr.x - vIn.x * r, y: curr.y - vIn.y * r }
    const pAfter = { x: curr.x + vOut.x * r, y: curr.y + vOut.y * r }

    d += ` L ${pBefore.x} ${pBefore.y}`
    d += ` Q ${curr.x} ${curr.y} ${pAfter.x} ${pAfter.y}`
  }

  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

/** Match ELK polyline endpoints to React Flow handle positions (single continuous stroke). */
export function snapEndpoints(
  points: Point[],
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): Point[] {
  if (points.length < 2) return points
  const out = points.map((p, i) =>
    i === 0
      ? { x: sourceX, y: sourceY }
      : i === points.length - 1
        ? { x: targetX, y: targetY }
        : { ...p },
  )
  return simplifyOrthoWaypoints(out)
}

function simplifyOrthoWaypoints(pts: Point[]): Point[] {
  const EPS = 0.75
  if (pts.length < 3) return pts
  const out: Point[] = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1]
    const b = pts[i]
    const c = pts[i + 1]
    const collinearH =
      Math.abs(a.y - b.y) < EPS && Math.abs(b.y - c.y) < EPS
    const collinearV =
      Math.abs(a.x - b.x) < EPS && Math.abs(b.x - c.x) < EPS
    if (!collinearH && !collinearV) out.push(b)
  }
  out.push(pts[pts.length - 1])
  return out
}

/** Lift edge labels slightly off the wire so pills do not sit “inside” the stroke */
export function labelAboveMidSegment(points: Point[], pxOffset: number): Point {
  if (points.length < 2) return points[0]
  const midSeg = Math.floor((points.length - 1) / 2)
  const p0 = points[midSeg]
  const p1 = points[midSeg + 1]
  const dx = p1.x - p0.x
  const dy = p1.y - p0.y
  const L = Math.hypot(dx, dy) || 1
  const nx = -dy / L
  const ny = dx / L
  const cx = (p0.x + p1.x) / 2
  const cy = (p0.y + p1.y) / 2
  return { x: cx + nx * pxOffset, y: cy + ny * pxOffset }
}
