import type { FDLNodeKind } from '../fdl/types'

/**
 * Content-aware node sizing for ELK layout.
 *
 * Process cards: dynamic width based on label length (clamped to min/max).
 * Terminals (start/end): fixed circles.
 * Conditions (fraud_check/routing): fixed diamonds.
 */

const CHAR_PX = 8.4       // avg character width at 14px semi-bold
const PAD_X = 52           // horizontal padding (accent bar + icon + margins)

// Process
const PROC_MIN_W = 190
const PROC_MAX_W = 300
const PROC_H = 106

// Terminal
const TERM_SIZE = 84

// Condition (diamond)
const COND_SIZE = 148

export function elkBBoxForKind(
  kind: FDLNodeKind,
  label?: string,
): { width: number; height: number } {
  switch (kind) {
    case 'start':
    case 'end':
      return { width: TERM_SIZE, height: TERM_SIZE }

    case 'fraud_check':
    case 'routing':
      return { width: COND_SIZE, height: COND_SIZE }

    default: {
      const textW = (label?.length ?? 10) * CHAR_PX + PAD_X
      const w = Math.max(PROC_MIN_W, Math.min(PROC_MAX_W, textW))
      return { width: w, height: PROC_H }
    }
  }
}
