import type { SimulationCase } from '../fdl/types'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'
import { parseCaseLabel } from './playgroundCaseUi'

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
  const tooltip = simCase.context ? `${title}\n${simCase.context}` : title

  return (
    <button
      type="button"
      className={`ff-case-btn ff-case-btn--${outcome}${isActive ? ' ff-case-btn--active' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isActive}
      title={tooltip}
    >
      {title}
    </button>
  )
}

/** Bottom-center outcome chips on the canvas. */
export function PlaygroundCaseBar() {
  const flow = useGraphStore((s) => s.flow)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const selectCase = useRuntimeStore((s) => s.selectCase)
  const phase = useRuntimeStore((s) => s.phase)
  const isRunning = phase === 'running'

  const cases = flow.simulation?.cases
  if (!cases?.length) return null

  const resolvedActiveId = activeCaseId ?? cases[0]?.id

  return (
    <div className="ff-case-bar" role="toolbar" aria-label="What happens — simulation outcomes">
      <span className="ff-case-bar__label">What happens</span>
      <div className="ff-case-bar__group" role="group">
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
    </div>
  )
}
