import type { TFunction } from 'i18next'

export type CaseOutcome = 'success' | 'failure' | 'retry' | 'warning' | 'neutral'

export function outcomeLabels(t: TFunction): Record<CaseOutcome, string> {
  return {
    success: t('outcome.success'),
    failure: t('outcome.failure'),
    retry: t('outcome.retry'),
    warning: t('outcome.warning'),
    neutral: t('outcome.neutral'),
  }
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
