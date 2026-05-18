import type { RuntimePayload } from './runtimeTypes'

const STATUS_BY_STEP = [
  'initiated',
  'routing',
  'authorized',
  'captured',
  'settled',
] as const

export function parseEdgePayloadLabel(label: string | undefined): RuntimePayload | null {
  if (!label?.trim()) return null

  const amountMatch = label.match(/\$?([\d,]+(?:\.\d{2})?)/)
  const amount = amountMatch
    ? Number.parseFloat(amountMatch[1]!.replace(/,/g, ''))
    : 120

  const currency = label.includes('EUR') ? 'EUR' : label.includes('GBP') ? 'GBP' : 'USD'

  let status = 'in_flight'
  const lower = label.toLowerCase()
  if (lower.includes('decline') || lower.includes('fail')) status = 'declined'
  else if (lower.includes('auth')) status = 'authorized'
  else if (lower.includes('settle')) status = 'settled'
  else if (lower.includes('capture')) status = 'captured'

  return {
    amount: Number.isFinite(amount) ? amount : 120,
    currency,
    status,
    authorization: status === 'authorized' ? 'approved' : undefined,
  }
}

export function defaultTransitPayload(stepIndex: number): RuntimePayload {
  return {
    amount: 80 + (stepIndex % 5) * 40,
    currency: 'USD',
    status: STATUS_BY_STEP[stepIndex % STATUS_BY_STEP.length] ?? 'routing',
    authorization: stepIndex > 2 ? 'approved' : 'pending',
  }
}

export function payloadSummary(p: RuntimePayload): string {
  return `${p.currency} ${p.amount} · ${p.status}`
}
