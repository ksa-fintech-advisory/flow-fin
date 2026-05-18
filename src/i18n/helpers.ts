import type { TFunction } from 'i18next'
import type { SimulationPhase } from '../stores/useRuntimeStore'
import type { CaseOutcome } from '../components/playgroundCaseUi'

export function phaseLabel(t: TFunction, phase: SimulationPhase): string {
  return t(`phase.${phase}`, { defaultValue: phase })
}

export function outcomeLabel(t: TFunction, outcome: CaseOutcome): string {
  return t(`outcome.${outcome}`)
}

export function scenarioTitle(t: TFunction, scenarioId: string, fallback: string): string {
  return t(`scenarios.${scenarioId}.title`, { defaultValue: fallback })
}

export function scenarioSubtitle(t: TFunction, scenarioId: string, fallback: string): string {
  return t(`scenarios.${scenarioId}.subtitle`, { defaultValue: fallback })
}

export function domainLabel(t: TFunction, domain: unknown): string {
  const key = typeof domain === 'string' && domain.length ? domain : 'general'
  return t(`domain.${key}`, { defaultValue: key })
}
