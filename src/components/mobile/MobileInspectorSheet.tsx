import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NodeInspectorPanel } from '../NodeInspectorPanel'
import { useUiStore } from '../../stores/useUiStore'

/** Bottom-sheet node inspector for touch-first companion mode. */
export function MobileInspectorSheet() {
  const { t } = useTranslation()
  const selectedNodeId = useUiStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId)

  useEffect(() => {
    if (!selectedNodeId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [selectedNodeId])

  if (!selectedNodeId) return null

  return (
    <div className="ff-mobile-sheet" role="dialog" aria-modal="true" aria-label={t('aria.nodeInspector')}>
      <button
        type="button"
        className="ff-mobile-sheet__backdrop"
        aria-label={t('aria.closeInspector')}
        onClick={() => setSelectedNodeId(null)}
      />
      <div className="ff-mobile-sheet__panel">
        <div className="ff-mobile-sheet__handle" aria-hidden />
        <NodeInspectorPanel />
      </div>
    </div>
  )
}
