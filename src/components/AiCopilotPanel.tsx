import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildCopilotInsights } from '../runtime/copilotInsights'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'

export function AiCopilotPanel() {
  const { t } = useTranslation()
  const flow = useGraphStore((s) => s.flow)
  const phase = useRuntimeStore((s) => s.phase)
  const failureReason = useRuntimeStore((s) => s.failureReason)
  const timeline = useRuntimeStore((s) => s.timeline)
  const nodeMetrics = useRuntimeStore((s) => s.nodeMetrics)
  const transitPackets = useRuntimeStore((s) => s.transitPackets)

  const insights = useMemo(
    () =>
      buildCopilotInsights({
        phase,
        failureReason,
        timeline,
        nodeMetrics,
        queueDepth: transitPackets.length,
        flowName: flow.name,
      }),
    [phase, failureReason, timeline, nodeMetrics, transitPackets.length, flow.name],
  )

  return (
    <section className="ff-copilot" aria-label={t('aria.aiCopilot')}>
      <header className="ff-copilot__head">
        <span className="ff-copilot__badge">{t('copilot.badge')}</span>
        <h2>{t('copilot.title')}</h2>
        <p>{t('copilot.subtitle')}</p>
      </header>
      <ul className="ff-copilot__list">
        {insights.map((item) => (
          <li key={item.id} className={`ff-copilot__item ff-copilot__item--${item.severity}`}>
            <p className="ff-copilot__title">{item.title}</p>
            <p className="ff-copilot__detail">{item.detail}</p>
            {item.action ? <p className="ff-copilot__action">{item.action}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
