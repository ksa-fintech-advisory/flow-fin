import { NodeInspectorPanel } from './NodeInspectorPanel'
import { TimelinePanel } from './TimelinePanel'

/** Right rail: node inspector + event stream (n8n-style). */
export function RuntimeSidebar() {
  return (
    <aside className="ff-sidebar">
      <NodeInspectorPanel />
      <TimelinePanel />
    </aside>
  )
}
