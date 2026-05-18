import { useTranslation } from 'react-i18next'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'

export function RuntimeTimelineControls() {
  const { t } = useTranslation()
  const flow = useGraphStore((s) => s.flow)
  const cursor = useRuntimeStore((s) => s.cursor)
  const phase = useRuntimeStore((s) => s.phase)
  const stepSnapshots = useRuntimeStore((s) => s.stepSnapshots)
  const activeCaseId = useRuntimeStore((s) => s.activeCaseId)
  const seekToStep = useRuntimeStore((s) => s.seekToStep)
  const replay = useRuntimeStore((s) => s.replay)
  const resume = useRuntimeStore((s) => s.resume)
  const pause = useRuntimeStore((s) => s.pause)

  const cases = flow.simulation?.cases
  const activeCase = cases?.find((c) => c.id === activeCaseId) ?? cases?.[0]
  const seqLen = activeCase?.sequence.length ?? flow.simulation?.sequence.length ?? 0
  const maxStep = Math.max(0, stepSnapshots.length - 1)
  const scrubValue = cursor < 0 ? 0 : Math.min(cursor, maxStep)

  const stepCurrent = cursor < 0 ? '—' : String(scrubValue + 1)
  const stepTotal = seqLen ? String(seqLen) : '—'

  const onScrub = (value: number) => {
    if (phase === 'running') pause()
    seekToStep(value)
  }

  return (
    <div className="ff-timeline-controls">
      <label className="ff-timeline-controls__scrub">
        <span>{t('common.timeline')}</span>
        <input
          type="range"
          min={0}
          max={Math.max(maxStep, seqLen - 1, 0)}
          value={scrubValue}
          disabled={maxStep === 0 && cursor < 0}
          onChange={(e) => onScrub(Number(e.target.value))}
          aria-valuetext={t('common.stepProgress', { current: stepCurrent, total: stepTotal })}
        />
        <span className="ff-timeline-controls__step">
          {t('common.stepProgress', { current: stepCurrent, total: stepTotal })}
        </span>
      </label>
      <div className="ff-timeline-controls__actions">
        <button type="button" className="ff-btn ff-btn--ghost" onClick={replay}>
          {t('common.replay')}
        </button>
        {phase === 'paused' ? (
          <button type="button" className="ff-btn ff-btn--ghost" onClick={resume}>
            {t('transport.resume')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
