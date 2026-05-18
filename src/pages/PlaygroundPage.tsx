import { useEffect, useLayoutEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { playgroundMeta } from '../brand/site'
import { MobilePlaygroundShell } from '../components/mobile/MobilePlaygroundShell'
import { PageMeta } from '../components/PageMeta'
import { SkipLink } from '../components/SkipLink'
import { OrchestrationBar } from '../components/OrchestrationBar'
import { PlaygroundScenarioStrip } from '../components/PlaygroundScenarioStrip'
import { RuntimeSidebar } from '../components/RuntimeSidebar'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'
import { useDeviceClass } from '../hooks/useDeviceClass'
import { useRunningLogTicker } from '../hooks/useRunningLogTicker'
import { useRuntimeEffects } from '../hooks/useRuntimeEffects'
import { useSimulationTicker } from '../hooks/useSimulationTicker'
import { FlowCanvas } from '../rendering/FlowCanvas'
import { useGraphStore } from '../stores/useGraphStore'
import { useUiStore } from '../stores/useUiStore'

function PlaygroundContent() {
  useRunningLogTicker()
  useRuntimeEffects()
  useSimulationTicker()

  const deviceClass = useDeviceClass()
  const isDesktop = deviceClass === 'desktop'

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

  if (!isDesktop) {
    return (
      <div
        className={`ff-shell ff-playground ff-playground--adaptive ff-playground--${deviceClass}`}
      >
        <PageMeta {...meta} />
        <SkipLink />
        <MobilePlaygroundShell flow={flow} scenarioId={scenarioId} deviceClass={deviceClass} />
      </div>
    )
  }

  return (
    <div className="ff-shell ff-playground">
      <PageMeta {...meta} />
      <SkipLink />
      <OrchestrationBar />
      <PlaygroundScenarioStrip />
      <main id="main-content" className="ff-main ff-playground__main" aria-label="Runtime topology playground">
        <FlowCanvas key={scenarioId} flow={flow} />
        <RuntimeSidebar />
      </main>
    </div>
  )
}

export function PlaygroundPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>()

  if (!scenarioId) {
    return <Navigate to={`/playground/${DEFAULT_SCENARIO_ID}`} replace />
  }

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)
  if (!scenario) {
    return <Navigate to="/" replace />
  }

  return <PlaygroundContent />
}
