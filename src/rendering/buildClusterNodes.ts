import type { Node } from '@xyflow/react'
import type { FlowDefinition } from '../fdl/types'
import { domainZonesForFlow } from '../runtime/domainZones'

const PAD = 28

export function buildClusterNodes(flow: FlowDefinition, layoutNodes: Node[]): Node[] {
  const zones = domainZonesForFlow(flow)
  const byId = new Map(layoutNodes.map((n) => [n.id, n]))
  const clusters: Node[] = []

  for (const zone of zones) {
    const positioned = zone.nodeIds
      .map((id) => byId.get(id))
      .filter((n): n is Node => Boolean(n))
    if (!positioned.length) continue

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of positioned) {
      const w = n.width ?? 180
      const h = n.height ?? 72
      minX = Math.min(minX, n.position.x)
      minY = Math.min(minY, n.position.y)
      maxX = Math.max(maxX, n.position.x + w)
      maxY = Math.max(maxY, n.position.y + h)
    }

    clusters.push({
      id: `cluster-${zone.id}`,
      type: 'cluster',
      position: { x: minX - PAD, y: minY - PAD },
      width: maxX - minX + PAD * 2,
      height: maxY - minY + PAD * 2,
      zIndex: -1,
      selectable: false,
      draggable: false,
      focusable: false,
      data: { label: zone.label, accent: zone.accent },
    })
  }

  return clusters
}
