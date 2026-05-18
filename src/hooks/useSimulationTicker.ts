import { useEffect } from 'react'
import { jitterStepDelay, queueDelayBonus } from '../runtime/variability'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'

/**
 * Advances the simulation while phase is `running`.
 * Shared by desktop orchestration bar and adaptive companion UI.
 */
export function useSimulationTicker() {
  const flow = useGraphStore((s) => s.flow)
  const phase = useRuntimeStore((s) => s.phase)
  const cursor = useRuntimeStore((s) => s.cursor)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const advanceStep = useRuntimeStore((s) => s.advanceStep)
  const speedMultiplier = useUiStore((s) => s.speedMultiplier)

  const cases = flow.simulation?.cases

  useEffect(() => {
    if (phase !== 'running') return

    const base = flow.simulation?.stepDelayMs ?? 1000
    const seq =
      cases?.find((c) => c.id === activeCaseId)?.sequence ??
      flow.simulation?.sequence ??
      []
    const nodeId = cursor >= 0 && cursor < seq.length ? seq[cursor]! : 'start'
    const jittered = jitterStepDelay(base, Math.max(0, cursor), nodeId)
    const ms = Math.max(120, (jittered + queueDelayBonus(base, cursor)) / speedMultiplier)

    const id = window.setInterval(() => advanceStep(), ms)
    return () => window.clearInterval(id)
  }, [
    phase,
    flow.simulation?.stepDelayMs,
    speedMultiplier,
    advanceStep,
    cursor,
    activeCaseId,
    cases,
    flow.simulation?.sequence,
  ])
}
