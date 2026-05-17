import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'
import { FlowCanvas } from '../rendering/FlowCanvas'
import { OrchestrationBar } from '../components/OrchestrationBar'
import { RuntimeSidebar } from '../components/RuntimeSidebar'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'

export function PlaygroundPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const setScenarioId = useGraphStore((s) => s.setScenarioId)
  const resetRuntime = useRuntimeStore((s) => s.reset)

  const isValid =
    scenarioId != null && SCENARIOS.some((s) => s.id === scenarioId)

  useEffect(() => {
    if (!isValid || !scenarioId) return
    setScenarioId(scenarioId)
    resetRuntime()
    useUiStore.getState().setSelectedNodeId(null)
  }, [scenarioId, isValid, setScenarioId, resetRuntime])

  if (!scenarioId) {
    return <Navigate to={`/playground/${DEFAULT_SCENARIO_ID}`} replace />
  }

  if (!isValid) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="ff-shell">
      <OrchestrationBar />
      <main className="ff-main">
        <FlowCanvas />
        <RuntimeSidebar />
      </main>
    </div>
  )
}
