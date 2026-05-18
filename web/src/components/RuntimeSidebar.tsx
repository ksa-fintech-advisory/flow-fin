import { NodeInspectorPanel } from './NodeInspectorPanel'
import { SidebarPanelIcon } from './SidebarPanelIcon'
import { TimelinePanel } from './TimelinePanel'
import { useUiStore } from '../stores/useUiStore'

/** Right rail: collapsible node inspector + event stream. */
export function RuntimeSidebar() {
  const hasSelection = useUiStore((s) => s.selectedNodeId != null)
  const collapsed = useUiStore((s) => s.inspectorCollapsed)
  const toggleInspectorCollapsed = useUiStore((s) => s.toggleInspectorCollapsed)

  return (
    <aside
      className={`ff-sidebar${collapsed ? ' ff-sidebar--collapsed' : ''}${hasSelection ? ' ff-sidebar--inspect' : ''}`}
      aria-label="Node inspector"
    >
      <button
        type="button"
        className="ff-sidebar__rail-toggle"
        onClick={toggleInspectorCollapsed}
        aria-expanded={!collapsed}
        aria-controls="ff-sidebar-panels"
        title={collapsed ? 'Expand inspector' : 'Collapse inspector'}
      >
        <SidebarPanelIcon collapsed={collapsed} />
        <span className="visually-hidden">
          {collapsed ? 'Expand inspector panel' : 'Collapse inspector panel'}
        </span>
      </button>

      {!collapsed ? (
        <div id="ff-sidebar-panels" className="ff-sidebar__panels">
          <NodeInspectorPanel />
          <TimelinePanel />
        </div>
      ) : null}
    </aside>
  )
}
