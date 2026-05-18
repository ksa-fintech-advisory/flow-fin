import type { FDLNodeKind } from '../fdl/types'
import { FinancialNode } from './nodes/FinancialNode'

export const nodeTypes: Record<FDLNodeKind, typeof FinancialNode> = {
  start: FinancialNode,
  end: FinancialNode,
  payment: FinancialNode,
  fraud_check: FinancialNode,
  approval: FinancialNode,
  settlement: FinancialNode,
  retry: FinancialNode,
  routing: FinancialNode,
  wallet: FinancialNode,
  reconciliation: FinancialNode,
}
