import { useEffect } from 'react'
import { useRuntimeStore } from '../stores/useRuntimeStore'

/** Emits in-flight operational logs while nodes are in the `running` state. */
export function useRunningLogTicker() {
  const phase = useRuntimeStore((s) => s.phase)
  const pushRunningLogTicks = useRuntimeStore((s) => s.pushRunningLogTicks)

  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => pushRunningLogTicks(), 320)
    return () => window.clearInterval(id)
  }, [phase, pushRunningLogTicks])
}
