import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react'

import {
  feedbackArcPath,
  labelOnCurve,
  organicDirectPath,
  organicSplinePath,
  snapEndpoints,
} from '../edgePath'

export type ExecutionEdgeData = {
  label?: string
  active?: boolean
  highlighted?: boolean
  elkPoints?: { x: number; y: number }[]
}

/**
 * ExecutionEdge — cinematic operational topology connector.
 *
 * Visual hierarchy:
 *   idle       → dim slate wire, subtle presence
 *   highlighted → brightened, slight glow halo
 *   active     → electric blue, animated flow particles, soft radiance
 *
 * Label strategy:
 *   Labels sit ON the edge curve (not floating) with a tiny perpendicular
 *   offset for readability. They are embedded into the topology.
 */
export function ExecutionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps) {
  const edgeData = data as ExecutionEdgeData | undefined

  const elkRaw = edgeData?.elkPoints

  // ── Resolve path ─────────────────────────────────────────────────────────
  let path: string
  let labelPos: { x: number; y: number; angle: number }

  if (elkRaw && elkRaw.length >= 2) {
    const snapped = snapEndpoints(elkRaw, sourceX, sourceY, targetX, targetY)
    // Detect feedback edges: source is to the right of target
    const isFeedback = snapped[0].x > snapped[snapped.length - 1].x + 40
    path = isFeedback
      ? feedbackArcPath(snapped)
      : organicSplinePath(snapped, 0.22)
    // Label sits ON the curve with minimal offset (topology-attached)
    labelPos = labelOnCurve(snapped, 10)
  } else {
    // Pure direct connection: organic horizontal-pull arc
    const src = { x: sourceX, y: sourceY }
    const tgt = { x: targetX, y: targetY }
    path = organicDirectPath(src, tgt)
    labelPos = labelOnCurve([src, tgt], 10)
  }

  const active = Boolean(edgeData?.active)
  const highlighted = Boolean(edgeData?.highlighted) || Boolean(selected)

  const markerId = `ff-arrow-${id}`
  const glowId = `ff-glow-${id}`

  // ── Visual state classes ─────────────────────────────────────────────────
  const wireClass = [
    'ff-edge-wire',
    active ? 'ff-edge-wire--active' : '',
    highlighted ? 'ff-edge-wire--highlight' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Color tokens
  const baseColor = 'rgba(100, 116, 139, 0.7)'
  const highlightColor = 'rgba(148, 163, 184, 0.95)'
  const activeColor = '#38bdf8'
  const strokeColor = active ? activeColor : highlighted ? highlightColor : baseColor
  const strokeWidth = active ? 2.5 : highlighted ? 1.8 : 1.4

  // Arrow marker color
  const markerColor = active ? activeColor : highlighted ? highlightColor : 'rgba(100, 116, 139, 0.8)'

  // Edge label accent — subtle tint from the active state
  const labelBorder = active
    ? 'rgba(56, 189, 248, 0.4)'
    : highlighted
      ? 'rgba(148, 163, 184, 0.5)'
      : 'rgba(100, 116, 139, 0.35)'

  return (
    <>
      <defs>
        {/* Glow filter for active edges */}
        {active && (
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}

        {/* Arrowhead — slightly rounder than default for organic feel */}
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M1,1 L9,5 L1,9 Q4,5 1,1 Z"
            fill={markerColor}
            className="ff-edge-marker"
          />
        </marker>
      </defs>

      {/* Wide invisible hit-area — editor affordance */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        className="ff-edge-hit"
      />

      {/* Ambient halo: only for active edges */}
      {active && (
        <path
          d={path}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.18}
          filter={`url(#${glowId})`}
          className="ff-edge-wire--halo"
        />
      )}

      {/* Primary wire */}
      <BaseEdge
        id={id}
        path={path}
        markerEnd={`url(#${markerId})`}
        className={wireClass}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          color: markerColor,
        }}
      />

      {/* Animated flow particles — active only */}
      {active && (
        <path
          d={path}
          fill="none"
          stroke="#e0f2fe"
          strokeWidth={2.2}
          strokeDasharray="8 14"
          strokeLinecap="round"
          className="ff-edge-wire--pulse"
          style={{ opacity: 0.88 }}
        />
      )}

      {/* Edge label — embedded ON the curve path */}
      {edgeData?.label ? (
        <EdgeLabelRenderer>
          <div
            className={`ff-edge-label ${active ? 'ff-edge-label--active' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              borderColor: labelBorder,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
