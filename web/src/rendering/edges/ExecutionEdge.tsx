import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react'

import {
  labelAboveMidSegment,
  roundedOrthoPath,
  snapEndpoints,
} from '../edgePath'

export type ExecutionEdgeData = {
  label?: string
  active?: boolean
  highlighted?: boolean
  elkPoints?: { x: number; y: number }[]
}

export function ExecutionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const edgeData = data as ExecutionEdgeData | undefined

  const [smoothPath, smoothLabelX, smoothLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  const elkRaw = edgeData?.elkPoints

  let path: string
  let labelAnchor: { x: number; y: number }

  if (elkRaw && elkRaw.length >= 2) {
    const snapped = snapEndpoints(elkRaw, sourceX, sourceY, targetX, targetY)
    path = roundedOrthoPath(snapped, 12)
    labelAnchor = labelAboveMidSegment(snapped, 22)
  } else {
    path = smoothPath
    labelAnchor = { x: smoothLabelX, y: smoothLabelY }
  }

  const active = Boolean(edgeData?.active)
  const highlighted = Boolean(edgeData?.highlighted) || Boolean(selected)

  const markerId = `ff-arrow-${id}`

  const wireClass = [
    'ff-edge-wire',
    active ? 'ff-edge-wire--active' : '',
    highlighted ? 'ff-edge-wire--highlight' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L8,4 L0,8 Z"
            className="ff-edge-marker"
            fill="currentColor"
          />
        </marker>
      </defs>

      {/* Wide hit area for hover affordance (editor-like) */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        className="ff-edge-hit"
      />

      <BaseEdge
        id={id}
        path={path}
        markerEnd={`url(#${markerId})`}
        className={wireClass}
        style={{
          stroke: active
            ? '#38bdf8'
            : highlighted
              ? '#94a3b8'
              : 'rgba(100, 116, 139, 0.85)',
          strokeWidth: active ? 2.5 : highlighted ? 2 : 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          color: active ? '#38bdf8' : 'rgba(148, 163, 184, 0.9)',
        }}
      />

      {active ? (
        <path
          d={path}
          fill="none"
          stroke="#e0f2fe"
          strokeWidth={2}
          strokeDasharray="6 10"
          strokeLinecap="round"
          className="ff-edge-wire--pulse"
        />
      ) : null}

      {edgeData?.label ? (
        <EdgeLabelRenderer>
          <div
            className="ff-edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelAnchor.x}px, ${labelAnchor.y}px)`,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
