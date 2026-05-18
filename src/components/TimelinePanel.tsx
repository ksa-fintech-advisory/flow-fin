import { useRuntimeStore } from '../stores/useRuntimeStore'

export function TimelinePanel() {
  const timeline = useRuntimeStore((s) => s.timeline)

  return (
    <aside className="ff-timeline">
      <header className="ff-timeline__head">
        <div className="ff-timeline__head-row">
          <h2>Event stream</h2>
          {timeline.length > 0 ? (
            <span className="ff-timeline__count">{timeline.length}</span>
          ) : null}
        </div>
        <p>Operational trace · simulated propagation</p>
      </header>
      <ol className="ff-timeline__list" aria-live="polite">
        {timeline.length === 0 ? (
          <li className="ff-timeline__empty">
            <span className="ff-timeline__empty-pulse" aria-hidden />
            <p>Runtime idle</p>
            <span>Start simulation to stream operational events across the topology</span>
          </li>
        ) : null}
        {[...timeline].reverse().map((entry) => (
          <li
            key={entry.id}
            className={`ff-timeline__item ff-timeline__item--${entry.tone}`}
          >
            <div className="ff-timeline__title">{entry.title}</div>
            {entry.detail ? (
              <div className="ff-timeline__detail">{entry.detail}</div>
            ) : null}
            <time className="ff-timeline__time">
              {new Date(entry.at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </time>
          </li>
        ))}
      </ol>
    </aside>
  )
}
