import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FDLNodeKind, RuntimeNodeState } from '../../fdl/types'
import { NodeKindIcon } from '../nodeIcons'
import { NODE_VISUALS } from '../nodeVisuals'
import { NodeMetricsBadge } from '../NodeMetricsBadge'
import { useRuntimeStore } from '../../stores/useRuntimeStore'
import { useUiStore } from '../../stores/useUiStore'

export type FinancialNodeData = {
  kind: FDLNodeKind
  label: string
  runtimeState: RuntimeNodeState
  /** Contextual failure/decline message for this node */
  failureMessage?: string | null
  /** Node is on the path already traveled in this simulation */
  visited?: boolean
}

function statusLabel(state: RuntimeNodeState): string {
  return state.replace('_', ' ')
}

export function FinancialNode({ id, data, selected }: NodeProps) {
  const { kind, label, runtimeState, failureMessage, visited } = data as FinancialNodeData
  const visual = NODE_VISUALS[kind]
  const storeSelected = useUiStore((s) => s.selectedNodeId === id)
  const phase = useRuntimeStore((s) => s.phase)
  const nodeMetrics = useRuntimeStore((s) => s.nodeMetrics[id])
  const isSelected = selected || storeSelected
  const showMetrics = phase !== 'idle' || runtimeState !== 'idle'

  const isStart = kind === 'start'
  const isEnd = kind === 'end'

  let shapeClass = 'ff-node--process'
  if (visual.shape === 'terminal') shapeClass = 'ff-node--terminal'
  if (visual.shape === 'condition') shapeClass = 'ff-node--condition'

  const kindLabel =
    kind === 'start'
      ? 'Start'
      : kind === 'end'
        ? 'End'
        : kind.replace(/_/g, ' ')

  const className = [
    'ff-node',
    shapeClass,
    isEnd ? 'ff-node--terminal-exit' : '',
    `ff-node--${runtimeState}`,
    visited && runtimeState !== 'running' ? 'ff-node--visited' : '',
    isSelected ? 'ff-node--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const cssVars = {
    '--accent': visual.accent,
    '--accent-muted': visual.muted,
  } as CSSProperties

  const selectNode = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
    useUiStore.getState().setSelectedNodeId(id)
  }

  const statusPill = (
    <span className={`ff-status-pill ff-status-pill--${runtimeState}`}>
      {statusLabel(runtimeState)}
    </span>
  )

  let cardBody: ReactNode

  if (visual.shape === 'condition') {
    cardBody = (
      <div className="ff-node__diamond-shell">
        <div className="ff-node__diamond-face">
          <div className="ff-node__inner ff-node__inner--condition">
            <NodeKindIcon kind={kind} />
            <div className="ff-node__label">{label}</div>
            {statusPill}
            {failureMessage ? (
              <div className="ff-node__failure-msg ff-node__failure-msg--compact">{failureMessage}</div>
            ) : null}
          </div>
        </div>
      </div>
    )
  } else if (visual.shape === 'terminal') {
    cardBody = (
      <div className="ff-node__inner ff-node__inner--terminal">
        <NodeKindIcon kind={kind} />
        <div className="ff-node__label">{label}</div>
        {statusPill}
      </div>
    )
  } else {
    cardBody = (
      <div className="ff-node__card">
        <div className="ff-node__accent-bar" aria-hidden />
        <header className="ff-node__header">
          <span className="ff-node__icon-wrap">
            <NodeKindIcon kind={kind} />
          </span>
          <span className="ff-node__type">{kindLabel}</span>
        </header>
        <div className="ff-node__body">
          <div className="ff-node__label">{label}</div>
        </div>
        <footer className="ff-node__footer">
          {statusPill}
          {failureMessage ? (
            <div className="ff-node__failure-msg">{failureMessage}</div>
          ) : null}
        </footer>
      </div>
    )
  }

  const showPulse = runtimeState === 'running' || runtimeState === 'retrying'
  const healthTone =
    runtimeState === 'failed'
      ? 'error'
      : runtimeState === 'success'
        ? 'ok'
        : runtimeState === 'running'
          ? 'active'
          : 'idle'

  return (
    <div
      className={className}
      style={cssVars}
      role="button"
      tabIndex={0}
      onClick={selectNode}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          selectNode(e)
        }
      }}
    >
      {showPulse ? <span className="ff-node__pulse-ring" aria-hidden /> : null}
      {isSelected ? <span className="ff-node__selection-halo" aria-hidden /> : null}
      <NodeMetricsBadge metrics={nodeMetrics} visible={showMetrics} />
      <span
        className={`ff-node__health ff-node__health--${healthTone}`}
        title={`Runtime: ${runtimeState}`}
        aria-hidden
      />
      {!isStart ? (
        <Handle
          type="target"
          position={Position.Left}
          className="ff-handle ff-handle--target"
          isConnectable={false}
        />
      ) : null}

      {cardBody}

      {!isEnd ? (
        <Handle
          type="source"
          position={Position.Right}
          className="ff-handle ff-handle--source"
          isConnectable={false}
        />
      ) : null}
    </div>
  )
}
