import { EdgeLabelRenderer, useStore } from '@xyflow/react'
import { useMemo } from 'react'
import type { ElkEdgeGeometry } from '../../layout/applyElkLayout'
import type { TransitPacket } from '../../runtime/runtimeTypes'
import { useRuntimeStore } from '../../stores/useRuntimeStore'
import { pointAlongPolyline, snapEndpoints } from '../edgePath'

type PayloadPacketLayerProps = {
  edgeGeometry: Record<string, ElkEdgeGeometry>
}

function PacketBubble({ packet, x, y }: { packet: TransitPacket; x: number; y: number }) {
  return (
    <div
      className={`ff-packet ff-packet--${packet.tone}`}
      style={{
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      }}
    >
      <span className="ff-packet__amount">{packet.label}</span>
      <span className="ff-packet__status">{packet.payload.status}</span>
    </div>
  )
}

export function PayloadPacketLayer({ edgeGeometry }: PayloadPacketLayerProps) {
  const transitPackets = useRuntimeStore((s) => s.transitPackets)
  const edges = useStore((s) => s.edges)
  const nodeLookup = useStore((s) => s.nodeLookup)

  const rendered = useMemo(() => {
    const out: { packet: TransitPacket; x: number; y: number }[] = []

    for (const pkt of transitPackets) {
      const edge = edges.find((e) => e.id === pkt.edgeId)
      if (!edge) continue

      const geom = edgeGeometry[pkt.edgeId]
      const points = geom?.points
      if (!points || points.length < 2) continue

      const sourceNode = nodeLookup.get(edge.source)
      const targetNode = nodeLookup.get(edge.target)
      const sourcePos = sourceNode?.internals?.positionAbsolute
      const targetPos = targetNode?.internals?.positionAbsolute
      if (!sourcePos || !targetPos) continue

      const sw = sourceNode?.measured?.width ?? 180
      const sh = sourceNode?.measured?.height ?? 72
      const th = targetNode?.measured?.height ?? 72
      const sx = sourcePos.x + sw * 0.92
      const sy = sourcePos.y + sh / 2
      const tx = targetPos.x + 8
      const ty = targetPos.y + th / 2

      const snapped = snapEndpoints(points, sx, sy, tx, ty)
      const pos = pointAlongPolyline(snapped, Math.min(0.98, pkt.progress))
      out.push({ packet: pkt, x: pos.x, y: pos.y })
    }

    return out
  }, [transitPackets, edges, edgeGeometry, nodeLookup])

  if (!rendered.length) return null

  return (
    <EdgeLabelRenderer>
      {rendered.map(({ packet, x, y }) => (
        <PacketBubble key={packet.id} packet={packet} x={x} y={y} />
      ))}
    </EdgeLabelRenderer>
  )
}
