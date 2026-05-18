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

/**
 * A single named simulation case — e.g. "Approved", "Declined", "Retry loop".
 * Each case defines a different sequence through the same topology.
 */
export interface SimulationCase {
  /** Short display name (appears in case picker) */
  id: string
  /** Human-readable label */
  label: string
  /** Ordered node ids this case walks through */
  sequence: string[]
  /** Final state for each node at end of this case ('success' | 'failed') */
  terminalStates?: Record<string, RuntimeNodeState>
  /**
   * Short failure reason shown on the originating failed node
   * and carried on response edge labels during decline propagation.
   * e.g. "Insufficient balance"
   */
  failureReason?: string
  /**
   * Per-node messages displayed during decline propagation.
   * Nodes not listed fall back to "Relaying: <failureReason>".
   */
  failureMessages?: Record<string, string>
  /**
   * Real-world transaction context for this simulation case.
   * Shown in the orchestration bar so the user understands
   * what is being simulated. e.g. "Customer pays $1,000.00 at an e-commerce merchant"
   */
  context?: string
  /**
   * Per-edge payload labels shown during simulation.
   * These represent the data "packet" traveling along each edge,
   * like Packet Tracer network packets.
   * Key = edge id, value = the payload label (e.g. "AUTH $1,000.00")
   */
  edgePayloads?: Record<string, string>
}

export interface SimulationConfig {
  /** Wall-clock delay between completed steps while running */
  stepDelayMs: number
  /**
   * Ordered node ids for deterministic simulation along the main spine.
   * @deprecated Use `cases` array instead. Kept for backward compat.
   */
  sequence: string[]
  /**
   * Multiple named simulation cases.
   * When present, the user can pick which case (path) to simulate.
   * The first case is the default.
   */
  cases?: SimulationCase[]
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
