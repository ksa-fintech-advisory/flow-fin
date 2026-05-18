import type { RuntimeNodeState } from '../fdl/types'

export interface RuntimePayload {
  amount: number
  currency: string
  status: string
  authorization?: string
}

export interface PropagationTrail {
  id: string
  edgeId: string
  opacity: number
  tone: 'active' | 'failed' | 'success'
  createdAt: number
}

export interface TransitPacket {
  id: string
  edgeId: string
  progress: number
  payload: RuntimePayload
  tone: 'neutral' | 'success' | 'warn' | 'error'
  label: string
}

export interface NodeOperationalMetrics {
  latencyMs: number
  retries: number
  successRate: number
  queuePressure: number
  feeAccumulated: number
  processingMs: number
}

export interface RuntimeSnapshot {
  cursor: number
  phase: 'idle' | 'running' | 'paused' | 'completed'
  nodeStates: Record<string, RuntimeNodeState>
  activeEdgeIds: string[]
  failedEdgeIds: string[]
  succeededEdgeIds: string[]
  failureReason: string | null
  nodeFailureMessages: Record<string, string>
  activeEdgePayloads: Record<string, string>
  propagationTrails: PropagationTrail[]
  nodeMetrics: Record<string, NodeOperationalMetrics>
}

export interface DomainZone {
  id: string
  label: string
  nodeIds: string[]
  accent: string
}
