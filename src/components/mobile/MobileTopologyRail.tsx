import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { NODE_VISUALS } from '../../rendering/nodeVisuals'
import { NodeKindIcon } from '../../rendering/nodeIcons'
import { useGraphStore } from '../../stores/useGraphStore'
import { useRuntimeStore } from '../../stores/useRuntimeStore'
import { useUiStore } from '../../stores/useUiStore'

/** Guided node chips for touch-first topology exploration. */
export function MobileTopologyRail() {
  const { t } = useTranslation()
  const flow = useGraphStore((s) => s.flow)
  const nodeStates = useRuntimeStore((s) => s.nodeStates)
  const selectedNodeId = useUiStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId)

  return (
    <nav className="ff-mobile-topology-rail" aria-label={t('aria.topologyNodes')}>
      <span className="ff-mobile-topology-rail__label">{t('common.nodes')}</span>
      <ul className="ff-mobile-topology-rail__list">
        {flow.nodes.map((node) => {
          const visual = NODE_VISUALS[node.kind]
          const state = nodeStates[node.id] ?? 'idle'
          const isSelected = selectedNodeId === node.id
          return (
            <li key={node.id}>
              <button
                type="button"
                className={`ff-mobile-node-chip${isSelected ? ' ff-mobile-node-chip--active' : ''}`}
                onClick={() => setSelectedNodeId(node.id)}
                aria-pressed={isSelected}
                style={
                  {
                    '--accent': visual.accent,
                    '--accent-muted': visual.muted,
                  } as CSSProperties
                }
              >
                <span
                  className="ff-mobile-node-chip__icon"
                  style={{ background: visual.muted, color: visual.accent }}
                >
                  <NodeKindIcon kind={node.kind} />
                </span>
                <span className="ff-mobile-node-chip__text">
                  <span className="ff-mobile-node-chip__label">{node.label ?? node.id}</span>
                  <span className={`ff-mobile-node-chip__state ff-mobile-node-chip__state--${state}`}>
                    {state}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
