import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'
import { FlowCanvas } from '../rendering/FlowCanvas'
import { OrchestrationBar } from '../components/OrchestrationBar'
import { TimelinePanel } from '../components/TimelinePanel'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { useUiStore } from '../stores/useUiStore'

function InspectorStrip() {
  const selectedId = useUiStore((s) => s.selectedNodeId)
  const flow = useGraphStore((s) => s.flow)

  const node = selectedId
    ? flow.nodes.find((n) => n.id === selectedId)
    : undefined

  return (
    <footer className="ff-inspector">
      {node ? (
        <>
          <strong>{node.label ?? node.id}</strong>
          <span className="ff-inspector__muted">{node.kind}</span>
          {node.metadata && Object.keys(node.metadata).length ? (
            <span className="ff-inspector__meta">
              {JSON.stringify(node.metadata)}
            </span>
          ) : (
            <span className="ff-inspector__muted">No metadata on this node</span>
          )}
        </>
      ) : (
        <span className="ff-inspector__muted">
          Select a node to inspect FDL semantics · ELK orthogonal layout
        </span>
      )}
    </footer>
  )
}

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
        <TimelinePanel />
      </main>
      <InspectorStrip />
    </div>
  )
}
