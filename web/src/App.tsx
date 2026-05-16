import { useUiStore } from './stores/useUiStore'
import { useGraphStore } from './stores/useGraphStore'
import { FlowCanvas } from './rendering/FlowCanvas'
import { OrchestrationBar } from './components/OrchestrationBar'
import { TimelinePanel } from './components/TimelinePanel'

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
          Select a node to inspect FDL semantics · topology is deterministic Dagre (LR)
        </span>
      )}
    </footer>
  )
}

export default function App() {
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
