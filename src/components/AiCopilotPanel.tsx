import { useMemo } from 'react'
import { buildCopilotInsights } from '../runtime/copilotInsights'
import { useGraphStore } from '../stores/useGraphStore'
import { useRuntimeStore } from '../stores/useRuntimeStore'

export function AiCopilotPanel() {
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
    <section className="ff-copilot" aria-label="AI operations assistant">
      <header className="ff-copilot__head">
        <span className="ff-copilot__badge">AI Ops</span>
        <h2>Runtime copilot</h2>
        <p>Mocked operational intelligence · preview</p>
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
