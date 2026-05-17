import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react'

import {
  directHorizontalPath,
  feedbackArcPath,
  labelOnCurve,
  roundedOrthoPath,
  snapEndpoints,
} from '../edgePath'

export type EdgeDirection = 'forward' | 'response'

export type ExecutionEdgeData = {
  label?: string
  active?: boolean
  /** This edge is carrying a failure/decline signal */
  failed?: boolean
  highlighted?: boolean
  elkPoints?: { x: number; y: number }[]
  /** Flow direction: 'forward' (request path) or 'response' (backward/return path) */
  direction?: EdgeDirection
}

/**
 * ExecutionEdge — clean operational topology connector.
 *
 * Visual hierarchy:
 *   idle       → dim slate wire (forward) or tinted amber (response)
 *   highlighted → brightened, slight glow
 *   active     → electric blue, animated flow particles
 *   failed     → red, animated flow particles (decline propagation)
 *
 * Direction-aware coloring:
 *   forward  edges → slate/blue tones (request path)
 *   response edges → warm amber tones (return path)
 *   This lets users visually trace request vs response before simulation.
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
  const direction: EdgeDirection = edgeData?.direction ?? 'forward'

  const elkRaw = edgeData?.elkPoints

  // ── Resolve path ─────────────────────────────────────────────────────────
  let path: string
  let labelPos: { x: number; y: number; angle: number }

  if (elkRaw && elkRaw.length >= 2) {
    const snapped = snapEndpoints(elkRaw, sourceX, sourceY, targetX, targetY)
    const isFeedback = snapped[0].x > snapped[snapped.length - 1].x + 40
    path = isFeedback
      ? feedbackArcPath(snapped)
      : roundedOrthoPath(snapped, 14)
    labelPos = labelOnCurve(snapped, 10)
  } else {
    const src = { x: sourceX, y: sourceY }
    const tgt = { x: targetX, y: targetY }
    path = directHorizontalPath(src, tgt)
    labelPos = labelOnCurve([src, tgt], 10)
  }

  const active = Boolean(edgeData?.active)
  const failed = Boolean(edgeData?.failed)
  const highlighted = Boolean(edgeData?.highlighted) || Boolean(selected)
  const isResponse = direction === 'response'

  const markerId = `ff-arrow-${id}`
  const glowId = `ff-glow-${id}`

  // ── Visual state classes ─────────────────────────────────────────────────
  const wireClass = [
    'ff-edge-wire',
    active ? 'ff-edge-wire--active' : '',
    failed ? 'ff-edge-wire--failed' : '',
    highlighted ? 'ff-edge-wire--highlight' : '',
    isResponse ? 'ff-edge-wire--response' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // ── Direction-aware color tokens ─────────────────────────────────────────
  const forwardBase = 'rgba(100, 116, 139, 0.7)'
  const forwardHighlight = 'rgba(148, 163, 184, 0.95)'
  const responseBase = 'rgba(196, 167, 125, 0.65)'
  const responseHighlight = 'rgba(217, 189, 149, 0.92)'
  const activeColor = '#38bdf8'
  const failedColor = '#f87171'   // red-400

  const baseColor = isResponse ? responseBase : forwardBase
  const highlightColor = isResponse ? responseHighlight : forwardHighlight

  // Failed overrides active color
  const resolvedActiveColor = failed ? failedColor : activeColor
  const strokeColor = active
    ? resolvedActiveColor
    : highlighted
      ? highlightColor
      : baseColor
  const strokeWidth = active ? 2.5 : highlighted ? 1.8 : 1.4

  // Arrow marker color
  const markerColor = active
    ? resolvedActiveColor
    : highlighted
      ? highlightColor
      : isResponse
        ? 'rgba(196, 167, 125, 0.8)'
        : 'rgba(100, 116, 139, 0.8)'

  // Edge label accent
  const labelBorder = active
    ? failed
      ? 'rgba(248, 113, 113, 0.4)'
      : 'rgba(56, 189, 248, 0.4)'
    : highlighted
      ? isResponse
        ? 'rgba(217, 189, 149, 0.5)'
        : 'rgba(148, 163, 184, 0.5)'
      : isResponse
        ? 'rgba(196, 167, 125, 0.35)'
        : 'rgba(100, 116, 139, 0.35)'

  // Dashed stroke for response edges — visual "return path" cue
  const strokeDasharray = isResponse && !active ? '6 4' : undefined

  // Halo color: red for failed, blue for normal active
  const haloColor = failed ? '#f87171' : '#38bdf8'
  const pulseColor = failed ? '#fecaca' : '#e0f2fe'

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

        {/* Arrowhead */}
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

      {/* Wide invisible hit-area */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        className="ff-edge-hit"
      />

      {/* Ambient halo: active edges (blue or red for failure) */}
      {active && (
        <path
          d={path}
          fill="none"
          stroke={haloColor}
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
          strokeDasharray,
          fill: 'none',
          color: markerColor,
        }}
      />

      {/* Animated flow particles — active only */}
      {active && (
        <path
          d={path}
          fill="none"
          stroke={pulseColor}
          strokeWidth={2.2}
          strokeDasharray="8 14"
          strokeLinecap="round"
          className={`ff-edge-wire--pulse ${failed ? 'ff-edge-wire--pulse-failed' : ''}`}
          style={{ opacity: 0.88 }}
        />
      )}

      {/* Edge label — embedded ON the curve path */}
      {edgeData?.label ? (
        <EdgeLabelRenderer>
          <div
            className={`ff-edge-label ${active ? (failed ? 'ff-edge-label--failed' : 'ff-edge-label--active') : ''} ${isResponse ? 'ff-edge-label--response' : ''}`}
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
