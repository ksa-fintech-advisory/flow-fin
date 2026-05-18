import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'

type PlaygroundToolbarProps = {
  nodeCount: number
  edgeCount: number
  layoutReady: boolean
}

export function PlaygroundToolbar({
  nodeCount,
  edgeCount,
  layoutReady,
}: PlaygroundToolbarProps) {
  const { t } = useTranslation()
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="ff-playground-toolbar">
      <div className="ff-playground-toolbar__group">
        <button
          type="button"
          className="ff-playground-toolbar__btn"
          onClick={() => zoomIn({ duration: 200 })}
          title={t('common.zoomIn')}
          aria-label={t('common.zoomIn')}
        >
          +
        </button>
        <button
          type="button"
          className="ff-playground-toolbar__btn"
          onClick={() => zoomOut({ duration: 200 })}
          title={t('common.zoomOut')}
          aria-label={t('common.zoomOut')}
        >
          −
        </button>
        <button
          type="button"
          className="ff-playground-toolbar__btn"
          onClick={() => fitView({ padding: 0.2, duration: 380 })}
          disabled={!layoutReady}
          title={t('common.fitView')}
          aria-label={t('common.fitView')}
        >
          ⊡
        </button>
      </div>
      <div className="ff-playground-toolbar__meta">
        <span>{t('common.nodesCount', { count: nodeCount })}</span>
        <span className="ff-playground-toolbar__sep">·</span>
        <span>{t('common.edgesCount', { count: edgeCount })}</span>
      </div>
    </div>
  )
}
