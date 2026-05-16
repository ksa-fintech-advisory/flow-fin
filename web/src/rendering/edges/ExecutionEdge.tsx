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
  /** ELK orthogonal polyline — snapped to handles then rounded in SVG */
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
  })

  const elkRaw = edgeData?.elkPoints

  let path: string
  let labelX: number
  let labelY: number

  if (elkRaw && elkRaw.length >= 2) {
    const snapped = snapEndpoints(elkRaw, sourceX, sourceY, targetX, targetY)
    path = roundedOrthoPath(snapped, 14)
    const lift = labelAboveMidSegment(snapped, 26)
    labelX = lift.x
    labelY = lift.y
  } else {
    path = smoothPath
    labelX = smoothLabelX
    labelY = smoothLabelY
  }

  const active = Boolean(edgeData?.active)

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: active ? '#38bdf8' : 'rgba(148, 163, 184, 0.92)',
          strokeWidth: active ? 2.65 : 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          shapeRendering: 'geometricPrecision',
          transition: 'stroke 160ms ease, stroke-width 160ms ease',
        }}
      />
      {active ? (
        <path
          d={path}
          fill="none"
          stroke="#e0f2fe"
          strokeWidth={2}
          strokeDasharray="6 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          shapeRendering="geometricPrecision"
          opacity={0.92}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-72"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      ) : null}
      {edgeData?.label ? (
        <EdgeLabelRenderer>
          <div
            className="ff-edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
