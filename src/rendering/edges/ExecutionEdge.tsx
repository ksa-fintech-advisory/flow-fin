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
  /** Response edge that successfully carried approval/settlement */
  succeeded?: boolean
  highlighted?: boolean
  elkPoints?: { x: number; y: number }[]
  /** Flow direction: 'forward' (request path) or 'response' (backward/return path) */
  direction?: EdgeDirection
  /** Fading propagation trail opacity (0–1) */
  trailOpacity?: number
  trailTone?: 'active' | 'failed' | 'success'
  edgeMetrics?: { latencyMs: number; queuePressure: number }
}

/**
 * ExecutionEdge — clean operational topology connector.
 *
 * Visual hierarchy:
 *   idle       → dim slate wire (forward) or tinted amber (response)
 *   highlighted → brightened, slight glow
 *   active     → electric blue (forward) or green (successful response)
 *   failed     → red dotted, animated flow particles (decline propagation)
 *   succeeded  → green operational wire (sticky after successful response)
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
  const succeeded = Boolean(edgeData?.succeeded)
  const highlighted = Boolean(edgeData?.highlighted) || Boolean(selected)
  const isResponse = direction === 'response'
  const trailOpacity = edgeData?.trailOpacity ?? 0
  const trailTone = edgeData?.trailTone ?? 'active'
  const showTrail = trailOpacity > 0.06 && !active

  const markerId = `ff-arrow-${id}`
  const glowId = `ff-glow-${id}`

  // ── Visual state classes ─────────────────────────────────────────────────
  const wireClass = [
    'ff-edge-wire',
    active ? 'ff-edge-wire--active' : '',
    failed ? 'ff-edge-wire--failed' : '',
    succeeded ? 'ff-edge-wire--succeeded' : '',
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
  const failedColor = '#f87171'
  const failedMuted = 'rgba(248, 113, 113, 0.82)'
  const succeededColor = '#34d399'   // emerald-400
  const succeededMuted = 'rgba(52, 211, 153, 0.72)'

  const baseColor = failed
    ? failedMuted
    : succeeded
      ? succeededMuted
      : isResponse
        ? responseBase
        : forwardBase
  const highlightColor = failed
    ? 'rgba(252, 165, 165, 0.95)'
    : succeeded
      ? 'rgba(110, 231, 183, 0.92)'
      : isResponse
        ? responseHighlight
        : forwardHighlight

  const resolvedActiveColor = failed
    ? failedColor
    : succeeded
      ? succeededColor
      : activeColor
  const strokeColor = active
    ? resolvedActiveColor
    : failed
      ? failedMuted
      : highlighted
        ? highlightColor
        : baseColor
  const strokeWidth = active ? 2.5 : failed ? 2 : highlighted ? 1.8 : succeeded ? 1.6 : 1.4

  const markerColor = active
    ? resolvedActiveColor
    : failed
      ? failedMuted
      : highlighted
        ? highlightColor
        : succeeded
          ? succeededMuted
          : isResponse
            ? 'rgba(196, 167, 125, 0.8)'
            : 'rgba(100, 116, 139, 0.8)'

  const labelBorder = failed
    ? 'rgba(248, 113, 113, 0.45)'
    : active
      ? succeeded
        ? 'rgba(52, 211, 153, 0.45)'
        : 'rgba(56, 189, 248, 0.4)'
      : highlighted
        ? succeeded
          ? 'rgba(52, 211, 153, 0.5)'
          : isResponse
            ? 'rgba(217, 189, 149, 0.5)'
            : 'rgba(148, 163, 184, 0.5)'
        : succeeded
          ? 'rgba(52, 211, 153, 0.38)'
          : isResponse
            ? 'rgba(196, 167, 125, 0.35)'
            : 'rgba(100, 116, 139, 0.35)'

  // Failed response → dotted decline; successful response → solid operational green
  const strokeDasharray = failed
    ? '6 4'
    : isResponse && !active && !succeeded
      ? '6 4'
      : undefined

  const haloColor = failed ? '#f87171' : succeeded ? '#34d399' : '#38bdf8'
  const pulseColor = failed ? '#fecaca' : succeeded ? '#d1fae5' : '#e0f2fe'

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

      {/* Propagation trail — fading execution history */}
      {showTrail ? (
        <path
          d={path}
          fill="none"
          stroke={
            trailTone === 'failed'
              ? 'rgba(248, 113, 113, 0.55)'
              : trailTone === 'success'
                ? 'rgba(52, 211, 153, 0.5)'
                : 'rgba(56, 189, 248, 0.45)'
          }
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={trailOpacity * 0.55}
          className="ff-edge-wire--trail"
        />
      ) : null}

      {/* Ambient halo: active edges (blue, green, or red) */}
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
          className={`ff-edge-wire--pulse ${failed ? 'ff-edge-wire--pulse-failed' : ''} ${succeeded ? 'ff-edge-wire--pulse-succeeded' : ''}`}
          style={{ opacity: 0.88 }}
        />
      )}

      {/* Edge label — embedded ON the curve path */}
      {edgeData?.label ? (
        <EdgeLabelRenderer>
          <div
            className={`ff-edge-label ${failed ? 'ff-edge-label--failed' : succeeded ? 'ff-edge-label--succeeded' : active ? 'ff-edge-label--active' : ''} ${isResponse && !succeeded && !failed ? 'ff-edge-label--response' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              borderColor: labelBorder,
            }}
          >
            {edgeData.label}
            {edgeData.edgeMetrics && (active || trailOpacity > 0.3) ? (
              <span className="ff-edge-label__metrics">
                {edgeData.edgeMetrics.latencyMs}ms · Q
                {Math.round(edgeData.edgeMetrics.queuePressure * 100)}%
              </span>
            ) : null}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
