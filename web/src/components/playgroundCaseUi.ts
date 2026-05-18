export type CaseOutcome = 'success' | 'failure' | 'retry' | 'warning' | 'neutral'

export const OUTCOME_LABEL: Record<CaseOutcome, string> = {
  success: 'Approved',
  failure: 'Declined',
  retry: 'Retry',
  warning: 'Review',
  neutral: 'Path',
}

export function parseCaseLabel(label: string): { outcome: CaseOutcome; title: string } {
  const trimmed = label.trim()
  if (trimmed.startsWith('✓')) {
    return { outcome: 'success', title: trimmed.replace(/^✓\s*/, '') }
  }
  if (trimmed.startsWith('✗')) {
    return { outcome: 'failure', title: trimmed.replace(/^✗\s*/, '') }
  }
  if (trimmed.startsWith('⟲')) {
    return { outcome: 'retry', title: trimmed.replace(/^⟲\s*/, '') }
  }
  if (trimmed.startsWith('⚠')) {
    return { outcome: 'warning', title: trimmed.replace(/^⚠\s*/, '') }
  }
  return { outcome: 'neutral', title: trimmed }
}
