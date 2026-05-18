import { NodeInspectorPanel } from './NodeInspectorPanel'
import { TimelinePanel } from './TimelinePanel'
import { useUiStore } from '../stores/useUiStore'

/** Right rail: node inspector + event stream (n8n-style). */
export function RuntimeSidebar() {
  const hasSelection = useUiStore((s) => s.selectedNodeId != null)

  return (
    <aside className={`ff-sidebar ${hasSelection ? 'ff-sidebar--inspect' : ''}`}>
      <NodeInspectorPanel />
      <TimelinePanel />
    </aside>
  )
}
