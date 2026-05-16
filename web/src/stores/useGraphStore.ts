import { create } from 'zustand'
import type { FlowDefinition } from '../fdl/types'
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '../fdl/scenarios'

function flowForScenario(id: string): FlowDefinition {
  return SCENARIOS.find((s) => s.id === id)?.flow ?? SCENARIOS[0]!.flow
}

interface GraphStore {
  scenarioId: string
  flow: FlowDefinition
  setScenarioId: (id: string) => void
}

export const useGraphStore = create<GraphStore>((set) => ({
  scenarioId: DEFAULT_SCENARIO_ID,
  flow: flowForScenario(DEFAULT_SCENARIO_ID),
  setScenarioId: (id) => {
    if (!SCENARIOS.some((s) => s.id === id)) return
    set({ scenarioId: id, flow: flowForScenario(id) })
  },
}))
