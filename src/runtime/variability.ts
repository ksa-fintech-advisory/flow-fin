/** Operational jitter for step delays — keeps simulation organic without chaos. */
export function jitterStepDelay(baseMs: number, stepIndex: number, nodeId: string): number {
  const seed = (stepIndex * 17 + nodeId.length * 31) % 97
  const factor = 0.88 + (seed / 97) * 0.24
  return Math.round(baseMs * factor)
}

/** Occasionally extend delay to simulate queue backlog (≈12% of steps). */
export function queueDelayBonus(baseMs: number, stepIndex: number): number {
  if (stepIndex % 8 === 3) return Math.round(baseMs * 0.18)
  if (stepIndex % 11 === 7) return Math.round(baseMs * 0.12)
  return 0
}

/** Rare probabilistic micro-failure log line (does not change scripted outcome). */
export function shouldEmitRetrySignal(stepIndex: number, nodeId: string): boolean {
  const code = (stepIndex * 13 + nodeId.charCodeAt(0)) % 23
  return code === 5 || code === 17
}
