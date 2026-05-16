import type { FDLNodeKind } from '../fdl/types'

/** ELK uses axis-aligned boxes; circles/diamonds use square bboxes. */
export function elkBBoxForKind(kind: FDLNodeKind): {
  width: number
  height: number
} {
  switch (kind) {
    case 'start':
    case 'end':
      return { width: 80, height: 80 }
    case 'fraud_check':
    case 'routing':
      return { width: 140, height: 140 }
    default:
      return { width: 216, height: 88 }
  }
}
