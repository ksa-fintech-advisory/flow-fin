import { create } from 'zustand'

export type InspectorTab =
  | 'overview'
  | 'config'
  | 'runtime'
  | 'logs'

export type TopologyTheme =
  | 'dark-ops'
  | 'fintech-neon'
  | 'enterprise-infra'
  | 'runtime-terminal'

/** Adaptive companion panels (mobile / tablet). */
export type MobilePanel = 'topology' | 'events' | 'runtime'

interface UiStore {
  selectedNodeId: string | null
  inspectorTab: InspectorTab
  speedMultiplier: number
  topologyTheme: TopologyTheme
  mobilePanel: MobilePanel
  setSelectedNodeId: (id: string | null) => void
  setInspectorTab: (tab: InspectorTab) => void
  setSpeedMultiplier: (m: number) => void
  setTopologyTheme: (theme: TopologyTheme) => void
  setMobilePanel: (panel: MobilePanel) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedNodeId: null,
  inspectorTab: 'overview',
  speedMultiplier: 1,
  topologyTheme: 'dark-ops',
  mobilePanel: 'topology',
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
  setTopologyTheme: (topologyTheme) => set({ topologyTheme }),
  setMobilePanel: (mobilePanel) => set({ mobilePanel }),
}))
