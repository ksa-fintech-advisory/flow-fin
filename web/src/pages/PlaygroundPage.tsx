import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'
import { FlowCanvas } from '../rendering/FlowCanvas'
import { OrchestrationBar } from '../components/OrchestrationBar'
import { RuntimeSidebar } from '../components/RuntimeSidebar'
import { useGraphStore } from '../stores/useGraphStore'
import { useUiStore } from '../stores/useUiStore'

export function PlaygroundPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const setScenarioId = useGraphStore((s) => s.setScenarioId)

  const isValid =
    scenarioId != null && SCENARIOS.some((s) => s.id === scenarioId)

  // URL is the source of truth for which topology to render (no store lag).
  const flow = useMemo(() => {
    if (!scenarioId) return SCENARIOS[0]!.flow
    return SCENARIOS.find((s) => s.id === scenarioId)?.flow ?? SCENARIOS[0]!.flow
  }, [scenarioId])

  useLayoutEffect(() => {
    if (!isValid || !scenarioId) return
    setScenarioId(scenarioId)
    useUiStore.getState().setSelectedNodeId(null)
  }, [scenarioId, isValid, setScenarioId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useUiStore.getState().setSelectedNodeId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!scenarioId) {
    return <Navigate to={`/playground/${DEFAULT_SCENARIO_ID}`} replace />
  }

  if (!isValid) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="ff-shell ff-playground">
      <OrchestrationBar />
      <main className="ff-main">
        <FlowCanvas key={scenarioId} flow={flow} />
        <RuntimeSidebar />
      </main>
    </div>
  )
}
