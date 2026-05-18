import { useEffect, useRef } from 'react'
import type { RuntimeLogEntry } from '../runtime/mockNodeLogs'

type RuntimeLogStreamProps = {
  logs: RuntimeLogEntry[]
  emptyMessage?: string
  live?: boolean
  /** When true, logs scroll with the parent panel instead of a nested scroll area. */
  embedded?: boolean
  maxHeight?: number
}

function formatLogTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

export function RuntimeLogStream({
  logs,
  emptyMessage = 'Waiting for runtime activity…',
  live = false,
  embedded = false,
  maxHeight = 220,
}: RuntimeLogStreamProps) {
  const tailRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!live) return
    const el = tailRef.current
    if (!el) return
    if (embedded) {
      const panel = el.closest('.ff-node-inspector__body')
      if (panel instanceof HTMLElement) {
        panel.scrollTop = panel.scrollHeight
      }
      return
    }
    el.scrollTop = el.scrollHeight
  }, [logs, live, embedded])

  return (
    <div className="ff-runtime-log-stream">
      {live ? (
        <div className="ff-runtime-log-stream__live" aria-live="polite">
          <span className="ff-runtime-log-stream__live-dot" aria-hidden />
          Live
        </div>
      ) : null}
      <ul
        ref={tailRef}
        className={`ff-runtime-logs ff-runtime-logs--stream${embedded ? ' ff-runtime-logs--embedded' : ''}`}
        style={embedded ? undefined : { maxHeight }}
      >
        {logs.length === 0 ? (
          <li className="ff-runtime-logs__empty">{emptyMessage}</li>
        ) : (
          logs.map((log) => (
            <li
              key={log.id}
              className={`ff-runtime-logs__line ff-runtime-logs__line--${log.level}`}
            >
              <span className="ff-runtime-logs__meta">
                <span className="ff-runtime-logs__time">{formatLogTime(log.at)}</span>
                {log.category ? (
                  <span className="ff-runtime-logs__cat">{log.category}</span>
                ) : null}
              </span>
              <span className="ff-runtime-logs__msg">{log.message}</span>
              {log.detail ? (
                <span className="ff-runtime-logs__detail">{log.detail}</span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
