import { useTranslation } from 'react-i18next'
import type { FlowDefinition } from '../../fdl/types'
import type { DeviceClass } from '../../hooks/useDeviceClass'
import { FlowCanvas, type CanvasMode } from '../../rendering/FlowCanvas'
import { useUiStore } from '../../stores/useUiStore'
import { PlaygroundScenarioStrip } from '../PlaygroundScenarioStrip'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileEventsView } from './MobileEventsView'
import { MobileInspectorSheet } from './MobileInspectorSheet'
import { MobileOrchestrationBar } from './MobileOrchestrationBar'
import { MobileRuntimeDock } from './MobileRuntimeDock'
import { MobileRuntimeView } from './MobileRuntimeView'
import { MobileTopologyRail } from './MobileTopologyRail'

type MobilePlaygroundShellProps = {
  flow: FlowDefinition
  scenarioId: string
  deviceClass: DeviceClass
}

function canvasModeFor(deviceClass: DeviceClass): CanvasMode {
  if (deviceClass === 'mobile') return 'mobile'
  return 'tablet'
}

/**
 * Adaptive companion shell — runtime observability first, not shrunk desktop IDE.
 */
export function MobilePlaygroundShell({ flow, scenarioId, deviceClass }: MobilePlaygroundShellProps) {
  const { t } = useTranslation()
  const panel = useUiStore((s) => s.mobilePanel)

  const canvasMode = canvasModeFor(deviceClass)

  return (
    <>
      <MobileOrchestrationBar />
      <PlaygroundScenarioStrip />
      <main
        id="main-content"
        className="ff-mobile-main"
        aria-label={t('aria.runtimeCompanion')}
        data-panel={panel}
      >
        <section
          className={`ff-mobile-panel ff-mobile-panel--topology${panel === 'topology' ? ' ff-mobile-panel--active' : ''}`}
          aria-label={t('aria.topology')}
          aria-hidden={panel !== 'topology'}
        >
          <FlowCanvas key={scenarioId} flow={flow} canvasMode={canvasMode} />
          <MobileTopologyRail />
        </section>
        <section
          className={`ff-mobile-panel ff-mobile-panel--events${panel === 'events' ? ' ff-mobile-panel--active' : ''}`}
          aria-label={t('aria.eventStream')}
          aria-hidden={panel !== 'events'}
        >
          <MobileEventsView />
        </section>
        <section
          className={`ff-mobile-panel ff-mobile-panel--runtime${panel === 'runtime' ? ' ff-mobile-panel--active' : ''}`}
          aria-label={t('aria.runtimeControls')}
          aria-hidden={panel !== 'runtime'}
        >
          <MobileRuntimeView />
        </section>
      </main>
      <MobileRuntimeDock />
      <MobileBottomNav />
      <MobileInspectorSheet />
    </>
  )
}
