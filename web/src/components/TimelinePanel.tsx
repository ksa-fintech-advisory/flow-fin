import { useRuntimeStore } from '../stores/useRuntimeStore'

export function TimelinePanel() {
  const timeline = useRuntimeStore((s) => s.timeline)

  return (
    <aside className="ff-timeline">
      <header className="ff-timeline__head">
        <h2>Event stream</h2>
        <p>Operational trace · simulated</p>
      </header>
      <ol className="ff-timeline__list" aria-live="polite">
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
