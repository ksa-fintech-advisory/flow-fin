import { useEffect } from 'react'
import { useRuntimeStore } from '../stores/useRuntimeStore'

/** Decay propagation trails, animate transit packets, spawn concurrent flows. */
export function useRuntimeEffects() {
  const phase = useRuntimeStore((s) => s.phase)
  const decayTrails = useRuntimeStore((s) => s.decayTrails)
  const tickPackets = useRuntimeStore((s) => s.tickPackets)
  const maybeSpawnConcurrentPacket = useRuntimeStore((s) => s.maybeSpawnConcurrentPacket)

  useEffect(() => {
    const id = window.setInterval(() => {
      decayTrails()
      if (phase === 'running' || phase === 'paused') {
        tickPackets()
      }
    }, 80)
    return () => window.clearInterval(id)
  }, [phase, decayTrails, tickPackets])

  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      maybeSpawnConcurrentPacket()
    }, 2200)
    return () => window.clearInterval(id)
  }, [phase, maybeSpawnConcurrentPacket])
}
