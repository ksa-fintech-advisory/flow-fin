import { create } from 'zustand'

interface UiStore {
  selectedNodeId: string | null
  speedMultiplier: number
  setSelectedNodeId: (id: string | null) => void
  setSpeedMultiplier: (m: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedNodeId: null,
  speedMultiplier: 1,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
}))
