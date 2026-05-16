/**
 * Flow Definition Language — renderer- and backend-independent flow semantics.
 * Flows are graphs (nodes + edges), not sequential arrays.
 */

export type FDLNodeKind =
  | 'start'
  | 'end'
  | 'payment'
  | 'approval'
  | 'fraud_check'
  | 'retry'
  | 'settlement'
  | 'routing'
  | 'wallet'
  | 'reconciliation'

export interface FDLNode {
  id: string
  kind: FDLNodeKind
  label?: string
  metadata?: Record<string, unknown>
}

export interface FDLEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface SimulationConfig {
  /** Wall-clock delay between completed steps while running */
  stepDelayMs: number
  /** Ordered node ids for deterministic simulation along the main spine */
  sequence: string[]
}

export interface FlowDefinition {
  id: string
  name: string
  nodes: FDLNode[]
  edges: FDLEdge[]
  metadata?: Record<string, unknown>
  simulation?: SimulationConfig
}

/** Visual / simulation runtime state for a node */
export type RuntimeNodeState =
  | 'idle'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'paused'
  | 'retrying'
