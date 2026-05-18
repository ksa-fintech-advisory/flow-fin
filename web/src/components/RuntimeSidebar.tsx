import { NodeInspectorPanel } from './NodeInspectorPanel'
import { TimelinePanel } from './TimelinePanel'

/** Right rail: node inspector + event stream. */
export function RuntimeSidebar() {
  return (
    <aside className="ff-sidebar" aria-label="Inspector and event stream">
      <NodeInspectorPanel />
      <TimelinePanel />
    </aside>
  )
}
