import type { FDLNodeKind } from '../fdl/types'

/** Compact glyphs for node headers (editor-style, no external icon pack). */
export function NodeKindIcon({ kind }: { kind: FDLNodeKind }) {
  const paths: Record<FDLNodeKind, string> = {
    start: 'M12 8v8M8 12h8',
    end: 'M9 9l6 6M15 9l-6 6',
    payment: 'M6 10h12l-1 6H7l-1-6zm2-3h8l1 3H7l1-3z',
    fraud_check: 'M12 4l8 14H4L12 4zm0 6v3m0 2h.01',
    approval: 'M9 12l2 2 4-4M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z',
    settlement: 'M4 8h16M4 12h10M4 16h6',
    retry: 'M4 12a8 8 0 0113.3-6M20 12a8 8 0 01-13.3 6M8 8l-2-2m14 14l2 2',
    routing: 'M4 6h6v6H4zm10 0h6v6h-6zM9 17h6v5H9z',
    wallet: 'M4 8h14a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2zm14 4h2',
    reconciliation: 'M5 6h14M5 12h14M5 18h8',
  }

  return (
    <svg
      className="ff-node__icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[kind]} />
    </svg>
  )
}
