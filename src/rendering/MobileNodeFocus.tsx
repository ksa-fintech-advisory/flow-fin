import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useUiStore } from '../stores/useUiStore'

/** Centers the viewport on the selected node in companion canvas mode. */
export function MobileNodeFocus({ enabled }: { enabled: boolean }) {
  const selectedNodeId = useUiStore((s) => s.selectedNodeId)
  const { getNode, setCenter } = useReactFlow()

  useEffect(() => {
    if (!enabled || !selectedNodeId) return
    const node = getNode(selectedNodeId)
    if (!node) return

    const width = node.width ?? 180
    const height = node.height ?? 72
    const x = node.position.x + width / 2
    const y = node.position.y + height / 2

    setCenter(x, y, { zoom: 1.05, duration: 380 })
  }, [enabled, selectedNodeId, getNode, setCenter])

  return null
}
