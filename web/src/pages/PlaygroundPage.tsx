import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { playgroundMeta } from '../brand/site'
import { PageMeta } from '../components/PageMeta'
import { SkipLink } from '../components/SkipLink'
import { OrchestrationBar } from '../components/OrchestrationBar'
import { RuntimeSidebar } from '../components/RuntimeSidebar'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'
import { FlowCanvas } from '../rendering/FlowCanvas'
import { useGraphStore } from '../stores/useGraphStore'
import { useUiStore } from '../stores/useUiStore'

export function PlaygroundPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const setScenarioId = useGraphStore((s) => s.setScenarioId)

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId),
    [scenarioId],
  )

  const isValid = scenario != null

  const flow = useMemo(() => {
    if (!scenarioId) return SCENARIOS[0]!.flow
    return scenario?.flow ?? SCENARIOS[0]!.flow
  }, [scenarioId, scenario])

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

  const meta = playgroundMeta(scenario.id, scenario.title, scenario.subtitle)

  return (
    <div className="ff-shell ff-playground">
      <PageMeta {...meta} />
      <SkipLink />
      <OrchestrationBar />
      <main id="main-content" className="ff-main" aria-label="Runtime topology playground">
        <FlowCanvas key={scenarioId} flow={flow} />
        <RuntimeSidebar />
      </main>
    </div>
  )
}
