import type { NodeProps } from '@xyflow/react'

export type ClusterNodeData = {
  label: string
  accent: string
}

export function ClusterNode({ data, width, height }: NodeProps) {
  const { label, accent } = data as ClusterNodeData
  return (
    <div
      className="ff-domain-cluster"
      style={{
        background: accent,
        width: width ?? '100%',
        height: height ?? '100%',
      }}
      aria-hidden
    >
      <span className="ff-domain-cluster__label">{label}</span>
    </div>
  )
}
