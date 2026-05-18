import { create } from 'zustand'

export type InspectorTab =
  | 'overview'
  | 'config'
  | 'runtime'
  | 'logs'

interface UiStore {
  selectedNodeId: string | null
  inspectorTab: InspectorTab
  speedMultiplier: number
  setSelectedNodeId: (id: string | null) => void
  setInspectorTab: (tab: InspectorTab) => void
  setSpeedMultiplier: (m: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedNodeId: null,
  inspectorTab: 'overview',
  speedMultiplier: 1,
  setSelectedNodeId: (selectedNodeId) =>
    set((state) => ({
      selectedNodeId,
      inspectorTab:
        selectedNodeId != null && selectedNodeId !== state.selectedNodeId
          ? 'runtime'
          : state.inspectorTab,
    })),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
}))
