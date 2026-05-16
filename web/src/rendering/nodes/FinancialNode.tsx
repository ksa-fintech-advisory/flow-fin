import type { CSSProperties } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FDLNodeKind, RuntimeNodeState } from '../../fdl/types'
import { NODE_VISUALS } from '../nodeVisuals'
import { useUiStore } from '../../stores/useUiStore'

export type FinancialNodeData = {
  kind: FDLNodeKind
  label: string
  runtimeState: RuntimeNodeState
}

export function FinancialNode({ id, data }: NodeProps) {
  const { kind, label, runtimeState } = data as FinancialNodeData
  const visual = NODE_VISUALS[kind]
  const selected = useUiStore((s) => s.selectedNodeId === id)

  const isStart = kind === 'start'
  const isEnd = kind === 'end'

  let shapeClass = 'ff-node--process'
  if (visual.shape === 'terminal') shapeClass = 'ff-node--terminal'
  if (visual.shape === 'condition') shapeClass = 'ff-node--condition'

  const className = [
    'ff-node',
    shapeClass,
    isEnd ? 'ff-node--terminal-exit' : '',
    `ff-node--${runtimeState}`,
    selected ? 'ff-node--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const kindLabel =
    kind === 'start'
      ? 'START'
      : kind === 'end'
        ? 'END'
        : kind.replace(/_/g, ' ')

  return (
    <div
      className={className}
      style={
        {
          '--accent': visual.accent,
          '--accent-muted': visual.muted,
        } as CSSProperties
      }
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        useUiStore.getState().setSelectedNodeId(id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          useUiStore.getState().setSelectedNodeId(id)
        }
      }}
    >
      {!isStart ? (
        <Handle type="target" position={Position.Left} className="ff-handle" />
      ) : null}

      {visual.shape === 'condition' ? (
        <div className="ff-node__diamond-shell">
          <div className="ff-node__diamond-face">
            <div className="ff-node__inner ff-node__inner--condition">
              <div className="ff-node__kind">{kindLabel}</div>
              <div className="ff-node__label">{label}</div>
              <div className="ff-node__state">{runtimeState}</div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={
            visual.shape === 'terminal'
              ? 'ff-node__inner ff-node__inner--terminal'
              : 'ff-node__inner ff-node__inner--process'
          }
        >
          <div className="ff-node__kind">{kindLabel}</div>
          <div className="ff-node__label">{label}</div>
          <div className="ff-node__state">{runtimeState}</div>
        </div>
      )}

      {!isEnd ? (
        <Handle type="source" position={Position.Right} className="ff-handle" />
      ) : null}
    </div>
  )
}
