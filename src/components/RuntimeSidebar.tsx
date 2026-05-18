import { useTranslation } from 'react-i18next'
import { AiCopilotPanel } from './AiCopilotPanel'
import { NodeInspectorPanel } from './NodeInspectorPanel'
import { TimelinePanel } from './TimelinePanel'

/** Right rail: node inspector + event stream. */
export function RuntimeSidebar() {
  const { t } = useTranslation()
  return (
    <aside className="ff-sidebar" aria-label={t('aria.inspectorSidebar')}>
      <AiCopilotPanel />
      <NodeInspectorPanel />
      <TimelinePanel />
    </aside>
  )
}
