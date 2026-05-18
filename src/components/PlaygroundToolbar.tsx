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
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="ff-playground-toolbar">
      <div className="ff-playground-toolbar__group">
        <button
          type="button"
          className="ff-playground-toolbar__btn"
          onClick={() => zoomIn({ duration: 200 })}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="ff-playground-toolbar__btn"
          onClick={() => zoomOut({ duration: 200 })}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="ff-playground-toolbar__btn"
          onClick={() => fitView({ padding: 0.2, duration: 380 })}
          disabled={!layoutReady}
          title="Fit view"
          aria-label="Fit view"
        >
          ⊡
        </button>
      </div>
      <div className="ff-playground-toolbar__meta">
        <span>{nodeCount} nodes</span>
        <span className="ff-playground-toolbar__sep">·</span>
        <span>{edgeCount} edges</span>
      </div>
    </div>
  )
}
