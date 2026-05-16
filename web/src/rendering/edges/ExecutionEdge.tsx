import {
  BaseEdge,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react'

import {
  softConnectorPath,
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
    path = softConnectorPath(snapped, 0.2)
    const midSeg = Math.floor((snapped.length - 1) / 2)
    const a = snapped[midSeg]
    const b = snapped[midSeg + 1]
    labelX = (a.x + b.x) / 2
    labelY = (a.y + b.y) / 2
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
        className={active ? 'ff-edge-wire ff-edge-wire--active' : 'ff-edge-wire'}
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
      {edgeData?.label ? (
        <text x={labelX} y={labelY} className="ff-edge-inline-label">
          {edgeData.label}
        </text>
      ) : null}
    </>
  )
}
