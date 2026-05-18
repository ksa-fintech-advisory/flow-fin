import { useTranslation } from 'react-i18next'
import { scenarioSubtitle, scenarioTitle } from '../i18n/helpers'
import type { ScenarioMeta } from '../fdl/scenarios'

export function useScenarioDisplay(scenario: Pick<ScenarioMeta, 'id' | 'title' | 'subtitle'>) {
  const { t } = useTranslation()
  return {
    title: scenarioTitle(t, scenario.id, scenario.title),
    subtitle: scenarioSubtitle(t, scenario.id, scenario.subtitle),
  }
}
