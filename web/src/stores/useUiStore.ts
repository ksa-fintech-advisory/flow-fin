import { create } from 'zustand'

export type InspectorTab =
  | 'overview'
  | 'config'
  | 'runtime'
  | 'logs'

interface UiStore {
  selectedNodeId: string | null
  inspectorTab: InspectorTab
  inspectorCollapsed: boolean
  speedMultiplier: number
  setSelectedNodeId: (id: string | null) => void
  setInspectorTab: (tab: InspectorTab) => void
  setInspectorCollapsed: (collapsed: boolean) => void
  toggleInspectorCollapsed: () => void
  setSpeedMultiplier: (m: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedNodeId: null,
  inspectorTab: 'overview',
  inspectorCollapsed: false,
  speedMultiplier: 1,
  setSelectedNodeId: (selectedNodeId) =>
    set((state) => ({
      selectedNodeId,
      inspectorCollapsed:
        selectedNodeId != null ? false : state.inspectorCollapsed,
      inspectorTab:
        selectedNodeId != null && selectedNodeId !== state.selectedNodeId
          ? 'runtime'
          : state.inspectorTab,
    })),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setInspectorCollapsed: (inspectorCollapsed) => set({ inspectorCollapsed }),
  toggleInspectorCollapsed: () =>
    set((state) => ({ inspectorCollapsed: !state.inspectorCollapsed })),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
}))
