import type { FDLNodeKind } from '../fdl/types'

/**
 * Content-aware node sizing for ELK layout.
 *
 * Nodes dynamically adapt to their label content rather than using rigid
 * fixed dimensions. This prevents text overflow and preserves visual balance
 * across the topology while giving each node the space it needs.
 *
 * Design constants:
 *   - CHAR_WIDTH_PX: approximate px per character at the node label font size
 *   - MIN/MAX constraints keep topology clean even for very short/long labels
 *   - Terminal and condition shapes use square bboxes (circles / diamonds)
 */

const CHAR_WIDTH_PX = 8.2     // average character width for 14px semi-bold
const HEADER_CHAR_PX = 6.8    // header type label is smaller font

// ── Process nodes ────────────────────────────────────────────────────────
const PROCESS_MIN_W = 180
const PROCESS_MAX_W = 320
const PROCESS_PAD_X = 48       // horizontal padding (accent bar + padding + icon)
const PROCESS_BASE_H = 108     // base height for single-line
const PROCESS_MULTILINE_H = 126 // height when label wraps

// ── Terminal nodes (start/end) ───────────────────────────────────────────
const TERMINAL_MIN = 80
const TERMINAL_MAX = 100

// ── Condition nodes (fraud_check/routing) ────────────────────────────────
const CONDITION_MIN = 140
const CONDITION_MAX = 170

/**
 * Returns the ELK bounding-box for a node, dynamically sized to fit its label.
 * Terminal and condition shapes remain square (circle/diamond rendering).
 * Process cards stretch horizontally to accommodate text without overflow.
 */
export function elkBBoxForKind(
  kind: FDLNodeKind,
  label?: string,
): { width: number; height: number } {
  switch (kind) {
    case 'start':
    case 'end': {
      // Terminal nodes: circle — scale slightly with label length
      const textW = (label?.length ?? 5) * CHAR_WIDTH_PX + 32
      const size = Math.max(TERMINAL_MIN, Math.min(TERMINAL_MAX, textW))
      return { width: size, height: size }
    }

    case 'fraud_check':
    case 'routing': {
      // Condition diamond: square bbox — scale with label
      const textW = (label?.length ?? 8) * CHAR_WIDTH_PX + 40
      const size = Math.max(CONDITION_MIN, Math.min(CONDITION_MAX, textW))
      return { width: size, height: size }
    }

    default: {
      // Process card: dynamic width based on label + type header
      const labelLen = label?.length ?? 10
      const kindLabel = kind.replace(/_/g, ' ')
      const headerW = kindLabel.length * HEADER_CHAR_PX + PROCESS_PAD_X + 20
      const bodyW = labelLen * CHAR_WIDTH_PX + PROCESS_PAD_X

      const contentW = Math.max(headerW, bodyW)
      const width = Math.max(PROCESS_MIN_W, Math.min(PROCESS_MAX_W, contentW))

      // Use taller height when the label is long enough to potentially wrap
      const height = labelLen > 22 ? PROCESS_MULTILINE_H : PROCESS_BASE_H

      return { width, height }
    }
  }
}
