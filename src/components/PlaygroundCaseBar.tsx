import type { SimulationCase } from '../fdl/types'
import { useTranslation } from 'react-i18next'
import { PlaygroundTransportButton } from './PlaygroundTransportButton'
import { outcomeLabels, parseCaseLabel } from './playgroundCaseUi'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'

function CaseButton({
  simCase,
  isActive,
  disabled,
  onSelect,
}: {
  simCase: SimulationCase
  isActive: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const { outcome, title } = parseCaseLabel(simCase.label)

  return (
    <button
      type="button"
      className={`ff-case-btn ff-case-btn--${outcome}${isActive ? ' ff-case-btn--active' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isActive}
      title={simCase.context ?? title}
    >
      {title}
    </button>
  )
}

/** Bottom-center outcomes + prominent example for the selected case. */
export function PlaygroundCaseBar() {
  const { t } = useTranslation()
  const labels = outcomeLabels(t)
  const flow = useGraphStore((s) => s.flow)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const selectCase = useRuntimeStore((s) => s.selectCase)
  const phase = useRuntimeStore((s) => s.phase)
  const isRunning = phase === 'running'

  const cases = flow.simulation?.cases
  if (!cases?.length) return null

  const resolvedActiveId = activeCaseId ?? cases[0]?.id
  const activeCase = cases.find((c) => c.id === resolvedActiveId) ?? cases[0]
  const activeParsed = activeCase ? parseCaseLabel(activeCase.label) : null
  const outcome = activeParsed?.outcome ?? 'neutral'

  return (
    <div
      className={`ff-case-dock ff-case-dock--${outcome}`}
      role="region"
      aria-label={t('aria.simulationOutcomes')}
    >
      {activeCase?.context ? (
        <div className="ff-case-bar__example" id="playground-case-example">
          <div className="ff-case-bar__example-head">
            <span className="ff-case-bar__example-kicker">{t('playground.exampleScenario')}</span>
            {activeParsed ? (
              <span className={`ff-case-bar__example-badge ff-case-bar__example-badge--${outcome}`}>
                {labels[outcome]}
              </span>
            ) : null}
          </div>
          {activeParsed ? (
            <p className="ff-case-bar__example-outcome">{activeParsed.title}</p>
          ) : null}
          <p className="ff-case-bar__example-text">{activeCase.context}</p>
        </div>
      ) : null}

      <div className="ff-case-bar" role="toolbar" aria-label={t('playground.whatHappens')}>
        <span className="ff-case-bar__label">{t('playground.caseBarLabel')}</span>
        <div className="ff-case-bar__group" role="group" aria-describedby="playground-case-example">
          {cases.map((c) => (
            <CaseButton
              key={c.id}
              simCase={c}
              isActive={c.id === resolvedActiveId}
              disabled={isRunning}
              onSelect={() => selectCase(c.id)}
            />
          ))}
        </div>
        <div className="ff-case-bar__play">
          <PlaygroundTransportButton variant="dock" />
        </div>
      </div>
    </div>
  )
}
