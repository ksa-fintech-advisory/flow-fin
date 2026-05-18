import { AiCopilotPanel } from '../AiCopilotPanel'
import { TimelinePanel } from '../TimelinePanel'

/** Full-height operational event stream for companion mode. */
export function MobileEventsView() {
  return (
    <div className="ff-mobile-events">
      <header className="ff-mobile-events__head">
        <h2>Operational trace</h2>
        <p>Live propagation events · transaction replay context</p>
      </header>
      <AiCopilotPanel />
      <TimelinePanel />
    </div>
  )
}
